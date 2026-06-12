# Demo Script

Target length: 3 to 5 minutes.

## 1. Opening

- Project name: AI Voice Drawing Tool
- Chosen topic: AI 语音绘图工具
- Target user and pain point: users who want hands-free quick sketching
- One-sentence value: speak drawing intentions and see the canvas update immediately

## 2. Main Flow

Show the core workflow without pausing:

1. Open the app.
2. Start microphone recognition.
3. Speak: `画一个红色圆形`.
4. Speak: `然后在右下角画蓝色矩形`.
5. Speak: `画一条从左上到右下的绿色线`.
6. Speak: `撤销`.
7. Speak: `重做`.
8. Speak: `保存图片`.

## 3. Technical Highlights

- Architecture: browser speech recognition, command parser, canvas renderer, action history.
- AI model and prompt strategy: browser speech engine in MVP; cloud planner reserved for future.
- Context handling: local action history.
- Error handling: unknown commands do not mutate canvas and produce retry feedback.
- What is original: parser, renderer, UI, design document.

## 4. Quality And Process

- PR based development: one PR per focused feature.
- Tests or smoke checks: parser self-test through `node frontend/app.js --self-test`.
- Known limitations: no free-form image generation, no object-level natural edits yet.
- Future extensions: cloud command planner and object references.

## 5. Closing

- Repeat the product value.
- Mention the repository README has setup steps and dependency disclosure.
