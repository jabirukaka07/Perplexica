import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, UserJWTPayload } from '@/lib/userAuth';

/**
 * 从请求中提取 Bearer Token
 */
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '').trim();
}

/**
 * 要求用户已登录（任何用户）
 */
export function requireUser<T = unknown>(
  handler: (
    req: NextRequest,
    user: UserJWTPayload,
    context?: T
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const token = extractToken(req);
    const user = verifyUserToken(token);

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, user, context);
  };
}

/**
 * 要求管理员权限
 */
export function requireAdmin<T = unknown>(
  handler: (
    req: NextRequest,
    user: UserJWTPayload,
    context?: T
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const token = extractToken(req);
    const user = verifyUserToken(token);

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { message: 'Admin privileges required' },
        { status: 403 }
      );
    }

    return handler(req, user, context);
  };
}

/**
 * 从请求中提取用户信息（可选，不强制认证）
 */
export function getUserFromRequest(req: NextRequest): UserJWTPayload | null {
  const token = extractToken(req);
  return verifyUserToken(token);
}

/**
 * 检查请求是否来自管理员
 */
export function isAdminRequest(req: NextRequest): boolean {
  const user = getUserFromRequest(req);
  return user?.isAdmin === true;
}
