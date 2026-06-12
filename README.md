# AI Voice Drawing Tool

Qiniu Cloud x XEngineer 2026 fourth-batch competition project.

Chosen topic: Topic 2, AI voice drawing tool.

## Current Status

- Official page: https://hr.qiniu.com/#flow
- Repository: `git@github.com:zable-star/ai-.git`
- Selected batch: fourth batch, `2026-06-12 00:00` to `2026-06-14 23:59`
- Topic: AI voice drawing tool
- Demo video: TBD

The application lets users create drawings by speaking commands. After the browser microphone permission is granted, drawing operations are voice-only: color selection, shape creation, line width changes, undo, redo, clear, and export.

## Online Demo

```text
https://zable-star.github.io/ai-/
```

## New Features

- Local registration and login for demo accounts.
- Left-side tabs for drawing, account, model configuration, and help.
- OpenAI-compatible model planning. Users provide their own endpoint, model, and API key in the browser.
- Hybrid command strategy: local parser first, model fallback only when local rules cannot understand the command.

Security note: API keys are stored only in the current browser's `localStorage`. They are never committed to this repository. For production, move API calls behind a backend proxy.

## Why This Topic

I chose topic 2 because it can deliver a complete, stable, low-cost MVP within the competition window:

- No cloud model is required for the first version.
- Browser speech recognition keeps latency low and operating cost near zero.
- A local canvas makes the demo deterministic.
- The command parser can be tested without microphone input.

## Project Layout

```text
.
|-- backend/                 # Reserved for later API/model extensions
|-- frontend/                # Voice drawing web app
|-- docs/                    # Design, topic intake, demo, submission notes
|-- scripts/                 # Local helper scripts
`-- .github/                 # PR template and GitHub workflow files
```

## Run Locally

Use a local HTTP server. Browser speech recognition and microphone permissions are more reliable on `localhost` than through a direct file URL.

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/frontend/
```

Run preflight checks:

```powershell
.\scripts\preflight.ps1
```

## Voice Commands In MVP

Examples:

- `画一个红色圆形`
- `在左上角画蓝色矩形`
- `画一条从左上到右下的绿色线`
- `线宽五`
- `粗一点`
- `清空画布`
- `撤销`
- `重做`
- `保存图片`

The parser also splits multi-step commands such as `画一个红色圆形，然后在右下角画蓝色矩形`.

With model planning enabled, try more natural commands:

- `帮我画一个夕阳，有一棵树和一条路`
- `画一个房子，左边有树，右上角有太阳`
- `生成一个简单的流程图，有开始、处理和结束`

## Design Document

The official design document is [docs/design-doc.md](docs/design-doc.md). It records:

- Planned command capabilities
- Implemented command capabilities
- Unfinished parts and reasons
- Latency, fault tolerance, and cost-control strategy

## Submission Materials

- Public GitHub or Gitee repository
- README with setup, usage, architecture, dependencies, and original work scope
- Demo video link with voice explanation
- Clear PR history and commit distribution inside the selected batch

## Development Rules

- One PR should do one thing.
- PR descriptions must include feature purpose, implementation idea, and test method.
- Main branch should remain runnable after each merge.
- Third-party libraries, model APIs, reused snippets, and generated assets must be listed in README or docs.
