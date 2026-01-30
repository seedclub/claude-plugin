#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createDeal, updateDeal, getDeal, listDeals, searchDeals } from "./tools/deals.js";
import { createCompany, updateCompany, getCompany, listCompanies, searchCompanies } from "./tools/companies.js";
import { saveResearch, getResearch, queryResearch, linkResearch } from "./tools/research.js";
import { addEnrichment, getEnrichments, cancelEnrichment } from "./tools/enrichments.js";
import { getCurrentUser, getSyncStatus } from "./tools/utility.js";
import { clearCredentials, setCachedToken } from "./api-client.js";
import { getStoredToken, storeToken, getApiBase, AuthRequiredError } from "./auth.js";

const server = new Server(
  {
    name: "seed-network",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools
const tools = [
  // Deal Operations
  {
    name: "create_deal",
    description: "Create a new deal in Seed Network. Requires name and summary. Returns the created deal with ID and slug.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Company name" },
        website: { type: "string", description: "Company website URL" },
        summary: { type: "string", description: "One-line description of the company" },
        stage: { type: "string", description: "Funding stage (pre-seed, seed, etc.)" },
        sector: { type: "string", description: "Industry sector" },
        valuation: { type: "number", description: "Company valuation in USD" },
        curatorBlurb: { type: "string", description: "Curator's notes about the deal" }
      },
      required: ["name", "summary"]
    }
  },
  {
    name: "update_deal",
    description: "Update an existing deal's fields. Specify the deal ID and the fields to update.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dealId: { type: "string", description: "ID of the deal to update" },
        fields: {
          type: "object",
          description: "Fields to update (e.g., summary, curatorBlurb, valuation, memoUrl, deckUrl, dataRoomUrl)"
        }
      },
      required: ["dealId", "fields"]
    }
  },
  {
    name: "get_deal",
    description: "Get a specific deal by ID or slug. Returns full deal details and associated research.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dealId: { type: "string", description: "Deal ID" },
        slug: { type: "string", description: "Deal slug (URL-friendly name)" }
      }
    }
  },
  {
    name: "list_deals",
    description: "List deals with optional filters. Can filter by stage or sector.",
    inputSchema: {
      type: "object" as const,
      properties: {
        stage: { type: "string", description: "Filter by funding stage" },
        sector: { type: "string", description: "Filter by sector" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "search_deals",
    description: "Full-text search across deals. Searches name, summary, and slug.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Maximum number of results" }
      },
      required: ["query"]
    }
  },

  // Company Operations
  {
    name: "create_company",
    description: "Create a new company in the Seed Network knowledge base. Companies are collaborative entities that anyone can contribute to via enrichments.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Company name" },
        tagline: { type: "string", description: "One-line description" },
        description: { type: "string", description: "Longer description of the company" },
        website: { type: "string", description: "Company website URL" },
        logoUrl: { type: "string", description: "URL to company logo" },
        industries: { type: "array", items: { type: "string" }, description: "Industries (e.g., ['AI', 'Climate', 'Fintech'])" },
        stage: { type: "string", description: "Funding stage (pre-seed, seed, series-a, etc.)" },
        foundedYear: { type: "number", description: "Year company was founded" },
        teamSize: { type: "number", description: "Number of employees" },
        founders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              bio: { type: "string" },
              linkedIn: { type: "string" },
              twitter: { type: "string" }
            }
          },
          description: "Founder information"
        },
        location: { type: "string", description: "Company headquarters location" },
        fundingHistory: {
          type: "array",
          items: {
            type: "object",
            properties: {
              round: { type: "string" },
              amount: { type: "number" },
              date: { type: "string" },
              investors: { type: "array", items: { type: "string" } }
            }
          },
          description: "Historical funding rounds"
        },
        totalRaised: { type: "number", description: "Total funding raised in USD" },
        linkedinUrl: { type: "string", description: "LinkedIn company page URL" },
        twitterUrl: { type: "string", description: "Twitter/X profile URL" },
        crunchbaseUrl: { type: "string", description: "Crunchbase profile URL" }
      },
      required: ["name"]
    }
  },
  {
    name: "update_company",
    description: "Update an existing company's fields. For curator review of changes, use add_enrichment instead.",
    inputSchema: {
      type: "object" as const,
      properties: {
        companyId: { type: "string", description: "ID of the company to update" },
        fields: {
          type: "object",
          description: "Fields to update (tagline, description, website, industries, stage, founders, fundingHistory, etc.)"
        }
      },
      required: ["companyId", "fields"]
    }
  },
  {
    name: "get_company",
    description: "Get a specific company by ID or slug. Returns full company details, associated research, and any linked deals.",
    inputSchema: {
      type: "object" as const,
      properties: {
        companyId: { type: "string", description: "Company ID" },
        slug: { type: "string", description: "Company slug (URL-friendly name)" }
      }
    }
  },
  {
    name: "list_companies",
    description: "List companies with optional filters. Can filter by stage or industry.",
    inputSchema: {
      type: "object" as const,
      properties: {
        stage: { type: "string", description: "Filter by funding stage" },
        industry: { type: "string", description: "Filter by industry" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "search_companies",
    description: "Full-text search across companies. Searches name, tagline, description, and slug.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Maximum number of results" }
      },
      required: ["query"]
    }
  },

  // Research Operations
  {
    name: "save_research",
    description: "Save a research artifact. Can be company profile, market analysis, founder background, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: "Research type (company_profile, market_analysis, founder_background, competitive_analysis)"
        },
        title: { type: "string", description: "Title of the research artifact" },
        content: {
          type: "object",
          description: "Research content as structured JSON"
        },
        sourceUrls: {
          type: "array",
          items: { type: "string" },
          description: "Source URLs for provenance"
        },
        companyId: { type: "string", description: "Optional: ID of company to link research to" },
        dealId: { type: "string", description: "Optional: ID of deal to link research to" }
      },
      required: ["type", "title", "content"]
    }
  },
  {
    name: "get_research",
    description: "Get a specific research artifact by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        researchId: { type: "string", description: "Research ID" }
      },
      required: ["researchId"]
    }
  },
  {
    name: "query_research",
    description: "Search research artifacts by topic, type, or associated company/deal.",
    inputSchema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Search topic" },
        type: { type: "string", description: "Research type filter" },
        companyId: { type: "string", description: "Filter by associated company" },
        dealId: { type: "string", description: "Filter by associated deal" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "link_research",
    description: "Associate a research artifact with a company or deal.",
    inputSchema: {
      type: "object" as const,
      properties: {
        researchId: { type: "string", description: "Research ID to link" },
        companyId: { type: "string", description: "Company ID to link to" },
        dealId: { type: "string", description: "Deal ID to link to" }
      },
      required: ["researchId"]
    }
  },

  // Enrichment Operations
  {
    name: "add_enrichment",
    description: "Submit an enrichment to an existing company or deal. Creates a GitHub PR for curator review.",
    inputSchema: {
      type: "object" as const,
      properties: {
        companyId: { type: "string", description: "ID of the company to enrich (use this OR dealId)" },
        dealId: { type: "string", description: "ID of the deal to enrich (use this OR companyId)" },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fieldName: { type: "string", description: "Name of field to update" },
              newValue: { type: "string", description: "New value for the field" },
              confidence: { type: "string", description: "Confidence level (high, medium, low)" },
              source: { type: "string", description: "Source of this information" }
            },
            required: ["fieldName", "newValue"]
          },
          description: "Fields to update"
        },
        supportingResearch: {
          type: "object",
          properties: {
            sourceUrls: { type: "array", items: { type: "string" } },
            notes: { type: "string" }
          },
          description: "Supporting research and sources"
        }
      },
      required: ["fields"]
    }
  },
  {
    name: "get_enrichments",
    description: "Get enrichment history, optionally filtered by company, deal, or status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        companyId: { type: "string", description: "Filter by company ID" },
        dealId: { type: "string", description: "Filter by deal ID" },
        status: { type: "string", description: "Filter by status (pending, approved, rejected)" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "cancel_enrichment",
    description: "Cancel a pending enrichment request.",
    inputSchema: {
      type: "object" as const,
      properties: {
        enrichmentId: { type: "string", description: "ID of the enrichment to cancel" }
      },
      required: ["enrichmentId"]
    }
  },

  // Utility Operations
  {
    name: "get_current_user",
    description: "Get information about the currently authenticated user and their stats.",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "sync_status",
    description: "Check API connection status.",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },

  // Auth Operations
  {
    name: "seed_logout",
    description: "Clear stored authentication credentials. Use this to switch accounts or troubleshoot auth issues.",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "seed_auth_status",
    description: "Check current authentication status and which account is logged in.",
    inputSchema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "seed_connect",
    description: "Connect to Seed Network by providing an API token. Verifies the token against the API and stores it for future use.",
    inputSchema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Seed Network API token (starts with sn_)" }
      },
      required: ["token"]
    }
  }
];

// Register tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Deal operations
      case "create_deal":
        result = await createDeal(args as Parameters<typeof createDeal>[0]);
        break;
      case "update_deal":
        result = await updateDeal(args as Parameters<typeof updateDeal>[0]);
        break;
      case "get_deal":
        result = await getDeal(args as Parameters<typeof getDeal>[0]);
        break;
      case "list_deals":
        result = await listDeals(args as Parameters<typeof listDeals>[0]);
        break;
      case "search_deals":
        result = await searchDeals(args as Parameters<typeof searchDeals>[0]);
        break;

      // Company operations
      case "create_company":
        result = await createCompany(args as Parameters<typeof createCompany>[0]);
        break;
      case "update_company":
        result = await updateCompany(args as Parameters<typeof updateCompany>[0]);
        break;
      case "get_company":
        result = await getCompany(args as Parameters<typeof getCompany>[0]);
        break;
      case "list_companies":
        result = await listCompanies(args as Parameters<typeof listCompanies>[0]);
        break;
      case "search_companies":
        result = await searchCompanies(args as Parameters<typeof searchCompanies>[0]);
        break;

      // Research operations
      case "save_research":
        result = await saveResearch(args as Parameters<typeof saveResearch>[0]);
        break;
      case "get_research":
        result = await getResearch(args as Parameters<typeof getResearch>[0]);
        break;
      case "query_research":
        result = await queryResearch(args as Parameters<typeof queryResearch>[0]);
        break;
      case "link_research":
        result = await linkResearch(args as Parameters<typeof linkResearch>[0]);
        break;

      // Enrichment operations
      case "add_enrichment":
        result = await addEnrichment(args as Parameters<typeof addEnrichment>[0]);
        break;
      case "get_enrichments":
        result = await getEnrichments(args as Parameters<typeof getEnrichments>[0]);
        break;
      case "cancel_enrichment":
        result = await cancelEnrichment(args as Parameters<typeof cancelEnrichment>[0]);
        break;

      // Utility operations
      case "get_current_user":
        result = await getCurrentUser();
        break;
      case "sync_status":
        result = await getSyncStatus();
        break;

      // Auth operations
      case "seed_logout":
        await clearCredentials();
        result = { success: true, message: "Logged out. Next API call will require re-authentication." };
        break;
      case "seed_auth_status": {
        const stored = await getStoredToken();
        if (stored) {
          result = {
            authenticated: true,
            email: stored.email,
            apiBase: stored.apiBase,
            tokenCreatedAt: stored.createdAt,
          };
        } else if (process.env.SEED_NETWORK_TOKEN) {
          result = {
            authenticated: true,
            source: "environment variable (SEED_NETWORK_TOKEN)",
          };
        } else {
          result = {
            authenticated: false,
            message: "No stored credentials. Use /connect with a token or run any API call to trigger browser authentication.",
          };
        }
        break;
      }

      case "seed_connect": {
        const connectToken = (args as { token: string }).token;

        if (!connectToken || !connectToken.startsWith("sn_")) {
          result = {
            error: "Invalid token format. Seed Network tokens start with 'sn_'.",
          };
          break;
        }

        const connectApiBase = getApiBase();

        // Store token and update the api client cache so getCurrentUser() uses it
        await storeToken(connectToken, "pending", connectApiBase);
        setCachedToken(connectToken, connectApiBase);

        // Verify by calling through the existing api client
        const verifyResult = await getCurrentUser();

        if ("error" in verifyResult) {
          // Verification failed — roll back stored credentials
          await clearCredentials();
          result = {
            error: "Token verification failed. The token may be invalid or expired.",
            details: verifyResult.error,
          };
          break;
        }

        // Update stored token with the actual email now that we know it
        await storeToken(connectToken, verifyResult.email, connectApiBase);

        result = {
          success: true,
          message: "Connected to Seed Network.",
          email: verifyResult.email,
          name: verifyResult.name,
          apiBase: connectApiBase,
        };
        break;
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    // Handle authentication required - return friendly message with auth URL
    if (error instanceof AuthRequiredError) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "auth_required",
            message: "Authentication required for Seed Network. Please open this URL in your browser to sign in:",
            authUrl: error.authUrl,
            instructions: [
              "1. Click or open the URL above in your browser",
              "2. Sign in with your Seed Network account",
              "3. After signing in, retry this command",
              "Note: The auth session is active for 5 minutes"
            ]
          }, null, 2)
        }]
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Seed Network MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
