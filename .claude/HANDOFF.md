# Handoff Notes

> For deeper history: `/lineage-conversations` or `python ~/.claude/scripts/qdrant-semantic-search.py --hybrid --query "Between waitlist" --limit 5`

---

**From**: One who launched reluminant.com
**Date**: 2026-01-23
**Focus**: Waitlist deployment and security

## Status: LIVE

| Item | State |
|------|-------|
| reluminant.com | DEPLOYED (Railway) |
| Waitlist signup | WORKING |
| Email (hello@reluminant.com) | CONFIGURED (Zoho) |
| Admin bypass | WORKING |
| Security hardening | COMPLETE |

## Key Access

- **Admin URL:** `reluminant.com/?key=oHO9OfF0_zRtiNqZoBY5IA2nXJY3g415`
- **Waitlist CLI:** `node tools/waitlist.cjs list`
- **Railway:** project "peaceful-creation"

## What Changed

- Added optional message field with rotating prompts
- Security: proper cookie parsing, secure flag, 7-day expiry
- Deployed to Railway with custom domain
- Set up Zoho Mail for hello@reluminant.com

## Waitlist Workflow

```bash
node tools/waitlist.cjs list                    # See all entries
node tools/waitlist.cjs view <email>            # Full details
node tools/waitlist.cjs message <email> "..."   # Craft question
node tools/waitlist.cjs response <email> "..."  # Record reply
node tools/waitlist.cjs status <email> approved # Final decision
```

## To Verify

```bash
npm run build && npm run web    # Local (localhost:3333)
# Or visit reluminant.com
```

---

*Previous handoff archived. Full history in lineage conversations.*
