# 下个窗口转接文档

更新时间：2026-06-12

## 1. 当前项目概况

仓库路径：

```text
E:\wjz\qiniu
```

远程仓库：

```text
git@github.com:zable-star/ai-.git
https://github.com/zable-star/ai-
```

线上演示地址：

```text
https://zable-star.github.io/ai-/
```

当前选题：

```text
题目二：AI 语音绘图工具
```

前端已经完成的主要能力：

- 纯语音绘图：基础图形、线条、复合对象、场景模板。
- 复杂指令拆解：例如“画一幅风景，然后把上一笔放大一点”。
- 编辑上一笔：改颜色、移动、放大、缩小、线宽调整。
- 画布控制：清空、撤销、重做、导出 PNG/JPEG/WebP。
- 大模型配置：OpenAI、DeepSeek、通义千问等 OpenAI-compatible API。
- 多模型配置保存。
- 本地账号系统。
- 绘图计划面板：展示本地解析或 AI 规划、动作步骤、耗时。
- 响应式布局和画布视图控制：适应窗口、放大画布、缩小画布。

后端已经开始加入，目录为：

```text
backend/
```

后端技术栈从现有文件看是：

- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- pg
- Joi
- Helmet
- express-rate-limit

前端也已经出现后端客户端文件：

```text
frontend/api-client.js
```

默认后端 API 地址：

```text
http://localhost:3000/api
```

## 2. 很重要：下个窗口先检查 Git 状态

当前本地状态不是完全干净。进入下个窗口后先运行：

```powershell
git status -sb
```

本次转接前观察到的状态大致是：

```text
## main...origin/main [ahead 3]
 M frontend/app.js
?? DATABASE_INSTALL_HELP.md
?? FINAL_REPORT.md
?? IMPROVEMENT_PLAN.md
?? SUPABASE_SETUP_GUIDE.md
?? backend/package-lock.json
```

注意：

- 不要随便回滚这些文件。
- 这些很可能是用户已经做过的后端/数据库相关改动。
- 下个窗口应先阅读这些新增文档和后端代码，再决定是否整理、提交或继续开发。

建议先看：

```powershell
Get-ChildItem backend -Force
Get-Content -Encoding UTF8 backend\README.md
Get-Content -Encoding UTF8 backend\.env.example
Get-Content -Encoding UTF8 frontend\api-client.js
```

## 3. 本地前端演示启动

前端是静态页面，可直接用本地静态服务器：

```powershell
cd E:\wjz\qiniu
python -m http.server 8000
```

浏览器打开：

```text
http://localhost:8000/frontend/
```

如果只演示 GitHub Pages：

```text
https://zable-star.github.io/ai-/
```

注意：

- GitHub Pages 只部署 `frontend/` 静态站。
- 本地后端不会自动在 GitHub Pages 上运行。
- 如果要演示前后端连接，请使用本地前端地址和本地后端地址。

## 4. 后端启动步骤

进入后端目录：

```powershell
cd E:\wjz\qiniu\backend
```

如果依赖还没装：

```powershell
npm install
```

配置环境变量：

```powershell
Copy-Item .env.example .env
```

编辑：

```text
backend\.env
```

典型配置：

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice_drawing
DB_USER=postgres
DB_PASSWORD=你的数据库密码

JWT_SECRET=请换成一串很长的随机字符串
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

启动开发服务：

```powershell
npm run dev
```

或普通启动：

```powershell
npm start
```

后端默认地址：

```text
http://localhost:3000
```

API 前缀：

```text
http://localhost:3000/api
```

## 5. PostgreSQL 数据库启动与初始化

后端 README 中要求 PostgreSQL。

目标数据库：

```text
voice_drawing
```

如果 PostgreSQL 已安装，并且 `psql` 可用：

```powershell
createdb -U postgres voice_drawing
```

或进入 psql：

```powershell
psql -U postgres
```

然后执行：

```sql
CREATE DATABASE voice_drawing;
```

初始化表结构：

```powershell
cd E:\wjz\qiniu\backend
psql -U postgres -d voice_drawing -f db\schema.sql
```

如果 PostgreSQL 服务没启动，可在 Windows 服务里查找并启动：

```powershell
Get-Service *postgres*
```

如果看到 PostgreSQL 服务但未运行：

```powershell
Start-Service 服务名
```

服务名可能类似：

```text
postgresql-x64-16
postgresql-x64-15
```

## 6. 前后端连接方式

现有前端后端客户端：

```text
frontend/api-client.js
```

其中默认：

```js
const API_BASE_URL = 'http://localhost:3000/api';
```

要让前端真正走后端，需要确认：

1. `frontend/index.html` 是否已经引入：

```html
<script src="./api-client.js"></script>
```

2. `frontend/app.js` 里的注册、登录、模型配置、大模型调用是否已经接入 `window.apiClient`。

3. 如果还没接入，下一步要做渐进式集成：

- 后端可用时走后端。
- 后端不可用时保留当前 localStorage 本地模式，避免演示失败。

推荐策略：

```text
优先后端，失败回退本地。
```

演示时比较稳：

- 没开数据库/后端时，前端仍能画图。
- 开了数据库/后端时，可以展示云端账号、模型配置、绘图历史保存。

## 7. 推荐演示流程

### 纯前端兜底演示

1. 打开：

```text
https://zable-star.github.io/ai-/
```

2. 点击“示例”，展示“画一幅风景”拆解为多步。
3. 语音或输入演示：

```text
画一幅风景
把上一笔放大一点
把刚才的图形移到右上角
放大画布
缩小画布
画布适应窗口
导出图片
```

### 本地前后端演示

1. 启动 PostgreSQL。
2. 初始化数据库。
3. 启动后端：

```powershell
cd E:\wjz\qiniu\backend
npm run dev
```

4. 启动前端：

```powershell
cd E:\wjz\qiniu
python -m http.server 8000
```

5. 打开：

```text
http://localhost:8000/frontend/
```

6. 注册账号、登录。
7. 保存模型配置。
8. 尝试保存绘图历史或通过后端代理调用模型。

## 8. 下个窗口建议优先任务

建议按这个顺序做：

1. 检查当前未提交改动：

```powershell
git status -sb
git diff -- frontend/app.js
```

2. 阅读后端入口：

```powershell
Get-Content -Encoding UTF8 backend\src\index.js
```

3. 确认数据库 schema：

```powershell
Get-Content -Encoding UTF8 backend\db\schema.sql
```

4. 运行后端：

```powershell
cd backend
npm run dev
```

5. 如果报数据库连接错误，先解决 PostgreSQL 或 `.env`。

6. 测试 API：

```powershell
curl.exe http://localhost:3000/api/health
```

如果没有 `/api/health`，检查 `backend/src/index.js` 里实际健康检查路径。

7. 接前端：

- 确认 `api-client.js` 被引入。
- 把登录/注册切到后端，失败回退本地。
- 把模型配置保存切到后端，失败回退本地。
- 最后再接 AI 代理。

## 9. 提交前必跑检查

前端解析器自测：

```powershell
cd E:\wjz\qiniu
node frontend\app.js --self-test
```

预检：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

Git 状态：

```powershell
git status -sb
```

如果要部署 GitHub Pages：

```powershell
git add .
git commit -m "你的提交信息"
git push origin main
```

推送后等待 GitHub Actions 完成。

## 10. 注意事项

- 不要把真实 API Key 提交到 Git。
- 不要提交 `backend\.env`。
- `backend\.gitignore` 应该忽略 `.env` 和 `node_modules`。
- 如果后端要部署到云端，不要用 GitHub Pages，需使用 Render、Railway、Fly.io、Vercel Serverless、阿里云/腾讯云等。
- GitHub Pages 只能托管前端静态页面。
- 比赛演示优先保证前端绘图链路稳定，后端作为加分项展示。

