import * as client from 'openid-client';
import configManager from '../config';

let issuerConfig: client.Configuration | null = null;

export interface OIDCUserInfo {
  sub: string;
  email: string;
  name?: string;
  avatar?: string;
  profile: Record<string, unknown>;
}

/**
 * 获取 OIDC 配置
 */
export function getOIDCConfig() {
  return configManager.getConfig('oidc');
}

/**
 * 检查 OIDC 是否已启用
 */
export function isOIDCEnabled(): boolean {
  const config = getOIDCConfig();
  return config?.enabled === true && !!config.issuer && !!config.clientId;
}

/**
 * 获取或创建 OIDC 配置
 */
async function getIssuerConfig(): Promise<client.Configuration> {
  if (issuerConfig) return issuerConfig;

  const config = getOIDCConfig();

  if (!config?.enabled) {
    throw new Error('OIDC is not enabled');
  }

  if (!config.issuer || !config.clientId || !config.clientSecret) {
    throw new Error('OIDC configuration is incomplete');
  }

  try {
    issuerConfig = await client.discovery(
      new URL(config.issuer),
      config.clientId,
      config.clientSecret
    );
    return issuerConfig;
  } catch (error) {
    console.error('[OIDC] Failed to discover issuer:', error);
    throw new Error('Failed to discover OIDC issuer');
  }
}

/**
 * 生成授权 URL
 */
export async function generateAuthUrl(): Promise<{
  url: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}> {
  const issuer = await getIssuerConfig();
  const config = getOIDCConfig();

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const parameters: Record<string, string> = {
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  };

  const redirectTo = client.buildAuthorizationUrl(issuer, parameters);

  return {
    url: redirectTo.href,
    state,
    nonce,
    codeVerifier,
  };
}

/**
 * 处理回调并验证 token
 */
export async function handleCallback(
  currentUrl: URL,
  savedState: string,
  savedNonce: string,
  codeVerifier: string
): Promise<OIDCUserInfo> {
  const issuer = await getIssuerConfig();
  const config = getOIDCConfig();

  const tokens = await client.authorizationCodeGrant(issuer, currentUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState: savedState,
    expectedNonce: savedNonce,
  });

  const claims = tokens.claims();
  
  if (!claims) {
    throw new Error('No claims in token');
  }

  // 获取 userinfo
  let userinfo: Record<string, unknown> = {};
  try {
    userinfo = await client.fetchUserInfo(issuer, tokens.access_token!, claims.sub);
  } catch {
    // userinfo endpoint 可能不可用，使用 claims
    userinfo = claims as Record<string, unknown>;
  }

  return {
    sub: claims.sub,
    email: (userinfo.email || claims.email) as string,
    name: (userinfo.name || claims.name || userinfo.preferred_username || claims.preferred_username) as string | undefined,
    avatar: (userinfo.picture || claims.picture) as string | undefined,
    profile: { ...claims, ...userinfo },
  };
}

/**
 * 检查邮箱是否为管理员
 */
export function isAdminEmail(email: string): boolean {
  const config = getOIDCConfig();
  const adminEmails = config?.adminEmails || [];
  return adminEmails.some((e: string) => e.toLowerCase() === email.toLowerCase());
}

/**
 * 重置 OIDC 配置（用于配置更新后）
 */
export function resetOIDCClient(): void {
  issuerConfig = null;
}
