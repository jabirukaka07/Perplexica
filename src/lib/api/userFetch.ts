'use client';

const USER_TOKEN_KEY = 'userToken';

/**
 * 获取用户 Token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_TOKEN_KEY);
}

/**
 * 带认证的 Fetch 函数
 */
export async function userFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // 如果收到 401，可能需要重新登录
  if (response.status === 401) {
    // 清除过期的 token
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem('userTokenExpiry');
    }
  }
  
  return response;
}

/**
 * GET 请求
 */
export async function userGet(url: string): Promise<Response> {
  return userFetch(url, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function userPost(url: string, body: unknown): Promise<Response> {
  return userFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH 请求
 */
export async function userPatch(url: string, body: unknown): Promise<Response> {
  return userFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE 请求
 */
export async function userDelete(url: string): Promise<Response> {
  return userFetch(url, { method: 'DELETE' });
}

// 别名导出，保持与旧 API 兼容
export const adminFetch = userFetch;
export const adminGet = userGet;
export const adminPost = userPost;
export const adminPatch = userPatch;
export const adminDelete = userDelete;
