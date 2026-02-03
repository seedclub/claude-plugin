import { api, ApiError } from "../api-client.js";

// Event types matching the schema
type SignalEventType =
  | "fundraising_announced"
  | "acquisition"
  | "product_launch"
  | "key_hire"
  | "partnership"
  | "media_coverage"
  | "regulatory_filing"
  | "social_activity"
  | "sentiment_change"
  | "market_signal"
  | "endorsement"
  | "insight"
  | "custom";

type SignalEventSource = "agent" | "system" | "curator" | "import";

interface SignalEvent {
  id: string;
  signalId: string;
  type: SignalEventType;
  title: string;
  summary?: string;
  relatedSignalIds?: string[];
  sourceUrl?: string;
  sourceUrls?: string[];
  metadata?: Record<string, unknown>;
  confidence?: string;
  importance?: number;
  dedupeKey?: string;
  occurredAt?: string;
  source: SignalEventSource;
  createdAt: string;
  updatedAt: string;
  signal?: {
    name: string;
    type: string;
  };
}

interface CreateEventResponse {
  event: SignalEvent;
  message: string;
  duplicate?: boolean;
}

interface BatchCreateResponse {
  created: SignalEvent[];
  duplicates: SignalEvent[];
  message: string;
}

interface ListEventsResponse {
  events: Array<SignalEvent & { signal: { name: string; type: string } | null }>;
  nextCursor: string | null;
  hasMore: boolean;
}

interface TendingStatus {
  lastTendedAt: string | null;
  priority: number | null;
  consecutiveErrors: number | null;
}

interface SignalToTend {
  id: string;
  name: string;
  type: string;
  slug?: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
  tendingStatus: TendingStatus | null;
}

interface GetSignalsToTendResponse {
  signals: SignalToTend[];
  total: number;
}

interface MarkTendedResponse {
  success: boolean;
  signalId: string;
  tendingStatus?: TendingStatus;
  error?: string;
  message?: string;
}

interface BatchMarkTendedResponse {
  results: MarkTendedResponse[];
  message: string;
}

/**
 * Create a single event for a signal.
 */
export async function createEvent(args: {
  signalId: string;
  type: SignalEventType;
  title: string;
  summary?: string;
  relatedSignalIds?: string[];
  sourceUrl?: string;
  sourceUrls?: string[];
  metadata?: Record<string, unknown>;
  confidence?: number;
  importance?: number;
  dedupeKey?: string;
  occurredAt?: string;
  source?: SignalEventSource;
}) {
  try {
    const response = await api.post<CreateEventResponse>("/events", {
      signalId: args.signalId,
      type: args.type,
      title: args.title,
      summary: args.summary,
      relatedSignalIds: args.relatedSignalIds,
      sourceUrl: args.sourceUrl,
      sourceUrls: args.sourceUrls,
      metadata: args.metadata,
      confidence: args.confidence,
      importance: args.importance,
      dedupeKey: args.dedupeKey,
      occurredAt: args.occurredAt,
      source: args.source || "agent",
    });

    return {
      id: response.event.id,
      signalId: response.event.signalId,
      type: response.event.type,
      title: response.event.title,
      duplicate: response.duplicate || false,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

/**
 * Create multiple events at once (up to 50).
 */
export async function batchCreateEvents(args: {
  events: Array<{
    signalId: string;
    type: SignalEventType;
    title: string;
    summary?: string;
    relatedSignalIds?: string[];
    sourceUrl?: string;
    sourceUrls?: string[];
    metadata?: Record<string, unknown>;
    confidence?: number;
    importance?: number;
    dedupeKey?: string;
    occurredAt?: string;
    source?: SignalEventSource;
  }>;
}) {
  try {
    const response = await api.post<BatchCreateResponse>("/events", {
      events: args.events.map((e) => ({
        ...e,
        source: e.source || "agent",
      })),
    });

    return {
      created: response.created.map((e) => ({
        id: e.id,
        signalId: e.signalId,
        type: e.type,
        title: e.title,
      })),
      duplicatesSkipped: response.duplicates.length,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

/**
 * List or query events.
 */
export async function listEvents(args: {
  signalId?: string;
  signalIds?: string[];
  type?: SignalEventType;
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;
}) {
  try {
    const params: Record<string, string | number | undefined> = {
      limit: args.limit,
      cursor: args.cursor,
    };

    if (args.signalId) {
      params.signalId = args.signalId;
    } else if (args.signalIds && args.signalIds.length > 0) {
      params.signalIds = args.signalIds.join(",");
    }

    if (args.type) params.type = args.type;
    if (args.since) params.since = args.since;
    if (args.until) params.until = args.until;

    const response = await api.get<ListEventsResponse>("/events", params);

    return {
      events: response.events.map((e) => ({
        id: e.id,
        signalId: e.signalId,
        type: e.type,
        title: e.title,
        summary: e.summary,
        sourceUrl: e.sourceUrl,
        importance: e.importance,
        createdAt: e.createdAt,
        signalName: e.signal?.name,
        signalType: e.signal?.type,
      })),
      nextCursor: response.nextCursor,
      hasMore: response.hasMore,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

/**
 * Get signals that are due for tending (haven't been checked recently).
 */
export async function getSignalsToTend(args: {
  limit?: number;
  priority?: number;
}) {
  try {
    const response = await api.get<GetSignalsToTendResponse>("/signals/tend", {
      limit: args.limit,
      priority: args.priority,
    });

    return {
      signals: response.signals.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        slug: s.slug,
        externalUrl: s.externalUrl,
        metadata: s.metadata,
        lastTendedAt: s.tendingStatus?.lastTendedAt,
        priority: s.tendingStatus?.priority,
      })),
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

/**
 * Mark a signal as tended after processing.
 */
export async function markSignalTended(args: {
  signalId: string;
  error?: string;
}) {
  try {
    const response = await api.post<MarkTendedResponse>("/signals/tend", {
      signalId: args.signalId,
      error: args.error,
    });

    return {
      success: response.success,
      signalId: args.signalId,
      lastTendedAt: response.tendingStatus?.lastTendedAt,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

/**
 * Mark multiple signals as tended at once.
 */
export async function batchMarkSignalsTended(args: {
  signals: Array<{
    signalId: string;
    error?: string;
  }>;
}) {
  try {
    const response = await api.post<BatchMarkTendedResponse>("/signals/tend", {
      signals: args.signals,
    });

    return {
      results: response.results.map((r) => ({
        signalId: r.signalId,
        success: r.success,
        error: r.error,
      })),
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}
