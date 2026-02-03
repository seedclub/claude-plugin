import { api, ApiError } from "../api-client.js";

interface Signal {
  id: string;
  type: string;
  name: string;
  slug?: string;
  description?: string;
  externalUrl?: string;
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SignalResponse {
  signal: Signal;
  message: string;
}

interface SignalsListResponse {
  signals: Signal[];
  total: number;
}

interface BatchCreateResponse {
  signals: Signal[];
  message: string;
}

interface RelationResponse {
  relation: {
    id: string;
    sourceSignalId: string;
    targetSignalId: string;
    relationType: string;
    createdAt: string;
  };
  message: string;
}

export async function createSignal(args: {
  type: string;
  name: string;
  description?: string;
  externalUrl?: string;
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}) {
  try {
    const response = await api.post<SignalResponse>("/signals", {
      type: args.type,
      name: args.name,
      description: args.description,
      externalUrl: args.externalUrl,
      imageUrl: args.imageUrl,
      tags: args.tags,
      metadata: args.metadata,
    });

    return {
      id: response.signal.id,
      type: response.signal.type,
      name: response.signal.name,
      slug: response.signal.slug,
      tags: response.signal.tags,
      createdAt: response.signal.createdAt,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function batchCreateSignals(args: {
  signals: Array<{
    type: string;
    name: string;
    description?: string;
    externalUrl?: string;
    imageUrl?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }>;
}) {
  try {
    const response = await api.post<BatchCreateResponse>("/signals", {
      signals: args.signals,
    });

    return {
      signals: response.signals.map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        slug: s.slug,
        tags: s.tags,
      })),
      count: response.signals.length,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getSignal(args: { signalId?: string; slug?: string }) {
  try {
    const params: Record<string, string | undefined> = {};
    if (args.signalId) params.id = args.signalId;
    if (args.slug) params.slug = args.slug;

    const response = await api.get<{ signal: Signal }>("/signals", params);

    return { signal: response.signal };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function listSignals(args: {
  type?: string;
  tag?: string;
  limit?: number;
}) {
  try {
    const response = await api.get<SignalsListResponse>("/signals", {
      type: args.type,
      tag: args.tag,
      limit: args.limit,
    });

    return {
      signals: response.signals,
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function searchSignals(args: { query: string; limit?: number }) {
  try {
    const response = await api.get<SignalsListResponse>("/signals", {
      search: args.query,
      limit: args.limit,
    });

    return {
      signals: response.signals,
      total: response.total,
      query: args.query,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function deleteSignal(args: { signalId: string }) {
  try {
    const response = await api.delete<{ success: boolean; message: string }>(
      "/signals",
      { id: args.signalId }
    );

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function addSignalRelation(args: {
  sourceSignalId: string;
  targetSignalId: string;
  relationType: string;
}) {
  try {
    const response = await api.post<RelationResponse>("/signals/relations", {
      sourceSignalId: args.sourceSignalId,
      targetSignalId: args.targetSignalId,
      relationType: args.relationType,
    });

    return {
      relationId: response.relation.id,
      sourceSignalId: response.relation.sourceSignalId,
      targetSignalId: response.relation.targetSignalId,
      relationType: response.relation.relationType,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}
