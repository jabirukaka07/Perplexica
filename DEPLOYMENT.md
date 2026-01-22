# 部署指南

## 环境说明

本项目提供两套 Docker Compose 配置：

### 1. 开发环境 (`docker-compose.yaml`)

**用途**：本地开发和测试

**特点**：
- 使用 `.env` 文件管理环境变量
- 支持 Mock 登录功能（用于调试）
- 数据持久化到本地 volume

**启动命令**：
```bash
docker-compose up -d
```

**配置 Mock 登录**：
```bash
docker exec perplexica-perplexica-1 node -e "
const fs = require('fs');
const path = '/home/perplexica/data/config.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.mockAuth = {
  enabled: true,
  users: [
    { sub: 'mock-admin-1', email: 'admin@dev.local', name: 'Mock Admin', isAdmin: true },
    { sub: 'mock-user-1', email: 'user@dev.local', name: 'Mock User', isAdmin: false }
  ]
};
fs.writeFileSync(path, JSON.stringify(config, null, 2));
"
```

---

### 2. 生产环境 (`docker-compose.prod.yaml`)

**用途**：生产部署

**特点**：
- 不使用 `.env` 文件
- 环境变量通过系统环境或外部配置管理工具注入
- 包含健康检查配置
- 使用 `restart: always` 策略

**启动方式**：

#### 方式 1: 通过系统环境变量
```bash
export JWT_SECRET="your-secret-key"
export OIDC_ISSUER="https://auth.company.com"
export OIDC_CLIENT_ID="perplexica"
export OIDC_CLIENT_SECRET="your-client-secret"
export OIDC_REDIRECT_URI="https://perplexica.company.com/api/auth/callback"
export OIDC_ADMIN_EMAILS="admin@company.com"

docker-compose -f docker-compose.prod.yaml up -d
```

#### 方式 2: 通过云平台配置
在云平台（AWS/Azure/GCP）中：
1. 将敏感信息存储在密钥管理服务中（如 AWS Secrets Manager）
2. 配置容器服务从密钥服务读取环境变量
3. 启动容器

#### 方式 3: 使用 Kubernetes
如果使用 K8s 部署，推荐使用 ConfigMap 和 Secret：

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: perplexica-secrets
type: Opaque
stringData:
  JWT_SECRET: "your-secret-key"
  OIDC_CLIENT_SECRET: "your-client-secret"

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: perplexica-config
data:
  OIDC_ISSUER: "https://auth.company.com"
  OIDC_CLIENT_ID: "perplexica"
  OIDC_REDIRECT_URI: "https://perplexica.company.com/api/auth/callback"
  OIDC_ADMIN_EMAILS: "admin@company.com"
```

---

## 必需的环境变量

### 开发环境
通过 `.env` 文件配置（参考 `.env.example`）：
- `JWT_SECRET`: JWT 签名密钥
- `OIDC_*`: OIDC 认证配置（如果使用 OIDC）

### 生产环境
必须通过外部方式注入：
- `JWT_SECRET`: JWT 签名密钥（强制）
- `OIDC_ISSUER`: OIDC 提供商地址（强制）
- `OIDC_CLIENT_ID`: OIDC 客户端 ID（强制）
- `OIDC_CLIENT_SECRET`: OIDC 客户端密钥（强制）
- `OIDC_REDIRECT_URI`: OIDC 回调地址（强制）
- `OIDC_ADMIN_EMAILS`: 管理员邮箱列表（可选）

---

## 数据持久化

### 开发环境
- Volume 名称: `perplexica-data`
- 包含数据库和配置文件

### 生产环境
- Volume 名称: `perplexica-data-prod`
- 建议配置定期备份

---

## 健康检查

生产环境配置包含健康检查：
- Perplexica: `http://localhost:3000/api/config`
- SearXNG: `http://localhost:8080/healthz`

检查间隔：30秒
超时时间：10秒
重试次数：3次

---

## 安全建议

1. **永远不要提交 `.env` 文件到 Git**
2. **生产环境使用强密钥**（JWT_SECRET 至少 32 位随机字符）
3. **定期轮换密钥**
4. **使用 HTTPS**（配置反向代理如 Nginx）
5. **限制端口暴露**（生产环境不要直接暴露 3000 端口）
6. **使用专业的密钥管理服务**（AWS Secrets Manager, Azure Key Vault 等）

---

## 故障排查

### Mock 登录不可用
检查 `config.json` 中的 `mockAuth.enabled` 是否为 `true`

### 环境变量未生效
生产环境检查：
```bash
docker exec perplexica-perplexica-1 printenv | grep -E "JWT_SECRET|OIDC"
```

### 数据丢失
检查 volume 是否正确挂载：
```bash
docker volume ls
docker volume inspect perplexica-data-prod
```
