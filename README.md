# AI 语音绘图工具

七牛云 x XEngineer 暑期实训营作品。

选择题目：题目二，AI 语音绘图工具。

## 提交信息

- GitHub 仓库：`git@github.com:zable-star/ai-.git`
- 在线演示地址：`https://zable-star.github.io/ai-/`
- Demo 视频：[Bilibili demo](https://b23.tv/D0TOpxd)
- 参赛批次：第四批，`2026-06-12 00:00` 至 `2026-06-14 23:59`
- 设计文档：[docs/design-doc.md](docs/design-doc.md)

## 作品简介

本项目是一款纯语音控制的绘图工具。用户在浏览器授权麦克风后，可以通过语音完成绘图、修改、撤销、重做、清空、导出、保存作品、打开帮助和 AI 精绘等操作。

项目重点解决三个问题：

- 指令理解：本地规则优先解析颜色、形状、位置、复合对象、复杂场景和多步命令。
- 容错与响应延迟：常见命令不依赖云端模型，识别到最终语音文本后立即在 Canvas 上执行。
- 复杂指令拆解：支持“然后、接着、再、并且”等连接词，将一句话拆成多个绘图动作；本地无法理解时，可接入语义理解模型生成结构化动作。

## 核心功能

- 语音唤醒：支持“小绘，小绘”唤醒。
- 语音绘图：支持圆形、矩形、三角形、星形、线条、点等基础图形。
- 复合对象：支持房子、树、太阳、云朵、河流、山、花、笑脸、猫、狗、鸟、月亮、汽车、爱心、草地、蝴蝶、气球等对象。
- 场景模板：支持风景、夕阳房子、花园、夜空、森林、动物互动等场景。
- 局部修改：支持“把上一笔改成蓝色”“把刚才的图形移到右上角”“放大一点”等修改指令。
- 画布控制：支持撤销、重做、清空、放大、缩小、适应窗口。
- 导出图片：支持 PNG、JPEG、WebP 导出。
- 账号与作品：支持本地/后端账号登录，保存和加载作品。
- 模型配置：语义理解模型和绘画精绘模型分开配置。
- AI 精绘：可调用绘画生成模型，将当前语音绘图结果重新生成更精致的成品插画。

## 演示指令

录制 demo 时使用过的代表性指令包括：

```text
小绘，小绘
画一个戴眼镜的太阳
画一个房子，房顶红色，墙壁白色
帮我画一个夕阳下的房子，左边有树，右上角有太阳
在中间画一只带翅膀的狗在和小鸟玩耍
画一片森林中的难忘景色，夕阳照在小河和小路上
把这幅图 AI 精绘一下
导出 PNG 图片
保存作品到云端
打开我的作品
```

## 项目结构

```text
.
|-- frontend/                # 前端静态页面、语音识别、Canvas 绘图、AI 精绘入口
|-- backend/                 # Express API、登录注册、作品保存、模型配置、AI 代理
|-- docs/                    # 设计文档、部署说明、提交说明
|-- scripts/                 # 本地检查脚本
|-- .github/                 # GitHub Pages workflow 和 PR 模板
`-- README.md                # 项目说明
```

## 本地运行

### 1. 启动前端

前端是原生 HTML/CSS/JavaScript 项目，不需要构建。

```powershell
python -m http.server 8000
```

打开：

```text
http://localhost:8000/frontend/
```

语音识别建议使用最新版 Chrome 或 Edge，并允许麦克风权限。浏览器 Web Speech API 在 `localhost` 下更稳定。

### 2. 启动后端

后端用于登录注册、模型配置、作品保存和 AI 接口代理。

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

默认后端地址：

```text
http://localhost:3000
```

前端默认请求：

```text
http://localhost:3000/api
```

### 3. 数据库配置

后端使用 PostgreSQL。请先创建数据库，并按 `backend/.env.example` 配置连接信息：

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice_drawing
DB_USER=postgres
DB_PASSWORD=your_password_here
```

数据库表结构见：

```text
backend/db/schema.sql
```

## 测试方式

前端解析器自测：

```powershell
node frontend/app.js --self-test
```

后端测试：

```powershell
cd backend
npm test
```

提交前已通过以下检查：

- `node --check frontend\app.js`
- `node frontend\app.js --self-test`
- `npm test`

## 依赖与第三方服务

### 前端

- 原生 HTML/CSS/JavaScript
- Canvas 2D API
- Web Speech API
- localStorage

前端无打包框架，无 React/Vue 等运行时依赖。

### 后端

主要依赖见 `backend/package.json`：

- `express`：HTTP API 服务
- `pg`：PostgreSQL 数据库连接
- `bcrypt`：密码哈希
- `jsonwebtoken`：登录态 token
- `joi`：请求参数校验
- `cors`：跨域配置
- `helmet`：基础安全头
- `express-rate-limit`：接口限流
- `dotenv`：环境变量加载

### AI 服务

项目支持用户自行配置 API Key：

- 语义理解模型：OpenAI-compatible Chat API，例如 DeepSeek、通义千问、OpenAI、Moonshot、智谱等。
- 绘画精绘模型：火山引擎豆包图片生成 / Seedream 类图片生成接口。

API Key 不写入代码仓库。演示环境中由用户在配置界面自行填写，并保存到当前登录账号对应的本地/后端配置中。

## 原创功能范围

本项目的主要业务逻辑和交互实现为自主完成，包括：

- 中文语音指令解析器
- 多步命令拆解
- 复合对象和场景模板
- Canvas 绘图动作系统
- 上一步对象编辑逻辑
- 语音状态与唤醒交互
- 模型配置页面
- 语义理解模型与绘画精绘模型分离
- AI 精绘提示词构建
- 账号、作品保存、作品加载和后端 API
- 设计文档和演示脚本

第三方库和框架已在“依赖与第三方服务”中列明。未将 API Key、账号密码或私有素材提交到仓库。

## 开发与提交记录说明

本仓库在所选批次内持续提交，不是最后一天一次性导入。当前可见提交从 `2026-06-12` 开始，持续到 `2026-06-14`，覆盖初始化、前端交互、语音控制、场景模板、后端 API、模型配置、作品保存、AI 精绘和最终文档整理。

仓库包含 `.github/pull_request_template.md`，PR 描述模板要求填写：

- 功能描述
- 实现思路
- 测试方式

## 设计文档

设计文档位于：

```text
docs/design-doc.md
```

文档记录了：

- 计划支持的指令能力
- 最终实现的能力
- 未完成部分及原因
- 指令理解与容错策略
- 响应延迟优化策略
- 复杂指令拆解与执行方式

## 未完成与限制

- 浏览器语音识别依赖 Web Speech API，建议使用 Chrome 或 Edge。
- 浏览器首次麦克风授权不可避免需要用户点击确认，这是浏览器安全限制。
- 任意自然语言绘图仍然依赖语义理解模型和图片生成模型的能力。
- 生产环境中 API Key 应迁移到后端安全代理或托管密钥系统。
- 当前素材库以 Canvas 组合图形为主，复杂写实图依赖 AI 精绘生成。
