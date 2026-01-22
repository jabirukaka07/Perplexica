import { NextRequest, NextResponse } from 'next/server';
import { createUserToken } from '@/lib/userAuth';
import { upsertMockUser } from '@/lib/user/manager';
import configManager from '@/lib/config';

// GET: 获取 Mock 用户列表
export async function GET() {
  // 仅在开发环境启用
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { message: 'Mock login only available in development' },
      { status: 403 }
    );
  }

  const mockEnabled = configManager.getConfig('mockAuth.enabled', false);
  if (!mockEnabled) {
    return NextResponse.json(
      { message: 'Mock authentication is not enabled', users: [] },
      { status: 200 }
    );
  }

  const mockUsers = configManager.getConfig('mockAuth.users', []);

  // 返回用户列表（不包含敏感信息）
  return NextResponse.json({
    enabled: true,
    users: mockUsers.map((u: { sub: string; email: string; name: string; isAdmin: boolean }) => ({
      sub: u.sub,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
    })),
  });
}

// POST: Mock 登录
export async function POST(req: NextRequest) {
  try {
    // 仅在开发环境启用
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { message: 'Mock login only available in development' },
        { status: 403 }
      );
    }

    const mockEnabled = configManager.getConfig('mockAuth.enabled', false);
    if (!mockEnabled) {
      return NextResponse.json(
        { message: 'Mock authentication is not enabled' },
        { status: 503 }
      );
    }

    // 从请求体获取 mock 用户 ID
    const body = await req.json();
    const { mockUserId } = body;

    if (!mockUserId) {
      return NextResponse.json(
        { message: 'mockUserId is required' },
        { status: 400 }
      );
    }

    // 查找 mock 用户配置
    const mockUsers = configManager.getConfig('mockAuth.users', []);
    const mockUser = mockUsers.find(
      (u: { sub: string }) => u.sub === mockUserId
    );

    if (!mockUser) {
      return NextResponse.json({ message: 'Mock user not found' }, { status: 404 });
    }

    // 创建或更新 mock 用户
    const user = await upsertMockUser(mockUser);

    // 签发 JWT token
    const { token, expiresAt } = createUserToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('[MockAuth] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
