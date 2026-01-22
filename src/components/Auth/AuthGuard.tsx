'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

// 公开路径（不需要登录）
const PUBLIC_PATHS = ['/login'];

// API 路径前缀（不需要客户端认证检查）
const API_PREFIX = '/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 跳过 API 路由
    if (pathname.startsWith(API_PREFIX)) {
      return;
    }

    // 检查是否是公开路径
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

    if (!isLoading) {
      if (!user && !isPublicPath) {
        // 未登录且不在公开路径，重定向到登录页
        router.push('/login');
      } else if (user && isPublicPath) {
        // 已登录但在登录页，重定向到首页
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  // 加载中显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // 检查是否是公开路径
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // 未登录且不在公开路径，显示加载（等待重定向）
  if (!user && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
