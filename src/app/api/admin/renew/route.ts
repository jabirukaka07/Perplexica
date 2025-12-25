import { NextRequest, NextResponse } from 'next/server';
import { renewAdminToken } from '@/lib/adminAuth';

/**
 * Token续期 API
 * POST /api/admin/renew
 *
 * 请求头:
 * Authorization: Bearer <token>
 *
 * 响应:
 * 成功 200: { "token": "新token", "expiresAt": timestamp, "message": "..." }
 * 失败 401: { "message": "Invalid or expired token" }
 */
export async function POST(req: NextRequest) {
  try {
    // 从请求头获取token
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const oldToken = authHeader.replace('Bearer ', '').trim();

    if (!oldToken) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 401 }
      );
    }

    // 尝试续期token
    const result = renewAdminToken(oldToken);

    if (!result) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log(`[AdminAuth] Token renewed successfully`);

    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt,
      message: 'Token renewed successfully',
    });
  } catch (error) {
    console.error('[AdminAuth] Error in token renewal:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
