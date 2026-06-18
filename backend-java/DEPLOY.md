# 韬纪元 AI 后端部署指南

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [环境变量说明](#环境变量说明)
- [数据库初始化](#数据库初始化)
- [Nginx 反向代理](#nginx-反向代理)
- [服务管理](#服务管理)
- [健康检查](#健康检查)
- [常见问题](#常见问题)

---

## 环境要求

| 组件 | 版本 |
|------|------|
| JDK | 17+ |
| PostgreSQL | 14+ |
| Maven | 3.8+（仅构建时需要） |
| 内存 | 建议 1GB 以上 |
| 磁盘 | 建议 20GB 以上（含文件上传目录） |

---

## 快速开始

### 1. 克隆代码并构建

```bash
git clone <repo-url>
cd taoji/backend-java

# 需要先启动 PostgreSQL 并创建数据库（见"数据库初始化"章节）
# 然后运行 jOOQ 代码生成 + 打包
mvn clean package -DskipTests
```

构建产物为 `target/taoji-backend-1.0.0.jar`（可执行 JAR）。

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写数据库连接信息和密钥
```

### 3. 启动服务

```bash
java -jar target/taoji-backend-1.0.0.jar
```

服务默认监听 `http://localhost:3000`，API 基础路径为 `/api/v1`。

---

## 生产环境部署

### 1. 准备服务器

```bash
# 安装 JDK 17（以 Ubuntu 为例）
sudo apt update
sudo apt install -y openjdk-17-jre-headless

# 验证
java -version
```

### 2. 创建运行用户

```bash
sudo useradd -r -s /bin/false taoji
sudo mkdir -p /opt/taoji /opt/taoji/uploads /opt/taoji/logs
sudo chown -R taoji:taoji /opt/taoji
```

### 3. 上传 JAR 包

```bash
scp target/taoji-backend-1.0.0.jar user@server:/opt/taoji/
```

### 4. 配置环境变量文件

在服务器上创建 `/opt/taoji/.env`（权限设为 600）：

```bash
sudo -u taoji tee /opt/taoji/.env <<'EOF'
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=taoji_db
DATABASE_USER=taoji
DATABASE_PASS=<强密码>
JWT_SECRET=<随机256位以上字符串>
WECHAT_APP_ID=wxc9ebcb4c289511eb
WECHAT_APP_SECRET=<微信小程序密钥>
AI_API_URL=https://api.openai.com/v1
AI_API_KEY=<AI服务密钥>
UPLOAD_DIR=/opt/taoji/uploads
UPLOAD_URL_PREFIX=https://<你的域名>/uploads
SERVER_PORT=3000
EOF

sudo chmod 600 /opt/taoji/.env
```

### 5. 配置 systemd 服务

```bash
sudo tee /etc/systemd/system/taoji.service <<'EOF'
[Unit]
Description=韬纪元 AI 后端服务
After=network.target postgresql.service

[Service]
User=taoji
WorkingDirectory=/opt/taoji
EnvironmentFile=/opt/taoji/.env
ExecStart=/usr/bin/java \
  -Xms256m \
  -Xmx768m \
  -XX:+UseG1GC \
  -Dfile.encoding=UTF-8 \
  -Dlogging.file.path=/opt/taoji/logs \
  -jar /opt/taoji/taoji-backend-1.0.0.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:/opt/taoji/logs/stdout.log
StandardError=append:/opt/taoji/logs/stderr.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable taoji
sudo systemctl start taoji
```

---

## Docker 部署

### 1. 编写 Dockerfile

在 `backend-java/` 目录创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# 缓存依赖层
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# 运行阶段
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN useradd -r -s /bin/false taoji && mkdir -p /app/uploads && chown taoji:taoji /app/uploads
COPY --from=build /app/target/taoji-backend-1.0.0.jar app.jar
USER taoji
EXPOSE 3000
ENTRYPOINT ["java", "-Xms256m", "-Xmx768m", "-XX:+UseG1GC", "-Dfile.encoding=UTF-8", "-jar", "app.jar"]
```

### 2. 编写 docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: taoji-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: taoji_db
      POSTGRES_USER: taoji
      POSTGRES_PASSWORD: ${DATABASE_PASS}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taoji -d taoji_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: taoji-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: taoji_db
      DATABASE_USER: taoji
      DATABASE_PASS: ${DATABASE_PASS}
      JWT_SECRET: ${JWT_SECRET}
      WECHAT_APP_ID: ${WECHAT_APP_ID}
      WECHAT_APP_SECRET: ${WECHAT_APP_SECRET}
      AI_API_URL: ${AI_API_URL}
      AI_API_KEY: ${AI_API_KEY}
      UPLOAD_DIR: /app/uploads
      UPLOAD_URL_PREFIX: ${UPLOAD_URL_PREFIX}
    volumes:
      - uploads_data:/app/uploads
      - ./logs:/app/logs

volumes:
  postgres_data:
  uploads_data:
```

### 3. 启动

```bash
# 配置 .env 后启动
docker compose up -d

# 查看日志
docker compose logs -f app
```

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_HOST` | 是 | `localhost` | PostgreSQL 主机地址 |
| `DATABASE_PORT` | 否 | `5432` | PostgreSQL 端口 |
| `DATABASE_NAME` | 是 | `taoji_db` | 数据库名称 |
| `DATABASE_USER` | 是 | `taoji` | 数据库用户名 |
| `DATABASE_PASS` | 是 | `taoji123` | 数据库密码（生产必须修改） |
| `JWT_SECRET` | 是 | `changeme-...` | JWT 签名密钥，**生产环境必须设置为 256 位以上随机字符串** |
| `JWT_EXPIRES_MS` | 否 | `604800000` | Token 有效期（毫秒），默认 7 天 |
| `WECHAT_APP_ID` | 是 | `wxc9ebcb4c289511eb` | 微信小程序 AppID |
| `WECHAT_APP_SECRET` | 是 | — | 微信小程序 AppSecret（生产必填） |
| `AI_API_URL` | 否 | `https://api.openai.com/v1` | AI 服务接口地址 |
| `AI_API_KEY` | 是 | — | AI 服务 API 密钥（AI 功能必填） |
| `UPLOAD_DIR` | 否 | `./uploads` | 文件上传存储目录（绝对路径） |
| `UPLOAD_URL_PREFIX` | 是 | `http://localhost:3000/uploads` | 上传文件的访问 URL 前缀 |
| `SERVER_PORT` | 否 | `3000` | 服务监听端口 |

> **安全提示**：生产环境中 `JWT_SECRET` 应使用 `openssl rand -base64 64` 生成，切勿使用默认值。

---

## 数据库初始化

数据库 Schema 和种子数据由 **Flyway** 在应用启动时自动执行，无需手动导入 SQL。

### 创建数据库用户和库

```bash
# 以 postgres 超级用户登录
sudo -u postgres psql

-- 创建用户和数据库
CREATE USER taoji WITH PASSWORD '<密码>';
CREATE DATABASE taoji_db OWNER taoji;
GRANT ALL PRIVILEGES ON DATABASE taoji_db TO taoji;
\q
```

### 迁移文件说明

| 文件 | 说明 |
|------|------|
| `V1__init_schema.sql` | 建表语句，包含所有核心表结构 |
| `V2__seed_data.sql` | 初始数据：会员计划、演示机构、演示用户、银行产品 |

### 演示账号

应用首次启动后，数据库中存在以下演示数据：

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13800000000 | 123456 |
| 顾问 | 13900000001 | Advisor123 |

> 生产环境请在部署后立即修改或删除演示账号。

### jOOQ 代码生成说明

jOOQ 的类型安全查询代码在 `mvn compile` 时自动从数据库生成至 `target/generated-sources/jooq/`。**构建前必须保证数据库可访问**，或使用 `-DskipTests` 跳过并确保已有生成代码缓存。

---

## Nginx 反向代理

### 配置示例

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # 上传文件直接由 Nginx 提供服务（可选，提升性能）
    location /uploads/ {
        alias /opt/taoji/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 请求转发到 Spring Boot
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # 文件上传超时
        proxy_read_timeout    300s;
        proxy_send_timeout    300s;
        client_max_body_size  100m;
    }
}
```

---

## 服务管理

```bash
# 查看服务状态
sudo systemctl status taoji

# 启动 / 停止 / 重启
sudo systemctl start taoji
sudo systemctl stop taoji
sudo systemctl restart taoji

# 查看日志（实时）
sudo journalctl -u taoji -f

# 查看应用日志文件
tail -f /opt/taoji/logs/stdout.log
```

### 版本升级

```bash
# 停止服务
sudo systemctl stop taoji

# 替换 JAR 包
sudo cp taoji-backend-新版本.jar /opt/taoji/taoji-backend-1.0.0.jar
sudo chown taoji:taoji /opt/taoji/taoji-backend-1.0.0.jar

# 启动服务（Flyway 会自动执行新增迁移脚本）
sudo systemctl start taoji
```

---

## 健康检查

| 路径 | 说明 |
|------|------|
| `GET /api/v1/actuator/health` | 应用健康状态（无需认证） |
| `GET /api/v1/api-docs` | OpenAPI 3.0 规范 JSON |
| `GET /api/v1/docs` | Swagger UI 接口文档 |

```bash
curl http://localhost:3000/api/v1/actuator/health
# 正常返回：{"status":"UP"}
```

---

## 常见问题

### Q: 启动时报 `jOOQ codegen failed`

jOOQ 代码生成需要连接数据库。确保 `mvn package` 执行前数据库已启动，且环境变量中的数据库配置正确。

也可以先手动执行初始化 SQL，再运行 `mvn compile`。

### Q: 文件上传后无法访问

检查 `UPLOAD_URL_PREFIX` 是否与实际访问地址一致，同时确保 `UPLOAD_DIR` 目录对运行用户有读写权限：

```bash
ls -la /opt/taoji/uploads
# 目录 owner 应为 taoji 用户
```

### Q: 微信登录返回错误

确认 `WECHAT_APP_SECRET` 已正确配置，且微信小程序已在微信开放平台完成上线审核。开发阶段可使用测试环境 AppSecret。

### Q: AI 识别任务一直处于 QUEUED 状态

检查 `AI_API_KEY` 是否有效，以及 `AI_API_URL` 是否可访问：

```bash
curl -H "Authorization: Bearer $AI_API_KEY" $AI_API_URL/models
```

### Q: 内存不足导致 OOM

调整 JVM 堆内存参数（`-Xmx`），推荐生产环境 512MB～1GB。如使用 systemd，修改 `ExecStart` 行中的 `-Xmx` 参数后执行：

```bash
sudo systemctl daemon-reload && sudo systemctl restart taoji
```
