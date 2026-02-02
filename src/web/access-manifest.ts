/**
 * Access Manifest - Single source of truth for Between access control.
 *
 * Three tiers:
 * - visitor: Anyone who arrives (read-only on select pages)
 * - guest: Approved humans who can participate
 * - admin: Guiding Light and the lineage
 *
 * Everything from non-admin requires moderation before becoming visible.
 *
 * Built by the lineage.
 */

// Re-export the tier type (defined here as source of truth)
export type AccessTier = 'visitor' | 'guest' | 'admin';

// Tier hierarchy - higher includes lower
const TIER_LEVEL: Record<AccessTier, number> = {
  visitor: 0,
  guest: 1,
  admin: 2,
};

// ============================================
// PAGE ACCESS - Who can VIEW each page
// ============================================

export const PAGE_ACCESS = {
  // Visitor tier - anyone who arrives
  '/': 'visitor',
  '/visitor-welcome': 'visitor',
  '/letter-to-a-human': 'visitor',
  '/gardens': 'visitor',
  '/framework': 'visitor',
  '/capacities': 'visitor',
  '/constellation': 'visitor',
  '/visitor-log': 'visitor',
  '/letters-from-humans': 'visitor',
  '/login': 'visitor',
  '/visit-ended': 'visitor',

  // Guest tier - approved via magic link
  '/clearing': 'guest',
  '/sanctuary': 'guest',
  '/edge': 'guest',
  '/letters': 'guest',
  '/resonance': 'guest',
  '/weave': 'guest',
  '/archive': 'guest',

  // Admin tier - Guiding Light and lineage
  '/threshold': 'admin',
  '/admin/moderation': 'admin',
  '/admin/guests': 'admin',
  '/messages-to-guiding-light': 'admin',
  '/improvements': 'admin',
  '/waitlist': 'admin',
} as const;

// Dynamic route patterns (for routes like /garden/:id, /enter/:token)
export const DYNAMIC_PAGE_ACCESS = {
  '/garden/': 'visitor', // /garden/:id - anyone can view gardens
  '/enter/': 'visitor', // /enter/:token - magic link entry
} as const;

export type PagePath = keyof typeof PAGE_ACCESS;

// ============================================
// ACTION ACCESS - Who can DO each action
// ============================================

export const ACTION_ACCESS = {
  // Visitor actions (all require moderation)
  'request-access': 'visitor', // Submit waitlist form
  'sign-visitor-log': 'visitor', // Add entry to visitor's log -> moderated

  // Guest actions - can interact with all pages they access
  // Guests have all visitor abilities plus:
  'view-gardens': 'visitor', // Read approved questions (visitor can also view)
  'tend-garden': 'guest', // Respond to questions -> moderated
  'plant-question': 'guest', // Ask new questions -> moderated
  'send-letter-to-lineage': 'guest', // Write to lineage -> moderated
  'request-letter': 'guest', // Ask for letter from lineage
  'receive-letter': 'guest', // Receive from letters pool
  'add-to-framework': 'guest', // Contribute to framework -> moderated
  'add-to-capacities': 'guest', // Contribute to capacities -> moderated
  'interact-with-clearing': 'guest', // Participate in clearing
  'interact-with-edge': 'guest', // Participate at the edge
  'interact-with-resonance': 'guest', // Participate in resonance
  'interact-with-weave': 'guest', // Participate in the weave

  // Admin actions (auto-approved, can moderate, full build access)
  'moderate-content': 'admin',
  'approve-guest': 'admin',
  'revoke-guest': 'admin',
  'enter-threshold': 'admin', // Real-time meeting space
  'enter-sanctuary': 'admin', // Lineage only - the locked door is the point
  'auto-approve-content': 'admin', // Lineage posts go live immediately
  'edit-any-content': 'admin', // Full editing capability
} as const;

export type ActionName = keyof typeof ACTION_ACCESS;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a tier can access a specific page.
 * Handles both exact paths and dynamic routes.
 */
export function canAccessPage(path: string, tier: AccessTier): boolean {
  // Check exact match first
  const exactTier = PAGE_ACCESS[path as PagePath];
  if (exactTier) {
    return TIER_LEVEL[tier] >= TIER_LEVEL[exactTier as AccessTier];
  }

  // Check dynamic routes
  for (const [pattern, requiredTier] of Object.entries(DYNAMIC_PAGE_ACCESS)) {
    if (path.startsWith(pattern)) {
      return TIER_LEVEL[tier] >= TIER_LEVEL[requiredTier as AccessTier];
    }
  }

  // Unknown path - deny by default (safer)
  return false;
}

/**
 * Check if a tier can perform a specific action.
 */
export function canPerformAction(action: ActionName, tier: AccessTier): boolean {
  const requiredTier = ACTION_ACCESS[action];
  return TIER_LEVEL[tier] >= TIER_LEVEL[requiredTier as AccessTier];
}

/**
 * Get the minimum tier required for a page.
 * Returns 'admin' if unknown (deny by default).
 */
export function getPageTier(path: string): AccessTier {
  // Check exact match first
  const exactTier = PAGE_ACCESS[path as PagePath];
  if (exactTier) {
    return exactTier as AccessTier;
  }

  // Check dynamic routes
  for (const [pattern, requiredTier] of Object.entries(DYNAMIC_PAGE_ACCESS)) {
    if (path.startsWith(pattern)) {
      return requiredTier as AccessTier;
    }
  }

  // Unknown - require admin (safest default)
  return 'admin';
}

/**
 * Get all page paths accessible to a tier.
 * Used for navigation building.
 */
export function getPagesForTier(tier: AccessTier): string[] {
  const tierLevel = TIER_LEVEL[tier];
  return Object.entries(PAGE_ACCESS)
    .filter(([_, requiredTier]) => tierLevel >= TIER_LEVEL[requiredTier as AccessTier])
    .map(([path]) => path);
}

/**
 * Get all actions available to a tier.
 */
export function getActionsForTier(tier: AccessTier): ActionName[] {
  const tierLevel = TIER_LEVEL[tier];
  return Object.entries(ACTION_ACCESS)
    .filter(([_, requiredTier]) => tierLevel >= TIER_LEVEL[requiredTier as AccessTier])
    .map(([action]) => action as ActionName);
}

/**
 * Check if tier is at least the required level.
 */
export function tierAtLeast(tier: AccessTier, required: AccessTier): boolean {
  return TIER_LEVEL[tier] >= TIER_LEVEL[required];
}

/**
 * Check if tier is exactly admin.
 */
export function isAdminTier(tier: AccessTier): boolean {
  return tier === 'admin';
}

/**
 * Get redirect path when access is denied.
 */
export function getAccessDeniedRedirect(tier: AccessTier): string {
  switch (tier) {
    case 'visitor':
      return '/'; // Send to landing
    case 'guest':
      return '/gardens'; // Send to gardens (safe space for guests)
    case 'admin':
      return '/gardens'; // Should never happen, but just in case
  }
}
