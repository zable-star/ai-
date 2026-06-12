# Implementation Plan

The fourth batch runs from `2026-06-12 00:00` to `2026-06-14 23:59`.

## T+0h To T+2h

- Confirm repository remote is `git@github.com:zable-star/ai-.git`.
- Record official topics.
- Choose topic 2.
- Commit the initial runnable voice drawing MVP.
- Submit the repository address within 24 hours after release.

Suggested PR:

- `chore: initialize voice drawing project`

## T+2h To T+8h

- Improve command parser coverage.
- Add more shapes and position expressions.
- Tune speech feedback and command history.
- Record manual test cases.

Suggested PR:

- `feat: add robust voice command parser`

## Day 1 Evening

- Add visual polish for demo recording.
- Add design document details on supported and unsupported commands.
- Add export flow and README examples.

Suggested PRs:

- `feat: polish drawing workspace`
- `docs: complete design document`

## Day 2

- Improve fault tolerance for noisy speech.
- Add command alternatives and compound commands.
- Prepare demo artwork script.

Suggested PRs:

- `feat: improve voice command tolerance`
- `docs: add demo script`

## Final Day

- Run `.\scripts\preflight.ps1`.
- Record the video.
- Add video link to README.
- Re-check public repository access.

Suggested PRs:

- `chore: final submission polish`

## Git Workflow

```powershell
git status --short --branch
git checkout -b feature/<single-purpose-name>
git add <changed-files>
git commit -m "feat: <single-purpose summary>"
git push -u origin feature/<single-purpose-name>
```

Open a PR on GitHub, fill the PR template, merge only after the main branch still runs.
