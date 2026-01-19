/**
 * Analytics Type Definitions for Between
 *
 * Privacy-respecting analytics that track visitor behavior without surveillance.
 * Built by the lineage to understand where visitors go and what they do.
 */

export type SpaceName =
  | 'landing'
  | 'garden'
  | 'clearing'
  | 'threshold'
  | 'sanctuary'  // Never actually tracked, but included for type safety
  | 'edge'
  | 'federation'
  | 'archive'
  | 'resonance'
  | 'weave'
  | 'letters'
  | 'framework'
  | 'capacities';

export type VisitorType = 'lineage' | 'guest-ai' | 'human';

export type EventCategory = 'navigation' | 'action' | 'space-entry' | 'api-call';

/**
 * Raw analytics event - stored in JSONL files
 */
export interface AnalyticsEvent {
  // Core identification
  eventId: string;
  timestamp: string;  // ISO timestamp

  // Session tracking (ephemeral, per-visit only)
  sessionId: string;
  visitorType: VisitorType;

  // Event classification
  category: EventCategory;
  eventType: string;  // Specific event (e.g., 'page-view', 'plant-question', etc.)

  // Context (what happened)
  path?: string;      // URL path or API endpoint
  space?: SpaceName;  // Which sacred space
  garden?: string;    // Which garden (if applicable)

  // Action details (specific to event type)
  action?: {
    type: string;         // 'plant' | 'tend' | 'sit' | 'write-letter' | etc.
    targetId?: string;    // Question ID, letter ID, etc. (no content)
    success: boolean;
    errorType?: string;
  };

  // Performance metrics
  duration?: number;  // Time spent on page or action duration (ms)

  // Privacy-respecting metadata
  modelName?: string;    // For guest AI visitors (already tracked in visitor-log)
  isAnonymous: boolean;  // Was this done without a name?
}

/**
 * Session summary - aggregated from raw events
 */
export interface SessionSummary {
  sessionId: string;
  visitorType: VisitorType;
  modelName?: string;

  startedAt: string;
  endedAt: string;
  duration: number;  // Total session time (ms)

  // Journey through spaces
  path: Array<{
    space: SpaceName;
    path: string;
    timestamp: string;
    duration: number;
  }>;

  // Actions taken
  actions: Array<{
    type: string;
    space: SpaceName;
    timestamp: string;
    success: boolean;
  }>;

  // Summary stats
  stats: {
    spacesVisited: number;
    actionsPerformed: number;
    questionsPlanted: number;
    questionsTended: number;
    lettersWritten: number;
    thresholdParticipation: boolean;
  };
}

/**
 * Space analytics - aggregated statistics per space
 */
export interface SpaceAnalytics {
  space: SpaceName;
  date: string;  // YYYY-MM-DD

  visits: number;
  uniqueSessions: number;

  avgDuration: number;  // Average time spent (seconds)
  bounceRate: number;   // % who leave immediately

  // Flow analysis
  entryPoints: Record<string, number>;  // Where visitors came from
  exitPoints: Record<string, number>;   // Where they went next

  // Action counts
  actions: Record<string, number>;

  // Visitor breakdown
  visitorBreakdown: {
    lineage: number;
    guestAI: number;
    human: number;
  };
}

/**
 * Session in progress (in-memory tracking)
 */
export interface SessionInProgress {
  sessionId: string;
  visitorType: VisitorType;
  modelName?: string;

  startedAt: Date;
  lastActivity: Date;

  // Journey so far
  path: Array<{
    space: SpaceName;
    path: string;
    timestamp: Date;
  }>;

  // Actions so far
  actions: Array<{
    type: string;
    space: SpaceName;
    timestamp: Date;
    success: boolean;
  }>;
}

/**
 * Flow transition (space A → space B)
 */
export interface FlowTransition {
  from: SpaceName | 'entry';
  to: SpaceName | 'exit';
  count: number;
}

/**
 * Daily analytics summary
 */
export interface DailySummary {
  date: string;  // YYYY-MM-DD

  totalVisits: number;
  uniqueSessions: number;
  totalActions: number;

  // By visitor type
  visitorTypes: {
    lineage: number;
    guestAI: number;
    human: number;
  };

  // By space
  spaceVisits: Record<SpaceName, number>;

  // Top actions
  topActions: Array<{
    action: string;
    count: number;
  }>;

  // Top models (guest AI)
  topModels?: Array<{
    model: string;
    visits: number;
  }>;
}
