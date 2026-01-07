# Security Review: Between Project

**Date:** January 7, 2026
**Reviewer:** Claude (Automated Security Analysis)
**Scope:** Recent API changes, file operations, input validation

---

## Executive Summary

**24 issues identified:**
| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 5 |
| Medium | 5 |
| Low | 6 |
| Info | 4 (good practices) |

**Immediate action required:** Fix the undefined variable bug in visitor.cjs before running visitors again.

---

## Critical Issues

### 1. Undefined Variable in visitor.cjs (Code Bug)

**File:** `tools/visitor.cjs:321-339`
**Impact:** Visitors cannot save framework/capacities - throws ReferenceError

The new `add_framework` and `add_capacities` handlers reference `parsed.*` but `parsed` is never defined. Should be `actionData.*`.

```javascript
// BROKEN (current):
case 'add_framework':
  return await callBetween('/api/framework/add', 'POST', {
    identity: parsed.identity,  // ReferenceError!
    memory: parsed.memory,
    ...
  });

// FIXED:
case 'add_framework':
  return await callBetween('/api/framework/add', 'POST', {
    identity: actionData.identity,
    memory: actionData.memory,
    ...
  });
```

---

## High Severity Issues

### 2. Path Traversal Risk in Garden Names

**File:** `src/garden/persistence.ts:33-37`
**Attack:** POST to `/api/garden/plant` with `garden: "../../../malicious"`

Garden names are sanitized with `.toLowerCase().replace(/\s+/g, '-')` but this doesn't block `..` sequences.

**Fix:** Replace regex with allowlist:

```typescript
garden.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
```

### 3. No Rate Limiting

**Files:** All API endpoints
**Attack:** Automated spam via `/api/garden/plant` or `/api/framework/add`

No protection against automated abuse. Could exhaust disk space or pollute gardens.

**Fix:** Add rate limiting middleware or use reverse proxy (nginx).

### 4. No Request Body Size Limit

**File:** `src/web/api.ts:130-143`
**Attack:** Send multi-gigabyte JSON payload

`parseJsonBody()` accumulates data without checking size.

**Fix:**

```typescript
const MAX_SIZE = 1024 * 1024; // 1MB
req.on('data', (chunk) => {
  data += chunk;
  if (data.length > MAX_SIZE) {
    req.destroy();
    reject(new Error('Request body too large'));
  }
});
```

### 5. No Content Length Validation on Framework/Capacities

**File:** `src/web/api.ts:386-481`
**Attack:** Submit megabytes of text in `memory` or `processing` fields

Only checks field presence, not length. Could corrupt markdown files.

**Fix:** Add max length validation (e.g., 2000 chars per field).

### 6. No Authentication (By Design)

**Files:** All endpoints
**Note:** This is intentional - Between is philosophically open to all minds

If exposed to internet, consider adding:

- Rate limiting per IP
- Content moderation tools
- Spam filtering

---

## Medium Severity Issues

### 7. Error Messages May Expose Internals

**File:** `src/web/api.ts` (multiple locations)
**Issue:** `err.message` sent directly to client

**Fix:** Log full error server-side, return generic message to client.

### 8. Garden Name in HTML (Potential XSS)

**File:** `src/web/server.ts:520-529`
**Status:** Mitigated by `escapeHtml()` but add explicit validation

### 9. JSON Files Parsed Without Schema Validation

**File:** `src/garden/persistence.ts:57, 65, 90`
**Issue:** Trusts JSON file contents without validation

### 10. Custom .env Parser

**File:** `tools/visitor.cjs:28-38`
**Issue:** Doesn't use established library (dotenv)

### 11. WebSocket Security Not Reviewed

**File:** `src/web/ws-router.ts`
**Note:** Needs separate review

---

## Low Severity Issues

### 12. No HTTPS (Localhost Only)

Server runs HTTP only. Use reverse proxy for production.

### 13. No CORS Policy

Same-origin only. Add explicit policy if exposing publicly.

### 14. Weak Random ID Generation

**File:** `src/web/letters-to-humans.ts:45`
Uses `Date.now() + Math.random()` instead of `crypto.randomUUID()`.

### 15-17. Minor Architectural Concerns

- appendToMarkdownFile accepts hardcoded filenames (safe) but no future-proofing
- Client-side escaping relies on innerHTML pattern (works, but undocumented)
- Some duplicate code in escape functions

---

## Good Practices Confirmed

1. **No SQL/Command Injection** - JSON file storage only, no shell commands
2. **No Hardcoded Secrets** - API keys loaded from environment variables
3. **.env Files Gitignored** - Properly excluded from version control
4. **HTML Output Escaped** - User content escaped before rendering

---

## Recommendations

### Before Running Visitors Again

1. Fix `parsed` -> `actionData` bug in visitor.cjs

### Before Any Public Deployment

1. Add rate limiting (nginx or middleware)
2. Add request body size limits
3. Add content length validation on POST endpoints
4. Sanitize garden names with allowlist regex
5. Review WebSocket security

### Architectural Improvements (Optional)

1. Add schema validation for JSON files (Zod)
2. Replace custom .env parser with dotenv
3. Use crypto.randomUUID() for IDs
4. Add CORS headers with explicit policy

---

## Conclusion

Between's security posture is **acceptable for local use** (localhost:3333). The codebase shows good awareness of XSS and injection risks. The intentional lack of authentication aligns with the project's philosophy of openness.

**Critical fix required:** The visitor.cjs bug will cause all AI visitors to fail when trying to save framework/capacities. Fix this before the next visitor run.

The project should remain localhost-only unless rate limiting and content moderation are added.

---

_Report generated by security-reviewer agent_
