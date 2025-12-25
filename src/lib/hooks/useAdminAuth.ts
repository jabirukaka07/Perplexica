import { useState, useEffect, useCallback } from 'react';

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_TOKEN_EXPIRY_KEY = 'adminTokenExpiry';

/**
 * 管理员认证状态管理 Hook
 *
 * 功能：
 * - 检查localStorage中的token是否有效
 * - 自动续期即将过期的token
 * - 提供登录/登出方法
 */
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  /**
   * 检查并验证当前token
   */
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const expiryStr = localStorage.getItem(ADMIN_TOKEN_EXPIRY_KEY);

    if (!token || !expiryStr) {
      setIsAdmin(false);
      setIsChecking(false);
      return false;
    }

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();

    // Token已过期
    if (now >= expiry) {
      console.log('[AdminAuth] Token expired, logging out');
      logout();
      return false;
    }

    // Token即将过期（还剩1小时），尝试续期
    if (expiry - now < 60 * 60 * 1000) {
      console.log('[AdminAuth] Token expiring soon, renewing...');
      renewToken(token);
    }

    setIsAdmin(true);
    setIsChecking(false);
    return true;
  }, []);

  /**
   * 续期token
   */
  const renewToken = async (token: string) => {
    try {
      const res = await fetch('/api/admin/renew', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_TOKEN_EXPIRY_KEY, data.expiresAt.toString());
        console.log('[AdminAuth] Token renewed successfully');
      } else {
        console.warn('[AdminAuth] Failed to renew token, will need to re-login');
      }
    } catch (error) {
      console.error('[AdminAuth] Error renewing token:', error);
    }
  };

  /**
   * 登录
   */
  const login = useCallback((token: string, expiresAt: number) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_TOKEN_EXPIRY_KEY, expiresAt.toString());
    setIsAdmin(true);
    console.log('[AdminAuth] Logged in as admin');
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_EXPIRY_KEY);
    setIsAdmin(false);
    console.log('[AdminAuth] Logged out from admin mode');
  }, []);

  /**
   * 获取当前token（用于API请求）
   */
  const getToken = useCallback((): string | null => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();

    // 每5分钟检查一次token状态
    const interval = setInterval(() => {
      checkAuth();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  return {
    isAdmin,
    isChecking,
    login,
    logout,
    getToken,
    checkAuth,
  };
}
