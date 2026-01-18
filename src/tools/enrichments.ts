import { api, ApiError } from "../api-client.js";

interface Enrichment {
  id: string;
  companyId: string | null;
  dealId: string | null;
  status: string;
  prNumber: number | null;
  prUrl: string | null;
  createdAt: string;
  enrichmentData: {
    fields: Array<{
      fieldName: string;
      previousValue: unknown;
      newValue: string;
      confidence: string;
      source: string;
    }>;
    supportingResearch: {
      sourceUrls: string[];
      notes: string;
    };
  };
}

interface CreateEnrichmentResponse {
  enrichment: {
    id: string;
    companyId: string | null;
    dealId: string | null;
    targetType: "company" | "deal";
    status: string;
    prNumber: number;
    prUrl: string;
    createdAt: string;
  };
  message: string;
}

interface EnrichmentsListResponse {
  enrichments: Enrichment[];
  total: number;
}

export async function addEnrichment(args: {
  companyId?: string;
  dealId?: string;
  fields: Array<{
    fieldName: string;
    newValue: string;
    confidence?: string;
    source?: string;
  }>;
  supportingResearch?: {
    sourceUrls?: string[];
    notes?: string;
  };
}) {
  try {
    const response = await api.post<CreateEnrichmentResponse>("/enrichments", {
      companyId: args.companyId,
      dealId: args.dealId,
      fields: args.fields,
      supportingResearch: args.supportingResearch,
    });

    return {
      id: response.enrichment.id,
      companyId: response.enrichment.companyId,
      dealId: response.enrichment.dealId,
      targetType: response.enrichment.targetType,
      status: response.enrichment.status,
      prNumber: response.enrichment.prNumber,
      prUrl: response.enrichment.prUrl,
      createdAt: response.enrichment.createdAt,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getEnrichments(args: {
  companyId?: string;
  dealId?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const response = await api.get<EnrichmentsListResponse>("/enrichments", {
      companyId: args.companyId,
      dealId: args.dealId,
      status: args.status,
      limit: args.limit,
    });

    return {
      enrichments: response.enrichments,
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function cancelEnrichment(args: { enrichmentId: string }) {
  try {
    const response = await api.delete<{ success: boolean; cancelled: string }>(
      "/enrichments",
      { id: args.enrichmentId }
    );

    return {
      success: response.success,
      cancelled: response.cancelled,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}
