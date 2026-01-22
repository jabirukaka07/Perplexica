import db from '../db';
import { users, OIDCProfile } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isAdminEmail } from '../oidc/client';

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  oidcProfile: OIDCProfile | null;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string;
  authProvider: string;
}

/**
 * 创建或更新用户
 */
export async function upsertUser(oidcProfile: {
  sub: string;
  email: string;
  name?: string;
  avatar?: string;
  profile: Record<string, unknown>;
}): Promise<UserData> {
  const isAdmin = isAdminEmail(oidcProfile.email);
  const now = new Date().toISOString();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, oidcProfile.sub))
    .limit(1);

  const userData: UserData = {
    id: oidcProfile.sub,
    email: oidcProfile.email,
    name: oidcProfile.name || oidcProfile.email,
    avatar: oidcProfile.avatar || null,
    oidcProfile: {
      sub: oidcProfile.sub,
      ...oidcProfile.profile,
    } as OIDCProfile,
    isAdmin,
    lastLoginAt: now,
    createdAt: existing.length > 0 ? existing[0].createdAt : now,
    authProvider: 'oidc',
  };

  if (existing.length > 0) {
    // 更新现有用户
    await db
      .update(users)
      .set({
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        oidcProfile: userData.oidcProfile,
        isAdmin: userData.isAdmin,
        lastLoginAt: userData.lastLoginAt,
      })
      .where(eq(users.id, oidcProfile.sub));
  } else {
    // 创建新用户
    await db.insert(users).values({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      oidcProfile: userData.oidcProfile,
      isAdmin: userData.isAdmin,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
      authProvider: userData.authProvider,
    });
  }

  return userData;
}

/**
 * 根据用户 ID 获取用户信息
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    oidcProfile: user.oidcProfile,
    isAdmin: user.isAdmin ?? false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    authProvider: user.authProvider,
  };
}

/**
 * 根据邮箱获取用户信息
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    oidcProfile: user.oidcProfile,
    isAdmin: user.isAdmin ?? false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    authProvider: user.authProvider,
  };
}

/**
 * 创建 Mock 用户（用于开发环境）
 */
export async function upsertMockUser(mockUser: {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
}): Promise<UserData> {
  const now = new Date().toISOString();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, mockUser.sub))
    .limit(1);

  const userData: UserData = {
    id: mockUser.sub,
    email: mockUser.email,
    name: mockUser.name,
    avatar: null,
    oidcProfile: { sub: mockUser.sub },
    isAdmin: mockUser.isAdmin,
    lastLoginAt: now,
    createdAt: existing.length > 0 ? existing[0].createdAt : now,
    authProvider: 'mock',
  };

  if (existing.length > 0) {
    await db
      .update(users)
      .set({
        email: userData.email,
        name: userData.name,
        isAdmin: userData.isAdmin,
        lastLoginAt: userData.lastLoginAt,
      })
      .where(eq(users.id, mockUser.sub));
  } else {
    await db.insert(users).values({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      oidcProfile: userData.oidcProfile,
      isAdmin: userData.isAdmin,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
      authProvider: userData.authProvider,
    });
  }

  return userData;
}
