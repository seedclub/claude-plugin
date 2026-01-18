import { api, ApiError } from "../api-client.js";

interface Research {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  sourceUrls: string[];
  companyId: string | null;
  dealId: string | null;
  createdBy: string;
  createdAt: string;
}

interface ResearchResponse {
  research: Research;
}

interface ResearchListResponse {
  research: Research[];
  total: number;
}

interface CreateResearchResponse {
  research: {
    id: string;
    type: string;
    title: string;
    companyId: string | null;
    dealId: string | null;
    createdAt: string;
  };
}

interface LinkResearchResponse {
  success: boolean;
  researchId: string;
  linkedToCompany: string | null;
  linkedToDeal: string | null;
}

export async function saveResearch(args: {
  type: string;
  title: string;
  content: Record<string, unknown>;
  sourceUrls?: string[];
  companyId?: string;
  dealId?: string;
}) {
  try {
    const response = await api.post<CreateResearchResponse>("/research", {
      type: args.type,
      title: args.title,
      content: args.content,
      sourceUrls: args.sourceUrls,
      companyId: args.companyId,
      dealId: args.dealId,
    });

    return {
      id: response.research.id,
      type: response.research.type,
      title: response.research.title,
      companyId: response.research.companyId,
      dealId: response.research.dealId,
      createdAt: response.research.createdAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getResearch(args: { researchId: string }) {
  try {
    const response = await api.get<ResearchResponse>("/research", {
      id: args.researchId,
    });

    return response.research;
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function queryResearch(args: {
  topic?: string;
  type?: string;
  companyId?: string;
  dealId?: string;
  limit?: number;
}) {
  try {
    const response = await api.get<ResearchListResponse>("/research", {
      topic: args.topic,
      type: args.type,
      companyId: args.companyId,
      dealId: args.dealId,
      limit: args.limit,
    });

    return {
      research: response.research,
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function linkResearch(args: {
  researchId: string;
  companyId?: string;
  dealId?: string;
}) {
  try {
    const response = await api.patch<LinkResearchResponse>("/research", {
      researchId: args.researchId,
      companyId: args.companyId,
      dealId: args.dealId,
    });

    return {
      success: response.success,
      researchId: response.researchId,
      linkedToCompany: response.linkedToCompany,
      linkedToDeal: response.linkedToDeal,
      linkedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}
