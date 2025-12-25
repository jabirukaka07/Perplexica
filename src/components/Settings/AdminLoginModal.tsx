import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, expiresAt: number) => void;
}

const AdminLoginModal = ({ isOpen, onClose, onSuccess }: AdminLoginModalProps) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError('');
    setRetryAfter(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          // 限流错误
          setRetryAfter(data.retryAfter || 60);
          throw new Error(data.message || 'Too many attempts');
        }

        throw new Error(data.message || 'Authentication failed');
      }

      // 登录成功
      onSuccess(data.token, data.expiresAt);
      toast.success('Welcome, Administrator!');
      onClose();
      setPassword('');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);

      // 失败后延迟2秒，防止暴力破解
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setError('');
      setRetryAfter(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* 对话框容器 */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          {/* 标题 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Administrator Access
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter admin password to access sensitive settings
              </p>
            </div>
          </div>

          {/* 密码输入 */}
          <div className="mt-6">
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter password..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
              disabled={isLoading || retryAfter !== null}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
                {retryAfter !== null && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Please wait {retryAfter} seconds before trying again.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> The admin password is configured via the <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">ADMIN_PASSWORD</code> environment variable. Contact your system administrator if you don't have access.
            </p>
          </div>

          {/* 按钮 */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleLogin}
              disabled={isLoading || !password || retryAfter !== null}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : retryAfter !== null ? `Wait ${retryAfter}s` : 'Login'}
            </button>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AdminLoginModal;
