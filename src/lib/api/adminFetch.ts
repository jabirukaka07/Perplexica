/**
 * 带有管理员认证的fetch工具函数
 * 自动添加Authorization头，并处理token过期的情况
 */

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_TOKEN_EXPIRY_KEY = 'adminTokenExpiry';

interface AdminFetchOptions extends RequestInit {
  skipAuth?: boolean; // 是否跳过认证（用于公开API）
}

/**
 * 带管理员token的fetch请求
 *
 * @param url - 请求URL
 * @param options - fetch选项
 * @returns Promise<Response>
 * @throws Error 如果没有有效token
 */
export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  // 如果不跳过认证，检查并添加token
  if (!skipAuth) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      throw new Error('Admin authentication required. Please login first.');
    }

    // 不在客户端检查过期时间，让服务器验证
    // 因为服务器的 activeSessions 可能因为重启/热重载而丢失
    // 添加Authorization头
    const headers = new Headers(fetchOptions.headers);
    headers.set('Authorization', `Bearer ${token}`);
    fetchOptions.headers = headers;
  }

  // 发送请求
  const response = await fetch(url, fetchOptions);

  // 处理403错误（token无效或过期）
  if (response.status === 403) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_EXPIRY_KEY);

    // 尝试从响应中获取错误信息
    let errorMessage = 'Admin authentication failed';
    try {
      const data = await response.json();
      if (data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      // 忽略JSON解析错误
    }

    throw new Error(errorMessage);
  }

  return response;
}

/**
 * 带管理员认证的GET请求
 */
export async function adminGet(url: string, options: AdminFetchOptions = {}) {
  return adminFetch(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * 带管理员认证的POST请求
 */
export async function adminPost(
  url: string,
  body: any,
  options: AdminFetchOptions = {}
) {
  return adminFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * 带管理员认证的PATCH请求
 */
export async function adminPatch(
  url: string,
  body: any,
  options: AdminFetchOptions = {}
) {
  return adminFetch(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * 带管理员认证的DELETE请求
 */
export async function adminDelete(url: string, options: AdminFetchOptions = {}) {
  return adminFetch(url, {
    ...options,
    method: 'DELETE',
  });
}
