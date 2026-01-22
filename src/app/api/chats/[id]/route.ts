import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/middleware/userAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;

    // 查找聊天并验证所有权
    const chatExists = await db.query.chats.findFirst({
      where: and(eq(chats.id, id), eq(chats.userId, user.userId)),
    });

    if (!chatExists) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, id),
    });

    return NextResponse.json(
      {
        chat: chatExists,
        messages: chatMessages,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in getting chat by id: ', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;

    // 查找聊天并验证所有权
    const chatExists = await db.query.chats.findFirst({
      where: and(eq(chats.id, id), eq(chats.userId, user.userId)),
    });

    if (!chatExists) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    await db.delete(chats).where(eq(chats.id, id)).execute();
    await db.delete(messages).where(eq(messages.chatId, id)).execute();

    return NextResponse.json(
      { message: 'Chat deleted successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in deleting chat by id: ', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
