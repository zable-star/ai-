# 使用 Supabase 在线数据库 - 详细步骤

## 为什么选择 Supabase？

- ✅ 免费 500MB 存储
- ✅ 无需本地安装 PostgreSQL
- ✅ 5 分钟配置完成
- ✅ 自动备份
- ✅ 可以从任何地方访问

---

## 步骤 1: 注册账号

1. 打开浏览器访问: https://supabase.com
2. 点击右上角 **"Start your project"** 或 **"Sign Up"**
3. 选择注册方式：
   - **GitHub 账号**（推荐，一键注册）
   - 或使用邮箱注册

![注册页面示意]

---

## 步骤 2: 创建新项目

1. 登录后，点击 **"New project"**

2. 选择组织（Organization）
   - 如果是第一次使用，会提示创建组织
   - 输入组织名称（比如：`my-projects`）

3. 填写项目信息：
   ```
   Name: voice-drawing
   Database Password: 设置一个强密码（记住它！）
   Region: Northeast Asia (Tokyo) 或 Southeast Asia (Singapore)
   Pricing Plan: Free (免费)
   ```

4. 点击 **"Create new project"**

5. ⏱️ 等待 2-3 分钟，项目正在初始化...

---

## 步骤 3: 获取数据库连接信息

项目创建完成后：

1. 点击左侧菜单的 **"Settings"** (齿轮图标)
2. 在左侧子菜单中选择 **"Database"**
3. 向下滚动找到 **"Connection string"** 部分
4. 选择 **"URI"** 标签页
5. 复制连接字符串（类似这样）：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
   ```

**从连接字符串中提取信息：**
- **DB_HOST**: `db.abcdefghijk.supabase.co`
- **DB_PORT**: `5432`
- **DB_NAME**: `postgres`
- **DB_USER**: `postgres`
- **DB_PASSWORD**: 你刚才设置的密码

---

## 步骤 4: 配置后端环境变量

### 4.1 创建 .env 文件

在 PowerShell 中：

```powershell
cd E:\wjz\qiniu\backend
cp .env.example .env
notepad .env
```

### 4.2 修改 .env 内容

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (从 Supabase 获取)
DB_HOST=db.你的项目id.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=你设置的数据库密码

# JWT Configuration (需要生成一个随机密钥)
JWT_SECRET=运行下面的命令生成
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 生成 JWT_SECRET

在 PowerShell 中运行：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串，粘贴到 .env 中的 `JWT_SECRET=` 后面。

**完整示例**：
```env
DB_HOST=db.abcdefghijk.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=mySecurePassword123

JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8000
```

保存并关闭文件。

---

## 步骤 5: 创建数据库表

### 5.1 在 Supabase 中打开 SQL 编辑器

1. 回到 Supabase 项目页面
2. 点击左侧菜单的 **"SQL Editor"**
3. 点击 **"New query"**

### 5.2 复制数据库表结构

1. 在本地打开文件：`E:\wjz\qiniu\backend\db\schema.sql`
2. 复制全部内容（约 120 行）
3. 粘贴到 Supabase 的 SQL 编辑器中
4. 点击右下角的 **"Run"** 按钮（或按 Ctrl+Enter）

**成功标志**：
- 看到绿色的 "Success" 消息
- 看到 "Rows returned" 或类似提示

### 5.3 验证表是否创建成功

1. 点击左侧菜单的 **"Table Editor"**
2. 应该能看到 3 个表：
   - `users`
   - `model_profiles`
   - `drawings`

---

## 步骤 6: 启动后端服务器

在 PowerShell 中：

```powershell
cd E:\wjz\qiniu\backend
npm run dev
```

**成功标志**：
```
🚀 Server running on port 3000
📝 Environment: development
🔒 CORS origin: http://localhost:8000
```

**如果看到错误**，检查：
- .env 文件中的数据库密码是否正确
- Supabase 项目是否已完全初始化
- 网络连接是否正常

---

## 步骤 7: 测试后端连接

### 7.1 测试健康检查

打开浏览器，访问：
```
http://localhost:3000/health
```

应该看到：
```json
{
  "status": "ok",
  "timestamp": "2026-06-12T..."
}
```

### 7.2 测试完整功能

1. **新开一个终端**，启动前端：
   ```powershell
   cd E:\wjz\qiniu
   python -m http.server 8000
   ```

2. 打开浏览器访问测试页面：
   ```
   http://localhost:8000/frontend/test-integration.html
   ```

3. 测试功能：
   - 点击 "检查后端连接" → 应该成功
   - 注册一个账号 → 应该成功
   - 创建模型配置 → 应该成功
   - 保存测试绘图 → 应该成功

---

## 常见问题

### Q1: 连接超时

**原因**: 防火墙或网络问题

**解决**:
1. 检查网络连接
2. 尝试关闭防火墙
3. 检查 Supabase 项目状态

### Q2: 密码错误

**原因**: .env 中的密码不对

**解决**:
1. 回到 Supabase → Settings → Database
2. 点击 "Reset database password" 重置密码
3. 更新 .env 中的密码

### Q3: 表已存在错误

**原因**: 重复执行了 schema.sql

**解决**:
1. 在 Supabase SQL Editor 中运行：
   ```sql
   DROP TABLE IF EXISTS drawings CASCADE;
   DROP TABLE IF EXISTS model_profiles CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
2. 然后重新执行 schema.sql

---

## 优势总结

使用 Supabase 的好处：
- ✅ 无需本地安装复杂的数据库软件
- ✅ 5 分钟配置完成
- ✅ 免费 500MB 存储（足够使用）
- ✅ 自动备份，数据不会丢失
- ✅ 可以从任何地方访问
- ✅ 有可视化的表编辑器
- ✅ 内置 SQL 编辑器
- ✅ 支持实时订阅（未来可扩展）

---

## 下一步

数据库配置完成后：
1. 测试所有功能
2. 开始使用云端保存
3. 准备演示和部署

**祝你成功！** 🎉

需要帮助随时告诉我！
