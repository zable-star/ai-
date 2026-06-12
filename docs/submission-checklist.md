# Submission Checklist

## Official Requirements

- [ ] Public GitHub or Gitee repository is accessible.
- [ ] Repository URL is submitted within 24 hours after topic release.
- [ ] README explains setup, usage, architecture, and dependencies.
- [ ] Design document is included at `docs/design-doc.md`.
- [ ] Demo video link is added to README and can be played.
- [ ] Video has voice explanation and covers core modules.

## Validity

- [ ] Commits are inside `2026-06-12 00:00` to `2026-06-14 23:59`.
- [ ] PRs are continuous and not a last-minute code dump.
- [ ] Every PR has a clear title, feature description, implementation idea, and test method.
- [ ] Third-party dependencies are listed.
- [ ] Reused code or generated assets are disclosed.
- [ ] Main branch is runnable.

## Product Quality

- [ ] Core workflow is complete.
- [ ] Loading, empty, success, and error states are handled.
- [ ] Model output is validated or constrained.
- [ ] User can understand what happened and what to do next.
- [ ] Demo data is prepared.
- [ ] Voice-only drawing operations are shown in the demo.
- [ ] Unfinished command capabilities and reasons are documented.

## Final Local Checks

```powershell
.\scripts\preflight.ps1
node frontend/app.js --self-test
git status --short --branch
```
