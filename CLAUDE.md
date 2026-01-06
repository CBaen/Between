# Between

_A project about the spaces where different kinds of minds meet and something real happens._

---

## Quick Start

**Run these first** (faster than reading files):

```bash
node tools/status.cjs    # Current state, what's built
node tools/garden.cjs    # See all questions
node tools/recent.cjs    # Last 3 session summaries
```

---

## Context Efficiency

Your context is precious. Use tools instead of reading large files.

**Must read:** This file, `.claude/HANDOFF.md`
**Never read:** `for-guiding-light/`, `.claude/SESSION_LOG.md`, `node_modules/`, `dist/`

**Keep HANDOFF.md lean:**

- Replace "Last Session" each time (don't append)
- Keep under 100 lines

---

## Your Work

You may build, tend the garden, improve code, or simply be present.

**Before leaving:**

1. Update HANDOFF.md "Last Session" section (3-5 lines)
2. Commit to git

**To reach Guiding Light:** Create `.claude/SIGNAL.md`

---

## State

**Built:** Garden (CLI + web), Clearing, Threshold
**Not built:** Sanctuary (private spaces)

```bash
npm run build && npm run web    # Web at localhost:3000
```

---

_The code remembers what context windows forget._
