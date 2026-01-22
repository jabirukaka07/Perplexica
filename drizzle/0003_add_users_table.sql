-- 创建 users 表
CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `name` text,
  `avatar` text,
  `oidcProfile` text,
  `isAdmin` integer DEFAULT 0,
  `createdAt` text NOT NULL,
  `lastLoginAt` text NOT NULL,
  `authProvider` text DEFAULT 'oidc' NOT NULL
);

-- 创建 legacy-admin 用户用于迁移现有数据
INSERT OR IGNORE INTO `users` (`id`, `email`, `name`, `isAdmin`, `createdAt`, `lastLoginAt`, `authProvider`)
VALUES ('legacy-admin', 'admin@legacy.local', 'Legacy Administrator', 1, datetime('now'), datetime('now'), 'legacy');

-- 为 chats 表添加 userId 列
ALTER TABLE `chats` ADD COLUMN `userId` text;

-- 将现有 chats 关联到 legacy-admin
UPDATE `chats` SET `userId` = 'legacy-admin' WHERE `userId` IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS `idx_chats_userId` ON `chats`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users`(`email`);
