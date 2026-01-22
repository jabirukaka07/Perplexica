import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl, isOIDCEnabled } from '@/lib/oidc/client';

export async function GET(req: NextRequest) {
  try {
    // 检查是否启用 OIDC
    if (!isOIDCEnabled()) {
      return NextResponse.json(
        { message: 'OIDC authentication is not enabled' },
        { status: 503 }
      );
    }

    // 生成授权 URL
    const { url, state, nonce, codeVerifier } = await generateAuthUrl();

    // 将 state、nonce 和 codeVerifier 存储到 cookie（用于回调验证）
    const response = NextResponse.redirect(url);
    response.cookies.set('oidc_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 分钟
    });
    response.cookies.set('oidc_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });
    response.cookies.set('oidc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error('[OIDC] Login error:', error);
    return NextResponse.json(
      { message: 'Failed to initiate login' },
      { status: 500 }
    );
  }
}
