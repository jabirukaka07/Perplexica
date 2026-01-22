import { NextResponse } from 'next/server';

export async function POST() {
  // 登出主要在客户端处理（清除 localStorage 中的 token）
  // 这个 API 主要用于记录登出事件或未来扩展（如 token 黑名单）
  return NextResponse.json({ message: 'Logged out successfully' });
}
