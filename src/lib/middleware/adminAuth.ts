import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

/**
 * 管理员权限中间件
 * 包装需要管理员权限的API处理函数
 *
 * 使用方式:
 * export const POST = requireAdmin(async (req) => {
 *   // 受保护的逻辑
 * });
 */
export function requireAdmin(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse> | Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    // 从请求头获取token
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Admin authentication required. Please login as administrator.' },
        { status: 403 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // 验证token
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { message: 'Invalid or expired admin token. Please login again.' },
        { status: 403 }
      );
    }

    // Token有效，执行原处理函数
    return handler(req, context);
  };
}

/**
 * 检查请求是否包含有效的管理员token（用于条件性权限检查）
 */
export function isAdminRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  return verifyAdminToken(token);
}
