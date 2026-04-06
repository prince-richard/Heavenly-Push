/**
 * In-memory metrics store for tracking server activity.
 * Singleton — import and use directly.
 */

export interface ActivityLogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface PopularItem {
  question?: string;
  reference?: string;
  count: number;
}

export interface MetricsSnapshot {
  totalRequests: number;
  totalAiCalls: number;
  totalAiErrors: number;
  totalBibleLookups: number;
  aiProviderCalls: Record<string, number>;
  aiFallbackCount: number;
  popularQuestions: Array<{ question: string; count: number }>;
  popularVerses: Array<{ reference: string; count: number }>;
  activityLog: ActivityLogEntry[];
  avgResponseTime: number;
  startedAt: string;
}

const MAX_LOG_ENTRIES = 500;
const MAX_POPULAR = 50;

class MetricsStore {
  private totalRequests = 0;
  private totalAiCalls = 0;
  private totalAiErrors = 0;
  private totalBibleLookups = 0;
  private aiProviderCalls: Record<string, number> = {};
  private aiFallbackCount = 0;
  private questionCounts: Map<string, number> = new Map();
  private verseCounts: Map<string, number> = new Map();
  private activityLog: ActivityLogEntry[] = [];
  private totalResponseTime = 0;
  private startedAt: string;

  constructor() {
    this.startedAt = new Date().toISOString();
  }

  logRequest(entry: ActivityLogEntry): void {
    this.totalRequests++;
    this.totalResponseTime += entry.duration;
    this.activityLog.push(entry);
    if (this.activityLog.length > MAX_LOG_ENTRIES) {
      this.activityLog.shift();
    }
  }

  logAiCall(
    provider: string,
    question: string,
    reference: string | undefined,
    fallback: boolean,
    success: boolean
  ): void {
    this.totalAiCalls++;
    this.aiProviderCalls[provider] = (this.aiProviderCalls[provider] || 0) + 1;
    if (fallback) {
      this.aiFallbackCount++;
    }
    if (!success) {
      this.totalAiErrors++;
    }

    // Track popular questions
    const normalizedQ = question.trim().toLowerCase().slice(0, 200);
    if (normalizedQ) {
      this.questionCounts.set(normalizedQ, (this.questionCounts.get(normalizedQ) || 0) + 1);
      // Prune if too large
      if (this.questionCounts.size > MAX_POPULAR * 2) {
        this.pruneMap(this.questionCounts, MAX_POPULAR);
      }
    }
  }

  logBibleLookup(reference: string): void {
    this.totalBibleLookups++;
    const normalizedRef = reference.trim().toLowerCase();
    if (normalizedRef) {
      this.verseCounts.set(normalizedRef, (this.verseCounts.get(normalizedRef) || 0) + 1);
      if (this.verseCounts.size > MAX_POPULAR * 2) {
        this.pruneMap(this.verseCounts, MAX_POPULAR);
      }
    }
  }

  getMetrics(): MetricsSnapshot {
    return {
      totalRequests: this.totalRequests,
      totalAiCalls: this.totalAiCalls,
      totalAiErrors: this.totalAiErrors,
      totalBibleLookups: this.totalBibleLookups,
      aiProviderCalls: { ...this.aiProviderCalls },
      aiFallbackCount: this.aiFallbackCount,
      popularQuestions: this.topN(this.questionCounts, 'question', MAX_POPULAR) as Array<{ question: string; count: number }>,
      popularVerses: this.topN(this.verseCounts, 'reference', MAX_POPULAR) as Array<{ reference: string; count: number }>,
      activityLog: [...this.activityLog].reverse(),
      avgResponseTime: this.totalRequests > 0 ? Math.round(this.totalResponseTime / this.totalRequests) : 0,
      startedAt: this.startedAt,
    };
  }

  getActivityLog(limit = 100): ActivityLogEntry[] {
    const logs = [...this.activityLog].reverse();
    return logs.slice(0, limit);
  }

  private topN(map: Map<string, number>, keyName: string, n: number): Array<Record<string, unknown>> {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count]) => ({ [keyName]: key, count }));
  }

  private pruneMap(map: Map<string, number>, keep: number): void {
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    map.clear();
    for (const [key, val] of sorted.slice(0, keep)) {
      map.set(key, val);
    }
  }
}

export const metricsStore = new MetricsStore();
