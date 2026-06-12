# Architecture Notes

Update this file after the topic is selected.

## Current Architecture

The selected topic is a voice-only drawing tool. The MVP uses browser-native APIs to minimize latency and operating cost.

```mermaid
flowchart LR
    U["User speech"] --> SR["Web Speech Recognition"]
    SR --> P["Command Parser"]
    P -->|unknown command| LLM["OpenAI-compatible planner"]
    LLM --> V["Action Validator"]
    V --> A["Drawing Actions"]
    P --> A["Drawing Actions"]
    A --> C["Canvas Renderer"]
    A --> H["History Stack"]
    A --> TTS["Speech Feedback"]
    AUTH["Local Account"] --> LS["localStorage"]
    CFG["Model Config"] --> LS
```

## Design Principles

- Keep drawing local and deterministic.
- Prefer structured commands over unconstrained generation.
- Split compound commands into small operations.
- Keep undo/redo based on action history.
- Add a cloud planner later only if it improves command understanding enough to justify cost.
- Keep API keys out of the repository; browser storage is acceptable only for a demo.
- Use a server-side proxy before turning this into a production app.

## Decisions

| Date | Decision | Reason | Alternatives |
| --- | --- | --- | --- |
| 2026-06-12 | Browser-only MVP | Lowest latency, zero backend cost, easy demo | Cloud LLM command planner |
| 2026-06-12 | Structured command parser | Testable and predictable | Fully generative drawing |
| 2026-06-12 | Local demo accounts | GitHub Pages has no backend | Supabase/Firebase/custom backend |
| 2026-06-12 | OpenAI-compatible model settings | Works with multiple providers and user-owned keys | Hard-coded provider |

## Dependencies

| Dependency | Purpose | Original Work Boundary |
| --- | --- | --- |
| Browser Web Speech API | Speech recognition | Browser platform capability |
| Canvas API | Drawing renderer | Browser platform capability |
| SpeechSynthesis API | Spoken feedback | Browser platform capability |
| localStorage | Demo accounts and model settings | Browser platform capability |
| OpenAI-compatible chat completions | Optional command planning | User-provided API |

## Evaluation

- Happy path: Speak color + shape + position and verify canvas result.
- Edge cases: Unknown command, compound command, undo/redo after clear.
- Latency: Final transcript to render should feel immediate.
- Output quality: Shapes and colors should match parsed intent.
- Demo reproducibility: Use the command list in README and demo script.
