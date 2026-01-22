import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/middleware/userAuth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 },
      );
    }

    // 只返回当前用户的聊天记录
    let userChats = await db.query.chats.findMany({
      where: eq(chats.userId, user.userId),
    });
    userChats = userChats.reverse();
    return NextResponse.json({ chats: userChats }, { status: 200 });
  } catch (err) {
    console.error('Error in getting chats: ', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
