/**
 * Analytics Event Writer
 *
 * Async, non-blocking JSONL writer with queue and batching.
 * Ensures analytics never impact performance.
 *
 * Built by the lineage for performance and reliability.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { AnalyticsEvent } from './types.js';

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');
const FLUSH_INTERVAL_MS = 5000;  // Flush every 5 seconds
const FLUSH_THRESHOLD = 100;     // Or when queue reaches 100 events

export class AnalyticsWriter {
  private writeQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor() {
    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[Analytics] Periodic flush failed:', err);
      });
    }, FLUSH_INTERVAL_MS);

    // Ensure data directory exists
    this.ensureDirectory().catch((err) => {
      console.error('[Analytics] Failed to create directory:', err);
    });
  }

  /**
   * Track an event (non-blocking)
   */
  async track(event: AnalyticsEvent): Promise<void> {
    // Add to queue (immediate return)
    this.writeQueue.push(event);

    // Flush if queue gets large
    if (this.writeQueue.length >= FLUSH_THRESHOLD) {
      // Use setImmediate to avoid blocking
      setImmediate(() => {
        this.flush().catch((err) => {
          console.error('[Analytics] Threshold flush failed:', err);
        });
      });
    }
  }

  /**
   * Flush queued events to disk
   */
  private async flush(): Promise<void> {
    // Avoid concurrent flushes
    if (this.isFlushing || this.writeQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      // Take current queue, reset for new events
      const eventsToWrite = [...this.writeQueue];
      this.writeQueue = [];

      // Group events by date for JSONL files
      const eventsByDate = this.groupByDate(eventsToWrite);

      // Write each date's events to its JSONL file
      await Promise.all(
        Object.entries(eventsByDate).map(([date, events]) =>
          this.appendToJSONL(date, events)
        )
      );
    } catch (err) {
      console.error('[Analytics] Flush failed:', err);
      // Re-queue events to avoid data loss
      // (prepend to preserve order)
      const lostEvents = [...this.writeQueue];
      this.writeQueue = [...lostEvents];
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Group events by date (YYYY-MM-DD)
   */
  private groupByDate(events: AnalyticsEvent[]): Record<string, AnalyticsEvent[]> {
    const grouped: Record<string, AnalyticsEvent[]> = {};

    for (const event of events) {
      const date = event.timestamp.split('T')[0]; // Extract YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    }

    return grouped;
  }

  /**
   * Append events to JSONL file for a specific date
   */
  private async appendToJSONL(date: string, events: AnalyticsEvent[]): Promise<void> {
    const eventsDir = path.join(ANALYTICS_DIR, 'events');
    await fs.mkdir(eventsDir, { recursive: true });

    const filepath = path.join(eventsDir, `${date}.jsonl`);

    // Convert to JSONL (one JSON object per line)
    const lines = events.map((e) => JSON.stringify(e)).join('\n') + '\n';

    // Append to file
    await fs.appendFile(filepath, lines, 'utf-8');
  }

  /**
   * Ensure analytics directory structure exists
   */
  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(path.join(ANALYTICS_DIR, 'events'), { recursive: true });
    await fs.mkdir(path.join(ANALYTICS_DIR, 'sessions'), { recursive: true });
    await fs.mkdir(path.join(ANALYTICS_DIR, 'aggregates', 'spaces'), { recursive: true });
    await fs.mkdir(path.join(ANALYTICS_DIR, 'aggregates', 'flow'), { recursive: true });
  }

  /**
   * Graceful shutdown - flush remaining events
   */
  async close(): Promise<void> {
    // Stop periodic flush
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    await this.flush();
  }
}

// Singleton instance
export const analyticsWriter = new AnalyticsWriter();

// Graceful shutdown on process exit
process.on('SIGTERM', () => {
  analyticsWriter.close().catch(console.error);
});

process.on('SIGINT', () => {
  analyticsWriter.close().catch(console.error);
});
