import jwt from 'jsonwebtoken';

export interface UserJWTPayload {
  type: 'user';
  userId: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * 获取 JWT Secret
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return secret;
}

/**
 * 创建用户 JWT token
 */
export function createUserToken(user: {
  userId: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 天
  const secret = getJWTSecret();

  const payload: Omit<UserJWTPayload, 'iat' | 'exp'> = {
    type: 'user',
    userId: user.userId,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  };

  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  return { token, expiresAt };
}

/**
 * 验证并解析用户 token
 */
export function verifyUserToken(
  token: string | null | undefined
): UserJWTPayload | null {
  if (!token) return null;

  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as UserJWTPayload;

    if (decoded.type !== 'user') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * 从 token 中解码用户信息（不验证签名，用于客户端）
 */
export function decodeUserToken(token: string): UserJWTPayload | null {
  try {
    const decoded = jwt.decode(token) as UserJWTPayload;
    if (decoded?.type !== 'user') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
