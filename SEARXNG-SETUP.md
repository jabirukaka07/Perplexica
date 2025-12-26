# SearxNG 配置说明

## 当前配置

SearxNG 已集成到 `docker-compose.yaml` 中，配置文件为 `searxng-settings.yml`。

### 配置要点

- **端口**: 4000 (映射到容器内部的 8080)
- **配置文件**: `searxng-settings.yml`
- **JSON 格式**: 已启用
- **Wolfram Alpha**: 已启用
- **限流器**: 已禁用

## 启动服务

### 方式 1: 使用 docker-compose (推荐)

```bash
# 启动所有服务 (Perplexica + SearxNG)
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart
```

### 方式 2: 手动启动 (已不推荐)

如果需要单独管理 SearxNG:

```bash
# 启动
docker run -d \
  -p 4000:8080 \
  -v "$(pwd)/searxng-settings.yml:/etc/searxng/settings.yml" \
  --name searxng \
  --restart unless-stopped \
  searxng/searxng:latest

# 停止
docker stop searxng

# 删除
docker rm searxng
```

## 验证服务

```bash
# 测试 SearxNG API
curl "http://localhost:4000/search?q=test&format=json"

# 访问 SearxNG 网页界面
open http://localhost:4000
```

## Perplexica 配置

确保 `data/config.json` 中的 SearxNG URL 设置正确:

```json
{
  "search": {
    "searxngURL": "http://localhost:4000"
  }
}
```

## 故障排查

### 检查容器状态
```bash
docker ps | grep searxng
```

### 查看日志
```bash
docker logs searxng --tail 50
```

### 重启服务
```bash
docker-compose restart searxng
```
