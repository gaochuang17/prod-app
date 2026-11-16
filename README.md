# 记账本 - 前后端分离练习项目

一个最简单的记账本前后端分离项目，支持记录收入/支出账单、分类、备注和日期，并自动汇总收支统计，用于练习从开发到上线部署的完整流程。

## 技术栈

- **前端**: React 19 + Vite 7 + TypeScript + Ant Design 5
- **后端**: Express 5 + TypeScript
- **部署**: Nginx + PM2 + Node.js（阿里云 ECS）

## 项目结构

```
prod-app/
├── client/          # 前端项目（React + Vite + AntD）
│   ├── src/
│   │   ├── api/     # API 请求封装
│   │   ├── components/  # HealthPanel 服务状态 / StatsPanel 收支统计 / RecordPanel 记账表单与账单列表
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── server/          # 后端项目（Express + TypeScript）
│   ├── src/
│   │   ├── lib/     # 内存账单数据存储
│   │   ├── routes/  # API 路由
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── deploy/          # 部署配置
│   ├── nginx.conf       # Nginx 站点配置
│   └── ecosystem.config.cjs  # PM2 进程配置
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/records` | 获取账单列表，按日期倒序 |
| GET | `/api/records/summary` | 获取统计汇总（总收入、总支出、结余、笔数） |
| POST | `/api/records` | 记一笔账单 |
| PATCH | `/api/records/:id` | 更新账单 |
| DELETE | `/api/records/:id` | 删除账单 |

创建账单的请求体示例：

```json
{
"type": "expense",
"amount": 25.5,
"category": "餐饮",
"note": "午餐",
"date": "2026-11-16"
}
```

字段说明：

- `type`：`income`（收入）或 `expense`（支出），必填。
- `amount`：金额，大于 0 的数字，最多保留两位小数，必填。
- `category`：分类，例如支出类有餐饮、交通、购物等，收入类有工资、奖金等，必填。
- `note`：备注，选填。
- `date`：日期，`YYYY-MM-DD` 格式，必填。

账单数据结构：`{ id, type, amount, category, note, date, createdAt, updatedAt }`。

数据存储在内存中，服务重启后清空。

## 本地开发

### 启动后端

```bash
cd server
npm install
npm run dev
```

后端运行在 `http://127.0.0.1:3001`。

### 启动前端（另开一个终端）

```bash
cd client
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。Vite 已配置 `/api` 代理到后端，无需额外配置。

## 生产构建

```bash
cd client
npm install
npm run build
# 产物在 client/dist/

cd ../server
npm install
npm run build
# 产物在 server/dist/
```

## 阿里云 ECS 部署指南

### 1. 购买 ECS 实例

- 登录 [阿里云控制台](https://ecs.console.aliyun.com/)。
- 创建实例：
- **地域**: 离你近的节点（如华东-杭州）。
- **操作系统**: Ubuntu 22.04 或 24.04 LTS，64 位。
- **配置**: 2 vCPU / 2 GiB 即可（如果只上传构建产物，更低配也够用）。
- **磁盘**: 40 GiB ESSD。
- **计费**: 如果只是短期练习，选按量付费，结束后及时释放实例。
- 设置安全组规则：
- 开放 `80` 端口（HTTP），来源 `0.0.0.0/0`。
- 开放 `22` 端口（SSH），来源限制为你的 IP。
- **不要**开放后端端口 `3001`。

### 2. 连接服务器

```bash
ssh root@你的ECS公网IP
```

### 3. 安装服务器依赖

```bash
# 安装 Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Nginx 和 PM2
sudo apt-get install -y nginx
sudo npm install -g pm2
```

### 4. 在本地构建并上传项目

先在本地完成生产构建（见上文"生产构建"），然后打包上传：

```bash
# 在项目根目录执行
mkdir -p release/client release/server
cp -r client/dist release/client/
cp -r server/dist release/server/
cp server/package.json server/package-lock.json release/server/
cp -r deploy release/

# 打包
tar -czf release.tar.gz -C release .

# 上传到 ECS（在本地终端执行）
scp release.tar.gz root@你的ECS公网IP:/tmp/
```

### 5. 在服务器上解压并部署

```bash
# 在 ECS 上执行
mkdir -p /var/www/prod-app /opt/prod-app
cd /tmp && tar -xzf release.tar.gz -C /tmp/deploy-tmp --one-top-level

# 部署前端
sudo cp -r /tmp/deploy-tmp/client/dist /var/www/prod-app/client/

# 部署后端
sudo cp -r /tmp/deploy-tmp/server /opt/prod-app/
cd /opt/prod-app/server
sudo npm ci --omit=dev

# 配置 Nginx
sudo cp /tmp/deploy-tmp/deploy/nginx.conf /etc/nginx/sites-available/prod-app
sudo ln -sf /etc/nginx/sites-available/prod-app /etc/nginx/sites-enabled/prod-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 启动后端
cd /opt/prod-app/server
sudo pm2 start /tmp/deploy-tmp/deploy/ecosystem.config.cjs
sudo pm2 save
sudo pm2 startup  # 按提示执行输出的命令
```

### 6. 验证部署

在浏览器访问 `http://你的ECS公网IP`，应该能看到 AntD 页面并正常操作任务。

在本地终端执行：

```bash
curl http://你的ECS公网IP/api/health
```

应返回类似 `{"status":"ok","uptimeSeconds":12,"timestamp":"..."}` 的 JSON。

### 7. 清理

练习完成后，在阿里云控制台**释放 ECS 实例**，避免持续计费。

## 常见问题

### 页面打不开

- 检查安全组是否开放了 80 端口。
- 检查 Nginx 是否运行：`sudo systemctl status nginx`。
- 检查前端文件是否在 `/var/www/prod-app/client/dist/` 下。

### API 返回 502

- 检查 PM2 是否运行：`pm2 list`。
- 检查后端日志：`pm2 logs prod-api`。
- 检查后端是否监听 127.0.0.1:3001：`curl http://127.0.0.1:3001/api/health`。

### 账单数据消失了

数据存储在内存中，服务重启或 PM2 重启后清空，这是预期行为。
