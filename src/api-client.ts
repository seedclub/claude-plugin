/**
 * API Client for Seed Network MCP Server
 * Handles authenticated requests to the webapp API
 *
 * Authentication priority:
 * 1. SEED_NETWORK_TOKEN environment variable (for CI/explicit config)
 * 2. Stored token from browser auth flow (~/.config/seed-network/token)
 * 3. Trigger browser authentication if no token found
 */

import {
  getToken,
  getApiBase,
  ensureAuthenticated,
  clearStoredToken,
} from "./auth.js";

let cachedToken: string | null = null;
let cachedApiBase: string | null = null;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

/**
 * Get the current token, authenticating if necessary
 */
async function getAuthToken(): Promise<string> {
  // Use cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // Try to get existing token
  const existingToken = await getToken();
  if (existingToken) {
    cachedToken = existingToken;
    cachedApiBase = getApiBase();
    return cachedToken;
  }

  // No token found, trigger browser authentication
  const result = await ensureAuthenticated();
  cachedToken = result.token;
  cachedApiBase = result.apiBase;

  console.error(`\n✓ Authenticated as ${result.email}`);
  console.error(`Token saved to ~/.config/seed-network/token\n`);

  return cachedToken;
}

/**
 * Get the API base URL
 */
function getApiBaseUrl(): string {
  return cachedApiBase || getApiBase();
}

/**
 * Clear cached credentials (used after 401 or logout)
 */
export async function clearCredentials(): Promise<void> {
  cachedToken = null;
  cachedApiBase = null;
  await clearStoredToken();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  // Get token (will authenticate if needed)
  const token = await getAuthToken();
  const apiBase = getApiBaseUrl();

  // Build URL with query params
  const url = new URL(`/api/mcp${endpoint}`, apiBase);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - token might be revoked or expired
  if (response.status === 401) {
    // Clear cached credentials
    await clearCredentials();

    // Re-authenticate
    console.error("\n⚠️  Token expired or revoked. Re-authenticating...\n");
    const result = await ensureAuthenticated();
    cachedToken = result.token;
    cachedApiBase = result.apiBase;

    console.error(`\n✓ Re-authenticated as ${result.email}\n`);

    // Retry the request with new token
    headers.Authorization = `Bearer ${cachedToken}`;
    const retryResponse = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!retryResponse.ok) {
      const retryData = await retryResponse.json();
      throw new ApiError(
        retryResponse.status,
        retryData.error || `Request failed with status ${retryResponse.status}`,
        retryData.details
      );
    }

    return (await retryResponse.json()) as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || `Request failed with status ${response.status}`,
      data.details
    );
  }

  return data as T;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    apiRequest<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: "POST", body }),

  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: "PATCH", body }),

  delete: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    apiRequest<T>(endpoint, { method: "DELETE", params }),
};
