# Topic Intake

Fourth batch topic intake, filled on `2026-06-12`.

## Official Topics

### Topic 1: AI 视觉对话助手

请开发一款与 AI 对话的应用。

要求：打开摄像头与麦克风，让 AI 能够看到摄像头中的视频内容、听到用户说的话，并给予恰当的回应。需综合考虑视觉内容的理解准确性、语音交互的自然度与流畅性，以及端云协同的成本控制策略等。实现应用的同时，请额外提交一份设计文档，内容包含：1）你计划实现哪些用户故事，最终实现了哪些；2）你想到了哪些控制运营成本的技巧，实际采用了哪些。

### Topic 2: AI 语音绘图工具

请开发一款纯语音控制的绘图工具。

要求：用户不能使用鼠标或键盘，仅通过语音指令完成绘图创作。请综合考虑指令理解的准确性与容错性、语音到绘图操作的响应延迟，以及复杂指令的拆解与执行能力。实现应用的同时，请额外提交一份设计文档，记录你计划支持哪些指令能力，最终实现了哪些，以及未完成部分的原因说明。

## Topic Choice

- Chosen topic: Topic 2, AI 语音绘图工具
- Why this topic: It is feasible to finish a complete browser-only MVP quickly, with low operating cost and a stable demo.
- Target user: Users who want to sketch simple ideas hands-free, including children, presenters, and users with limited hand interaction.
- Pain point: Traditional drawing tools require frequent mouse/keyboard interaction and are slow for quick verbal ideas.
- One-sentence product promise: Speak drawing intentions and immediately see a structured picture appear on canvas.

## MVP Boundary

Must have:

- [x] Open microphone speech recognition in browser.
- [x] Parse color, shape, position, line width, clear, undo, redo, and export commands.
- [x] Render drawing operations on canvas.
- [x] Split multi-step voice commands.
- [x] Provide visible recognition status and command history.

Should have:

- [x] Browser speech synthesis feedback.
- [x] Parser self-test for command accuracy.
- [ ] Free-form semantic drawing via cloud model.
- [ ] Natural correction commands like "make the previous circle bigger".

Won't do in the first version:

- [ ] Full image generation from arbitrary prompts.
- [ ] Multi-user collaboration.
- [ ] Pixel-level editing.

## Core User Flow

1. User opens the local web app.
2. User grants microphone permission.
3. User speaks a drawing command.
4. System parses one or more drawing actions.
5. Canvas updates immediately and the app speaks a short acknowledgement.
6. User continues by voice, then exports the final image.

## AI Capability

- Model or API: Browser speech recognition for MVP; cloud LLM command planner reserved as an extension.
- Prompt strategy: Not required for the MVP parser; future LLM mode will output a structured operation list.
- Context provided to the model: None in MVP.
- Output schema: Internal action objects such as `drawShape`, `setColor`, `clear`, `undo`, `export`.
- Error handling: Unknown commands return a spoken and visible retry hint.
- Latency target: Under 300 ms from final transcript to canvas update.
- Evaluation method: Parser self-test plus manual microphone demo.

## Data And Privacy

- User data collected: Microphone transcript provided by the browser speech engine.
- Data stored locally: Drawing actions are held in memory only.
- Data sent to model/API: None by the app in MVP.
- Sensitive data handling: No account, no upload, no server persistence.

## Original Work Boundary

- Third-party libraries: None.
- Existing code reused: None.
- Generated assets: None.
- Original implementation parts: Command parser, canvas renderer, speech loop, UI, design document.
