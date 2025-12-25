import crypto from 'crypto';

/**
 * 管理员会话管理
 * 使用内存存储活跃的管理员token（生产环境建议使用Redis）
 */

interface Session {
  expiresAt: number;
  createdAt: number;
}

interface LoginAttempt {
  count: number;
  resetAt: number;
}

// 活跃会话存储
const activeSessions = new Map<string, Session>();

// 登录尝试记录（防暴力破解）
const loginAttempts = new Map<string, LoginAttempt>();

// 定时清理过期token和登录记录
setInterval(() => {
  const now = Date.now();

  // 清理过期的会话token
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
      console.log(`[AdminAuth] Cleaned expired token: ${token.substring(0, 8)}...`);
    }
  }

  // 清理过期的登录尝试记录
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.resetAt < now) {
      loginAttempts.delete(ip);
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 验证管理员密码
 * 使用 crypto.timingSafeEqual 防止时序攻击
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn('⚠️  ADMIN_PASSWORD not set in environment variables');
    return false;
  }

  try {
    const passwordBuffer = Buffer.from(password || '', 'utf8');
    const adminPasswordBuffer = Buffer.from(adminPassword, 'utf8');

    // 长度不同直接返回false
    if (passwordBuffer.length !== adminPasswordBuffer.length) {
      return false;
    }

    // 使用时间安全的比较函数
    return crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer);
  } catch (error) {
    console.error('[AdminAuth] Error verifying password:', error);
    return false;
  }
}

/**
 * 检查IP是否被限流
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return { allowed: true };
  }

  const now = Date.now();

  // 超过5次尝试且还在限流期内
  if (attempt.count >= 5 && now < attempt.resetAt) {
    const retryAfter = Math.ceil((attempt.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // 限流期已过，清除记录
  if (now >= attempt.resetAt) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * 记录失败的登录尝试
 */
export function recordFailedAttempt(ip: string): void {
  const current = loginAttempts.get(ip);

  if (!current) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: Date.now() + 15 * 60 * 1000, // 15分钟后重置
    });
  } else {
    loginAttempts.set(ip, {
      count: current.count + 1,
      resetAt: Date.now() + 15 * 60 * 1000,
    });
  }

  console.log(`[AdminAuth] Failed attempt from ${ip}, count: ${current ? current.count + 1 : 1}`);
}

/**
 * 清除IP的登录尝试记录（登录成功时调用）
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * 创建新的管理员token
 */
export function createAdminToken(): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时

  activeSessions.set(token, {
    expiresAt,
    createdAt: Date.now(),
  });

  console.log(`[AdminAuth] Created new token: ${token.substring(0, 8)}..., expires at ${new Date(expiresAt).toISOString()}`);

  return { token, expiresAt };
}

/**
 * 验证管理员token是否有效
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;

  const session = activeSessions.get(token);
  if (!session) return false;

  // 检查是否过期
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return false;
  }

  return true;
}

/**
 * 续期token（延长过期时间）
 */
export function renewAdminToken(token: string): { token: string; expiresAt: number } | null {
  const session = activeSessions.get(token);

  if (!session) return null;

  // 检查是否过期
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }

  // 创建新token
  const newToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  // 删除旧token
  activeSessions.delete(token);

  // 保存新token
  activeSessions.set(newToken, {
    expiresAt,
    createdAt: Date.now(),
  });

  console.log(`[AdminAuth] Renewed token: ${token.substring(0, 8)}... -> ${newToken.substring(0, 8)}...`);

  return { token: newToken, expiresAt };
}

/**
 * 撤销token（登出时调用）
 */
export function revokeAdminToken(token: string): boolean {
  const deleted = activeSessions.delete(token);

  if (deleted) {
    console.log(`[AdminAuth] Revoked token: ${token.substring(0, 8)}...`);
  }

  return deleted;
}

/**
 * 获取活跃会话数量（用于监控）
 */
export function getActiveSessionCount(): number {
  return activeSessions.size;
}
