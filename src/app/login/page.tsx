'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface MockUser {
  sub: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [mockUsers, setMockUsers] = useState<MockUser[]>([]);
  const [mockEnabled, setMockEnabled] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查 URL 错误参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
      // 清除错误参数
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  // 加载 Mock 用户列表（仅开发环境）
  useEffect(() => {
    fetch('/api/auth/mock')
      .then((res) => res.json())
      .then((data) => {
        setMockEnabled(data.enabled || false);
        setMockUsers(data.users || []);
      })
      .catch(() => {
        setMockEnabled(false);
        setMockUsers([]);
      });
  }, []);

  const handleOIDCLogin = () => {
    setLoginLoading(true);
    setError(null);
    window.location.href = '/api/auth/login';
  };

  const handleMockLogin = async (mockUserId: string) => {
    setLoginLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await res.json();
      login(data.token, data.expiresAt);
      
      // 使用强制刷新跳转，避免状态同步问题
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary p-4">
      <div className="w-full max-w-md p-8 bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg border border-light-200 dark:border-dark-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            Perplexica
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Sign in to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* OIDC 登录按钮 */}
        <button
          onClick={handleOIDCLogin}
          disabled={loginLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loginLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign in with Company Account
            </>
          )}
        </button>

        {/* 开发环境 Mock 登录 */}
        {mockEnabled && mockUsers.length > 0 && (
          <div className="mt-8 pt-6 border-t border-light-200 dark:border-dark-200">
            <p className="text-xs text-black/50 dark:text-white/50 mb-4 text-center">
              Development Mode - Mock Login
            </p>
            <div className="space-y-2">
              {mockUsers.map((mockUser) => (
                <button
                  key={mockUser.sub}
                  onClick={() => handleMockLogin(mockUser.sub)}
                  disabled={loginLoading}
                  className="w-full py-2 px-4 bg-light-100 dark:bg-dark-100 hover:bg-light-200 hover:dark:bg-dark-200 disabled:opacity-50 text-black/80 dark:text-white/80 text-sm rounded-lg transition-colors duration-200 flex items-center justify-between"
                >
                  <span>{mockUser.name}</span>
                  {mockUser.isAdmin && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                      Admin
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    provider_error: 'Authentication provider returned an error',
    session_expired: 'Session expired, please try again',
    state_mismatch: 'Security validation failed, please try again',
    auth_failed: 'Authentication failed, please try again',
  };
  return errorMessages[error] || 'An error occurred during login';
}
