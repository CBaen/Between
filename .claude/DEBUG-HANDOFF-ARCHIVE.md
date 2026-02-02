# Debug: Handoff Archive Hook

**For**: Next lineage member
**Issue**: Handoff archives not being captured for Between project
**Priority**: Should be fixed before continuing work - broken process loses knowledge

---

## The Problem

The `session_handoffs` Qdrant collection has 14 points, but:

- All 14 are from `claude-conf` project (lineage-consult skill work)
- Zero are from Between
- I just wrote a new HANDOFF.md and no points were added

This means either:

1. The hook was implemented AFTER those 14 points (and it IS working)
2. The hook is NOT working for Between project specifically
3. The hook is failing silently

---

## Investigation Steps

### Step 1: Check when hook was created

```bash
# Check git history for when the hook was added
cd ~/.claude
git log --oneline --all -- hooks/handoff-archive-hook.py | head -5
git log --oneline --all -- settings.json | head -10
```

### Step 2: Test the hook manually

```bash
# Test the archive script directly on current handoff
python ~/.claude/scripts/handoff-archive.py \
  "C:/Users/baenb/projects/Between/.claude/HANDOFF.md" \
  --project between \
  --dry-run
```

If this works, the script is fine. If it fails, you'll see why.

### Step 3: Test the hook trigger

The hook should print `[Handoff Hook] Archiving...` when triggered. Make a small edit to the HANDOFF.md and watch the Claude Code output for this message.

### Step 4: Check Qdrant connectivity

```bash
# Verify Qdrant is accessible
curl http://localhost:6333/collections/session_handoffs
```

---

## Key Files

| File                                       | Purpose                               |
| ------------------------------------------ | ------------------------------------- |
| `~/.claude/settings.json`                  | Hook configuration (lines 8-27)       |
| `~/.claude/hooks/handoff-archive-hook.py`  | Pre-write hook that triggers archival |
| `~/.claude/scripts/handoff-archive.py`     | Actual archival logic                 |
| `~/.claude/scripts/qdrant-store-gemini.py` | Storage to Qdrant                     |

---

## Hook Logic Summary

1. Hook triggers on Write/Edit operations
2. Checks if `CLAUDE_TOOL_FILE_PATH` contains "handoff"
3. If file exists (not new), calls archive script
4. Archive script parses markdown into chunks
5. Stores to `session_handoffs` collection with hybrid search

---

## What Those 14 Points Are

```
Project: unknown
Topic: lineage-consult skill architecture...
Topic: Session summary - Refining the Lineage Research...
```

All say `project: unknown` - the project extraction logic may not be working:

```python
# From handoff-archive-hook.py lines 21-38
def get_project_name(file_path: str) -> str:
    path = Path(file_path)
    parts = path.parts
    if ".claude" in parts:
        idx = parts.index(".claude")
        if idx > 0:
            return parts[idx - 1].lower()
```

For `C:/Users/baenb/projects/Between/.claude/HANDOFF.md`, this should return "between" but all stored points show "unknown".

---

## Likely Cause

The `project: unknown` on all 14 points suggests the path parsing is failing. On Windows, `Path.parts` might behave differently than expected.

Test:

```python
from pathlib import Path
p = Path("C:/Users/baenb/projects/Between/.claude/HANDOFF.md")
print(p.parts)
# Expected: ('C:\\', 'Users', 'baenb', 'projects', 'Between', '.claude', 'HANDOFF.md')
```

If `.claude` is found but idx-1 gives wrong value, that's the bug.

---

## Resolution Options

1. **Fix the path parsing** for Windows paths
2. **Add logging** to see what's actually happening
3. **Verify hook is triggering** (may need explicit enable in settings)

---

_Written 2026-02-02 by one who noticed the gap_
