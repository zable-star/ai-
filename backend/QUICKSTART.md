# 后端快速启动指南

## 一、环境准备

### 必需软件

1. **Node.js 18+**
   ```bash
   node --version  # 应该显示 v18.0.0 或更高
   ```

2. **PostgreSQL 14+**
   ```bash
   psql --version  # 应该显示 PostgreSQL 14 或更高
   ```

### Windows 安装

```powershell
# 使用 Chocolatey (推荐)
choco install nodejs postgresql

# 或从官网下载
# Node.js: https://nodejs.org/
# PostgreSQL: https://www.postgresql.org/download/windows/
```

## 二、数据库配置

### 1. 启动 PostgreSQL

```powershell
# 检查服务状态
Get-Service postgresql*

# 如果未启动，启动服务
Start-Service postgresql-x64-14
```

### 2. 创建数据库

```powershell
# 方法 1: 使用脚本（推荐）
cd backend
.\scripts\setup-db.ps1

# 方法 2: 手动创建
psql -U postgres
CREATE DATABASE voice_drawing;
\c voice_drawing
\i db/schema.sql
\q
```

## 三、后端配置

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env
notepad .env
```

**重要配置项：**

```env
# 数据库密码（必须修改）
DB_PASSWORD=你的PostgreSQL密码

# JWT 密钥（必须修改为随机字符串）
JWT_SECRET=请运行命令生成: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CORS 允许的前端地址
CORS_ORIGIN=http://localhost:8000
```

### 3. 生成安全密钥

```bash
# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 复制输出结果到 .env 的 JWT_SECRET
```

## 四、启动服务器

### 开发模式（自动重启）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

### 验证启动

打开浏览器访问：http://localhost:3000/health

应该看到：
```json
{
  "status": "ok",
  "timestamp": "2026-06-12T..."
}
```

## 五、测试 API

### 使用 curl（Git Bash）

```bash
cd backend
bash scripts/test-api.sh
```

### 手动测试

```bash
# 1. 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"test123\"}"

# 2. 登录（获取 token）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"test123\"}"

# 复制返回的 token，然后：

# 3. 获取用户信息
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer 你的token"
```

### 使用 Postman

1. 导入 API 端点：`http://localhost:3000/api`
2. 参考 `docs/backend-api.md` 中的接口文档
3. 先调用 `/auth/register` 或 `/auth/login` 获取 token
4. 在后续请求的 Header 中添加：`Authorization: Bearer <token>`

## 六、常见问题

### 问题 1: 端口 3000 已被占用

```bash
# 查找占用进程
netstat -ano | findstr :3000

# 终止进程（替换 PID）
taskkill /PID <进程ID> /F

# 或修改 .env 中的 PORT
PORT=3001
```

### 问题 2: 数据库连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案：**
1. 确认 PostgreSQL 服务已启动
2. 检查 .env 中的数据库配置
3. 验证密码是否正确

### 问题 3: JWT 密钥警告

```
Warning: Using default JWT secret
```

**解决方案：**
在 .env 中设置强密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 问题 4: CORS 错误

前端调用时出现跨域错误。

**解决方案：**
在 .env 中设置正确的前端地址：
```env
CORS_ORIGIN=http://localhost:8000
```

## 七、目录结构

```
backend/
├── db/
│   ├── schema.sql           # 数据库表结构
│   └── reset.sql            # 重置数据库脚本
├── scripts/
│   ├── setup-db.ps1         # Windows 数据库配置脚本
│   ├── setup-db.sh          # Linux/Mac 数据库配置脚本
│   └── test-api.sh          # API 测试脚本
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.js      # 数据库连接
│   │   └── index.js         # 应用配置
│   ├── controllers/         # 业务逻辑
│   │   ├── authController.js      # 认证
│   │   ├── modelController.js     # 模型配置
│   │   ├── drawingController.js   # 绘图历史
│   │   └── aiController.js        # AI 代理
│   ├── middleware/          # 中间件
│   │   ├── auth.js          # JWT 验证
│   │   ├── validation.js    # 输入验证
│   │   └── errorHandler.js  # 错误处理
│   ├── routes/              # 路由定义
│   ├── utils/               # 工具函数
│   │   ├── errors.js        # 自定义错误类
│   │   ├── encryption.js    # API Key 加密
│   │   └── helpers.js       # 辅助函数
│   └── index.js             # 应用入口
├── .env.example             # 环境变量示例
├── .gitignore
├── package.json
├── README.md                # 详细文档
└── DEVELOPMENT.md           # 开发文档
```

## 八、下一步

### 前端集成

修改前端代码，将 localStorage 账号系统替换为后端 API 调用：

1. **注册/登录**：调用 `/api/auth/register` 和 `/api/auth/login`
2. **保存 token**：`localStorage.setItem('token', data.token)`
3. **API 请求**：添加 Header `Authorization: Bearer ${token}`
4. **模型配置**：通过 `/api/models` 管理，API Key 保存在后端
5. **AI 调用**：通过 `/api/ai/chat` 代理，不暴露 API Key
6. **保存作品**：通过 `/api/drawings` 云端存储

### 查看完整文档

- API 接口文档：`docs/backend-api.md`
- 开发指南：`backend/DEVELOPMENT.md`
- 部署指南：`backend/README.md`

## 九、验证清单

启动后检查：

- [ ] 服务器在 http://localhost:3000 启动
- [ ] 健康检查端点返回 `{"status":"ok"}`
- [ ] 可以成功注册新用户
- [ ] 可以登录并获取 token
- [ ] 可以使用 token 访问受保护的接口
- [ ] 数据库中正确创建了 users、model_profiles、drawings 表

## 十、生产部署建议

准备上线时：

1. 更换强 JWT_SECRET
2. 配置生产数据库
3. 启用 HTTPS
4. 设置 NODE_ENV=production
5. 配置反向代理（Nginx）
6. 设置进程管理器（PM2）
7. 配置日志收集
8. 设置数据库备份

详见 `backend/README.md` 的部署章节。
