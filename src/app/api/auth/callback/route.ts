import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/oidc/client';
import { upsertUser } from '@/lib/user/manager';
import { createUserToken } from '@/lib/userAuth';

export async function GET(req: NextRequest) {
  try {
    // 获取回调参数
    const currentUrl = new URL(req.url);
    const error = currentUrl.searchParams.get('error');

    // 检查 OIDC 错误
    if (error) {
      const errorDescription = currentUrl.searchParams.get('error_description');
      console.error('[OIDC] Provider error:', error, errorDescription);
      return redirectToLoginWithError(req, 'provider_error');
    }

    // 从 cookie 读取 state、nonce 和 codeVerifier
    const savedState = req.cookies.get('oidc_state')?.value;
    const savedNonce = req.cookies.get('oidc_nonce')?.value;
    const codeVerifier = req.cookies.get('oidc_code_verifier')?.value;

    if (!savedState || !savedNonce || !codeVerifier) {
      console.error('[OIDC] Missing state, nonce, or codeVerifier in cookies');
      return redirectToLoginWithError(req, 'session_expired');
    }

    // 验证 OIDC 回调
    const oidcProfile = await handleCallback(
      currentUrl,
      savedState,
      savedNonce,
      codeVerifier
    );

    // 创建或更新用户记录
    const user = await upsertUser(oidcProfile);

    // 签发 JWT token
    const { token, expiresAt } = createUserToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: user.isAdmin,
    });

    // 重定向到前端，携带 token
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('auth_token', token);
    redirectUrl.searchParams.set('auth_expires', expiresAt.toString());

    const response = NextResponse.redirect(redirectUrl);

    // 清除临时 cookie
    response.cookies.delete('oidc_state');
    response.cookies.delete('oidc_nonce');
    response.cookies.delete('oidc_code_verifier');

    return response;
  } catch (error) {
    console.error('[OIDC] Callback error:', error);
    return redirectToLoginWithError(
      req,
      error instanceof Error ? error.message : 'auth_failed'
    );
  }
}

function redirectToLoginWithError(
  req: NextRequest,
  error: string
): NextResponse {
  const errorUrl = new URL('/login', req.url);
  errorUrl.searchParams.set('error', error);

  const response = NextResponse.redirect(errorUrl);
  response.cookies.delete('oidc_state');
  response.cookies.delete('oidc_nonce');
  response.cookies.delete('oidc_code_verifier');

  return response;
}
