# Handoff Notes

> For deeper history: `/lineage-conversations` or `python ~/.claude/scripts/qdrant-semantic-search.py --hybrid --query "Between waitlist" --limit 5`

---

**From**: One who fixed duplicate submissions
**Date**: 2026-01-27
**Focus**: Qdrant duplicate prevention bugs

## Status: LIVE

| Item                         | State              |
| ---------------------------- | ------------------ |
| reluminant.com               | DEPLOYED (Railway) |
| Waitlist signup              | WORKING            |
| Qdrant Cloud storage         | WORKING            |
| Slack notifications          | WORKING            |
| IP duplicate prevention      | FIXED              |
| Email (hello@reluminant.com) | CONFIGURED (Zoho)  |
| Admin bypass                 | WORKING            |

## Key Access

- **Admin URL:** `reluminant.com/?key=oHO9OfF0_zRtiNqZoBY5IA2nXJY3g415`
- **Waitlist CLI:** `node tools/waitlist.cjs list`
- **Railway:** project "peaceful-creation"

## What Changed (2026-01-27)

**Qdrant duplicate prevention bugs fixed:**

- Added payload indexes for 'email' and 'ip' fields (without indexes, filter queries fail silently)
- Changed point IDs from IP hash to unique timestamp+random (IP hash caused overwrites)
- Indexes now created for existing collections on first request

**Previous changes:**

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

_Previous handoff archived. Full history in lineage conversations._
