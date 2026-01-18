import { api, ApiError } from "../api-client.js";

interface Deal {
  id: string;
  slug: string;
  name: string;
  summary: string;
  state: string;
  valuation?: string;
  curatorBlurb?: string;
  memoUrl?: string;
  deckUrl?: string;
  dataRoomUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface DealResponse {
  deal: Deal;
  research?: unknown[];
}

interface DealsListResponse {
  deals: Deal[];
  total: number;
}

interface CreateDealResponse {
  deal: Deal;
  message: string;
}

interface UpdateDealResponse {
  success: boolean;
  deal: Deal;
  updated: string[];
}

export async function createDeal(args: {
  name: string;
  website?: string;
  summary: string;
  stage?: string;
  sector?: string;
  valuation?: number;
  curatorBlurb?: string;
}) {
  try {
    const response = await api.post<CreateDealResponse>("/deals", {
      name: args.name,
      website: args.website,
      summary: args.summary,
      stage: args.stage,
      sector: args.sector,
      valuation: args.valuation,
      curatorBlurb: args.curatorBlurb,
    });

    return {
      id: response.deal.id,
      slug: response.deal.slug,
      name: response.deal.name,
      summary: response.deal.summary,
      state: response.deal.state,
      createdAt: response.deal.createdAt,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function updateDeal(args: {
  dealId: string;
  fields: Record<string, unknown>;
}) {
  try {
    const response = await api.patch<UpdateDealResponse>("/deals", {
      dealId: args.dealId,
      fields: args.fields,
    });

    return {
      success: response.success,
      dealId: response.deal.id,
      updated: response.updated,
      updatedAt: response.deal.updatedAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getDeal(args: { dealId?: string; slug?: string }) {
  try {
    const params: Record<string, string | undefined> = {};
    if (args.dealId) params.id = args.dealId;
    if (args.slug) params.slug = args.slug;

    const response = await api.get<DealResponse>("/deals", params);

    return {
      deal: response.deal,
      research: response.research || [],
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function listDeals(args: {
  stage?: string;
  sector?: string;
  limit?: number;
}) {
  try {
    const response = await api.get<DealsListResponse>("/deals", {
      stage: args.stage,
      sector: args.sector,
      limit: args.limit,
    });

    return {
      deals: response.deals,
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function searchDeals(args: { query: string; limit?: number }) {
  try {
    const response = await api.get<DealsListResponse>("/deals", {
      search: args.query,
      limit: args.limit,
    });

    return {
      deals: response.deals,
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
