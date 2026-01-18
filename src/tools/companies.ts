import { api, ApiError } from "../api-client.js";

interface Founder {
  name: string;
  role?: string;
  bio?: string;
  linkedIn?: string;
  twitter?: string;
}

interface FundingRound {
  round: string;
  amount?: number;
  date?: string;
  investors?: string[];
}

interface Company {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industries?: string[];
  stage?: string;
  foundedYear?: number;
  teamSize?: number;
  founders?: Founder[];
  location?: string;
  fundingHistory?: FundingRound[];
  totalRaised?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  crunchbaseUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyResponse {
  company: Company;
  research?: unknown[];
  deals?: unknown[];
}

interface CompaniesListResponse {
  companies: Company[];
  total: number;
}

interface CreateCompanyResponse {
  company: Company;
  message: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  company: Company;
  updated: string[];
}

export async function createCompany(args: {
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industries?: string[];
  stage?: string;
  foundedYear?: number;
  teamSize?: number;
  founders?: Founder[];
  location?: string;
  fundingHistory?: FundingRound[];
  totalRaised?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
  crunchbaseUrl?: string;
}) {
  try {
    const response = await api.post<CreateCompanyResponse>("/companies", {
      name: args.name,
      tagline: args.tagline,
      description: args.description,
      website: args.website,
      logoUrl: args.logoUrl,
      industries: args.industries,
      stage: args.stage,
      foundedYear: args.foundedYear,
      teamSize: args.teamSize,
      founders: args.founders,
      location: args.location,
      fundingHistory: args.fundingHistory,
      totalRaised: args.totalRaised,
      linkedinUrl: args.linkedinUrl,
      twitterUrl: args.twitterUrl,
      crunchbaseUrl: args.crunchbaseUrl,
    });

    return {
      id: response.company.id,
      slug: response.company.slug,
      name: response.company.name,
      tagline: response.company.tagline,
      stage: response.company.stage,
      industries: response.company.industries,
      createdAt: response.company.createdAt,
      message: response.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function updateCompany(args: {
  companyId: string;
  fields: Record<string, unknown>;
}) {
  try {
    const response = await api.patch<UpdateCompanyResponse>("/companies", {
      companyId: args.companyId,
      fields: args.fields,
    });

    return {
      success: response.success,
      companyId: response.company.id,
      updated: response.updated,
      updatedAt: response.company.updatedAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getCompany(args: { companyId?: string; slug?: string }) {
  try {
    const params: Record<string, string | undefined> = {};
    if (args.companyId) params.id = args.companyId;
    if (args.slug) params.slug = args.slug;

    const response = await api.get<CompanyResponse>("/companies", params);

    return {
      company: response.company,
      research: response.research || [],
      deals: response.deals || [],
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function listCompanies(args: {
  stage?: string;
  industry?: string;
  limit?: number;
}) {
  try {
    const response = await api.get<CompaniesListResponse>("/companies", {
      stage: args.stage,
      industry: args.industry,
      limit: args.limit,
    });

    return {
      companies: response.companies,
      total: response.total,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function searchCompanies(args: { query: string; limit?: number }) {
  try {
    const response = await api.get<CompaniesListResponse>("/companies", {
      search: args.query,
      limit: args.limit,
    });

    return {
      companies: response.companies,
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
