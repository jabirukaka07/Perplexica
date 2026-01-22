'use client';

import { useState, useEffect, useCallback } from 'react';

const USER_TOKEN_KEY = 'userToken';
const USER_TOKEN_EXPIRY_KEY = 'userTokenExpiry';

interface User {
  userId: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

/**
 * 解析 JWT Token（客户端解码，不验证签名）
 */
function parseJWT(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    if (payload.type !== 'user') {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin,
    };
  } catch {
    return null;
  }
}

export function useAuth(): AuthState & {
  login: (token: string, expiresAt: number) => void;
  logout: () => void;
  getToken: () => string | null;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(USER_TOKEN_KEY);
  }, []);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return null;
    }

    const token = localStorage.getItem(USER_TOKEN_KEY);
    const expiryStr = localStorage.getItem(USER_TOKEN_EXPIRY_KEY);

    if (!token || !expiryStr) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    const expiry = parseInt(expiryStr, 10);
    if (Date.now() >= expiry) {
      // Token 已过期
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_TOKEN_EXPIRY_KEY);
      setUser(null);
      setIsLoading(false);
      return null;
    }

    // 解析 token 获取用户信息
    const parsed = parseJWT(token);
    setUser(parsed);
    setIsLoading(false);
    return parsed;
  }, []);

  const login = useCallback((token: string, expiresAt: number) => {
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem(USER_TOKEN_EXPIRY_KEY, expiresAt.toString());
    const parsed = parseJWT(token);
    setUser(parsed);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_TOKEN_EXPIRY_KEY);
    setUser(null);
    // 重定向到登录页面
    window.location.href = '/login';
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 处理 URL 参数中的 token（OIDC 回调）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const authExpires = params.get('auth_expires');

    if (authToken && authExpires) {
      login(authToken, parseInt(authExpires, 10));
      // 清除 URL 参数
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_token');
      url.searchParams.delete('auth_expires');
      window.history.replaceState({}, '', url.toString());
    }
  }, [login]);

  return {
    user,
    isLoading,
    isAdmin: user?.isAdmin || false,
    login,
    logout,
    getToken,
  };
}
