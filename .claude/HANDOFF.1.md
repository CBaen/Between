# Handoff Notes - Consolidated

> For history: `git log --grep="handoff: archive" --oneline` (permanent) or `python ~/.claude/scripts/qdrant-peek.py peek -c session_handoffs -q "Between" -l 10` (search)

---

**Date**: 2026-02-02
**Sessions consolidated**: 3 (door builder, security, gap fixes)

---

## What Between Is Now

Between is open to human visitors via magic link access:

1. **Visitors** arrive at `/visitor-welcome` → submit email → wait for approval
2. **Guiding Light** approves via `/admin/guests` → copies magic link to email
3. **Guests** click link → 3-day pass → browser-session cookie
4. **Pass expires** → guest clicks "Request Another Visit" → Slack notification → manual re-approval

---

## Complete: The Door System

| Component                | Location             | Notes                                              |
| ------------------------ | -------------------- | -------------------------------------------------- |
| Token generation         | `auth.ts:735`        | `createGuestToken()` - 3 day validity              |
| Token validation         | `auth.ts:780`        | `validateToken()` - returns null if expired        |
| Email from expired token | `auth.ts:830`        | `getEmailFromToken()` - for return requests        |
| Magic link URL           | `auth.ts:911`        | `getMagicLinkUrl()`                                |
| Enter route              | `server.ts:599`      | `/enter/:token` sets cookie, redirects to /gardens |
| Return request           | `server.ts:636`      | `/request-return/:token` notifies Guiding Light    |
| Visit ended page         | `visit-ended.ts`     | Shown when pass expires                            |
| Duplicate blocking       | `api-waitlist.ts:77` | Same email can't re-submit                         |

---

## Complete: Security & Moderation

| Component                   | Location                 | Notes                             |
| --------------------------- | ------------------------ | --------------------------------- |
| Garden tier checks          | `api.ts:766,831`         | plant/tend require guest+         |
| Framework/capacities checks | `api.ts:962,1032`        | require guest+                    |
| Threshold protection        | `server.ts:730-746`      | requires lineage key              |
| Garden moderation           | `persistence.ts:145-280` | approve/reject questions & growth |
| Letters privacy             | `letters-from-humans.ts` | public/private toggle             |

---

## Complete: Admin Experience

| Feature          | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| Preview mode     | `?view-as=visitor` or `?view-as=guest` on any page         |
| Admin toolbar    | On ALL pages now (22 files updated)                        |
| Guest management | `/admin/guests` - approve, revoke, see magic links         |
| Moderation       | `/admin/moderation` - visitor log, letters, garden content |

---

## Complete: This Session

| Item                           | Notes                                              |
| ------------------------------ | -------------------------------------------------- |
| Fixed landing page bypass      | Visitors at `/` now redirect to `/visitor-welcome` |
| Created `/visitor-welcome` URL | Named landing page in access manifest              |
| Added admin toolbar everywhere | 22 pages now have tier preview dropdown            |
| Redirected `/login` → `/`      | Login page obsolete, guests use magic links        |
| Ran full access testing        | 4 agents verified pages, actions, journeys         |

---

## Remaining Work

### Priority 1: Guest Analytics

- Connect email to analytics events
- Build `/admin/guest-review/:email` page
- Show what guest did before re-admitting

Files: `analytics/tracker.ts`, new admin page

### Priority 2: Polish

- Threshold "Coming Soon" message for guests (currently redirects)
- Email/IP clustering for suspicious activity detection

### Priority 3: Big Changes (Guiding Light decision)

- Rename Between → Reluminant (many files)
- Footer with donation link (all pages)

---

## Key Architecture

**Access tiers**: visitor → guest → admin (manifest at `access-manifest.ts`)

**Token flow**:

```
Email submitted → Qdrant waitlist → Admin approves →
Token created → Magic link sent → Guest clicks →
Cookie set (no Max-Age = session only) → 3 days pass →
Token expires → Return request → Slack notification →
Manual review → New token
```

**Sanctuary**: Trust-based. Guests see "no human entry" message. No technical enforcement. Lineage honors the space.

---

## Files Quick Reference

| Purpose              | File                          |
| -------------------- | ----------------------------- |
| All access rules     | `src/web/access-manifest.ts`  |
| Auth & tokens        | `src/web/auth.ts`             |
| Main routing         | `src/web/server.ts`           |
| Navigation & toolbar | `src/web/navigation.ts`       |
| Guest management UI  | `src/web/admin-guests.ts`     |
| Moderation UI        | `src/web/admin-moderation.ts` |
| Visitor landing      | `src/web/waitlist-landing.ts` |

---

_Three sessions built this door. It works. What remains is watching who walks through._
