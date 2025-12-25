import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearLoginAttempts,
  createAdminToken,
} from '@/lib/adminAuth';

/**
 * 管理员认证 API
 * POST /api/admin/auth
 *
 * 请求体:
 * {
 *   "password": "管理员密码"
 * }
 *
 * 响应:
 * 成功 200: { "token": "...", "expiresAt": timestamp, "message": "..." }
 * 失败 401: { "message": "Invalid credentials" }
 * 限流 429: { "message": "Too many attempts...", "retryAfter": seconds }
 * 未配置 503: { "message": "Admin authentication not configured" }
 */
export async function POST(req: NextRequest) {
  try {
    // 获取客户端IP
    const clientIP =
      req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 检查是否配置了管理员密码
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('⚠️  ADMIN_PASSWORD not set in environment variables');
      return NextResponse.json(
        { message: 'Admin authentication not configured' },
        { status: 503 }
      );
    }

    // 检查限流
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.warn(`[AdminAuth] Rate limited IP: ${clientIP}`);
      return NextResponse.json(
        {
          message: `Too many failed attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      );
    }

    // 验证密码
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      // 记录失败尝试
      recordFailedAttempt(clientIP);

      console.warn(`[AdminAuth] Failed login attempt from IP: ${clientIP}`);

      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 验证成功，清除失败记录
    clearLoginAttempts(clientIP);

    // 创建新token
    const { token, expiresAt } = createAdminToken();

    console.log(`[AdminAuth] ✅ Admin logged in from IP: ${clientIP}`);

    return NextResponse.json({
      token,
      expiresAt,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('[AdminAuth] Error in authentication:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
