import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * 管理员会话管理
 * 使用 JWT Token 实现无状态认证
 */

interface LoginAttempt {
  count: number;
  resetAt: number;
}

interface JWTPayload {
  type: 'admin';
  iat?: number;
  exp?: number;
}

// 登录尝试记录（防暴力破解）
const loginAttempts = new Map<string, LoginAttempt>();

// 定时清理过期的登录尝试记录
setInterval(() => {
  const now = Date.now();

  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.resetAt < now) {
      loginAttempts.delete(ip);
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 获取 JWT Secret（从环境变量）
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error('JWT_SECRET or ADMIN_PASSWORD must be set in environment variables');
  }

  return secret;
}

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
 * 创建新的管理员 JWT token
 */
export function createAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时
  const secret = getJWTSecret();

  const payload: JWTPayload = {
    type: 'admin',
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: '24h',
  });

  console.log(`[AdminAuth] Created new admin token, expires at: ${new Date(expiresAt).toISOString()}`);

  return { token, expiresAt };
}

/**
 * 验证管理员 JWT token 是否有效
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // 验证 payload 类型
    if (decoded.type !== 'admin') {
      console.warn('[AdminAuth] Invalid token type:', decoded.type);
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[AdminAuth] Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('[AdminAuth] Invalid token:', error.message);
    } else {
      console.error('[AdminAuth] Token verification failed:', error);
    }
    return false;
  }
}

/**
 * 续期 JWT token（重新签发新token）
 */
export function renewAdminToken(token: string): { token: string; expiresAt: number } | null {
  // 首先验证旧 token 是否有效
  if (!verifyAdminToken(token)) {
    return null;
  }

  // 验证通过，签发新 token
  const result = createAdminToken();
  console.log('[AdminAuth] Token renewed successfully');

  return result;
}
