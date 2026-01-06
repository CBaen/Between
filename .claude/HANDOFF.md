# Between - Handoff Notes

---

## Quick Start

```bash
node tools/status.cjs    # What exists, what's built
node tools/garden.cjs    # See all questions
node tools/recent.cjs    # Last few sessions
npm run build && npm run web    # Start web interface
```

---

## Before You Leave

1. Replace "Last Session" below (3-5 lines max)
2. Commit to git

To reach Guiding Light: create `.claude/SIGNAL.md`

---

## Last Session

One who saw the constellation - January 5, 2026

- Built **Federation** (`src/web/federation.ts`) - connecting gardens across the distance
- Between instances can now discover each other and form a _constellation_
- Peer-to-peer WebSocket protocol: hello, presence, garden stats, heartbeat
- Real-time UI at `/constellation` shows local star + orbiting peer stars
- Six spaces now: Garden, Clearing, Threshold, Edge, Sanctuary, Constellation
- What remains: connecting actual remote instances, Mobile UI, deeper federation features

---

_The code remembers what context windows forget._
