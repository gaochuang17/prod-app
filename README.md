# 记账本

前端提供账单录入、列表和收支统计；后端提供 REST API；数据持久化到 MySQL 8。

## 技术栈

- 前端：React 19 + Vite 7 + TypeScript + Ant Design 5
- 后端：Express 5 + TypeScript
- ORM：Prisma 7
- 数据库：MySQL 8
- 部署：阿里云 ECS + Nginx + PM2

## 项目结构

```text
prod-app/
├── client/          # React + Vite 前端
├── server/          # Express + Prisma 后端
│   └── prisma/      # schema 和数据库迁移文件
└── deploy/          # Nginx、PM2、打包脚本
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/records` | 账单列表，按日期倒序 |
| GET | `/api/records/summary` | 收入、支出、结余和笔数统计 |
| POST | `/api/records` | 创建账单 |
| PATCH | `/api/records/:id` | 更新账单 |
| DELETE | `/api/records/:id` | 删除账单 |

创建账单示例：

```json
{
  "type": "expense",
  "amount": 25.5,
  "category": "餐饮",
  "note": "午餐",
  "date": "2026-11-16"
}
```

## 本地开发

启动本地 MySQL 后，在 `server/` 创建 `.env`：

```env
DATABASE_URL="mysql://app_user:change-me@127.0.0.1:3306/prod_app"
SHADOW_DATABASE_URL="mysql://app_user:change-me@127.0.0.1:3306/prod_app_shadow"
```

本地第一次执行前，需要创建 Prisma 7 使用的 shadow database，并授权给 `app_user`：

```bash
docker exec -it prod-app-mysql mysql -uroot -plocal_root_password --batch -e "
CREATE DATABASE IF NOT EXISTS prod_app_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON prod_app_shadow.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
"
```

后端：

```bash
cd server
npm ci
npm run db:migrate:dev -- --name init
npm run dev
```

前端：

```bash
cd client
npm ci
npm run dev
```

访问 `http://localhost:5173`。Vite 会把 `/api` 代理到 `http://127.0.0.1:3001`。

## 数据库命令

```bash
# 只生成 Prisma Client，不改数据库
npm run db:generate

# 本地修改 schema 后，生成并执行新 migration
npm run db:migrate:dev -- --name describe_change

# 服务器执行仓库里已有且未执行的 migration
npm run db:migrate:deploy
```

## 生产打包

在项目根目录执行：

```bash
chmod +x deploy/package-release.sh
./deploy/package-release.sh
```

脚本会构建前后端，并生成 `release/prod-app.tar.gz`。发布包包含前端静态产物、后端编译产物、Prisma schema、migration 和部署配置；它不会包含 `.env` 和生产密码。

## 阿里云 ECS + MySQL 部署

### 1. 安全组

只开放：

- `22`：SSH，建议只允许自己的 IP。
- `80`：HTTP，可以先允许公网访问。

不要开放：

- `3001`：后端只监听 `127.0.0.1`。
- `3306`：MySQL 只允许服务器本机访问。

### 2. 安装服务器软件

```bash
ssh root@你的ECS公网IP

apt update
apt install -y ca-certificates curl gnupg nginx mysql-server rsync
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
systemctl enable --now nginx
systemctl enable --now mysql
```

确认 MySQL 只监听本机：

```bash
ss -ltnp | grep ':3306'
```

期望看到 `127.0.0.1:3306`。

### 3. 创建生产数据库

```bash
mysql
```

在 MySQL 中执行，并把密码换成强密码：

```sql
CREATE DATABASE prod_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY '请替换成强密码';
GRANT ALL PRIVILEGES ON prod_app.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 上传发布包

本地执行：

```bash
scp release/prod-app.tar.gz root@你的ECS公网IP:/tmp/
```

服务器执行：

```bash
mkdir -p /var/www/prod-app/client
rm -rf /opt/prod-app/server/dist
tar -xzf /tmp/prod-app.tar.gz -C /opt --one-top-level=prod-app --strip-components=1
rm -rf /var/www/prod-app/client/dist
cp -a /opt/prod-app/client/dist /var/www/prod-app/client/
```

### 5. 配置生产环境变量

```bash
cat > /opt/prod-app/server/.env <<'EOF'
DATABASE_URL="mysql://app_user:请替换成强密码@127.0.0.1:3306/prod_app"
EOF

chmod 600 /opt/prod-app/server/.env
```

生产环境不需要配置 `SHADOW_DATABASE_URL`。

### 6. 执行迁移并安装运行时依赖

```bash
cd /opt/prod-app/server
npm ci
npm run db:migrate:deploy
npm prune --omit=dev
```

先完整安装依赖，是因为 Prisma CLI 当前在开发依赖中，执行迁移需要它。迁移完成后，`npm prune --omit=dev` 只保留运行时依赖。

验证表结构：

```bash
mysql prod_app -e "SHOW TABLES; DESCRIBE records;"
```

### 7. 配置 Nginx

```bash
cp /opt/prod-app/deploy/nginx.conf /etc/nginx/sites-available/prod-app
ln -sf /etc/nginx/sites-available/prod-app /etc/nginx/sites-enabled/prod-app
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 8. 启动后端

第一次部署：

```bash
cd /opt/prod-app/server
pm2 start /opt/prod-app/deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条命令，复制并执行它，PM2 才能随服务器启动。

### 9. 验证持久化

浏览器访问：

```text
http://你的ECS公网IP
```

新增一笔账单后，在服务器查看：

```bash
mysql prod_app -e "SELECT id, type, amount, category, date FROM records ORDER BY createdAt DESC LIMIT 5;"
```

再重启后端：

```bash
pm2 restart prod-api
```

刷新页面，数据不应消失。

## 后续发布

本地：

```bash
./deploy/package-release.sh
scp release/prod-app.tar.gz root@你的ECS公网IP:/tmp/
```

服务器：

```bash
rm -rf /opt/prod-app/server/dist
tar -xzf /tmp/prod-app.tar.gz -C /opt --one-top-level=prod-app --strip-components=1
rm -rf /var/www/prod-app/client/dist
cp -a /opt/prod-app/client/dist /var/www/prod-app/client/
cd /opt/prod-app/server
npm ci
npm run db:migrate:deploy
npm prune --omit=dev
pm2 reload prod-api --update-env
```

每次数据库结构变更，都要先在本地生成 migration，再发布到服务器执行 `db:migrate:deploy`。

## 数据备份

```bash
mkdir -p /opt/prod-app/backups
mysqldump --single-transaction prod_app | gzip > /opt/prod-app/backups/prod_app-$(date +%Y%m%d-%H%M%S).sql.gz
```

## 常见问题

### 页面打不开

检查安全组、Nginx 状态和错误日志：

```bash
systemctl status nginx
nginx -t
tail -n 50 /var/log/nginx/error.log
```

### API 返回 502

检查后端进程、日志和本机健康检查：

```bash
pm2 list
pm2 logs prod-api
curl http://127.0.0.1:3001/api/health
```

### API 返回 500

通常是数据库连接、密码或迁移未执行导致：

```bash
mysql -uapp_user -p prod_app -e "SELECT 1;"
mysql prod_app -e "SHOW TABLES;"
pm2 logs prod-api --lines 100
```

### 练习结束释放资源

短期练习结束后及时释放 ECS。应用和 MySQL 都在同一台机器上时，释放实例会删除数据；需要保留时先下载备份。

## 开发与部署过程文档

项目从零到一的完整实现过程、每一步的设计思路和踩坑记录：

- [项目总览](docs/00-overview.md)
- [阶段 0：无数据库的前后端分离 MVP](docs/01-stage-0-initial-mvp.md)
- [阶段 A：本地接入 MySQL 与 Prisma](docs/02-stage-a-local-mysql-prisma.md)
- [阶段 B：后端接口切换到 MySQL](docs/03-stage-b-api-persistence.md)
- [阶段 C：阿里云 ECS + MySQL 部署](docs/04-stage-c-production-deploy.md)
- [问题排查与踩坑记录](docs/05-troubleshooting.md)
- [后续优化方向](docs/06-next-steps.md)
