import { api, ApiError } from "../api-client.js";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface UserResponse {
  user: User;
  stats: {
    dealsCreated: number;
    researchSaved: number;
    enrichmentsSubmitted: number;
  };
}

export async function getCurrentUser() {
  try {
    const response = await api.get<UserResponse>("/user");

    return {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: response.user.role,
      createdAt: response.user.createdAt,
      stats: response.stats,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    throw error;
  }
}

export async function getSyncStatus() {
  // Sync status is a local concept - we just verify API connectivity
  try {
    await api.get<UserResponse>("/user");

    return {
      status: "connected",
      lastCheckedAt: new Date().toISOString(),
      api: "connected",
      message: "Successfully connected to Seed Network API",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: "disconnected",
        lastCheckedAt: new Date().toISOString(),
        api: "disconnected",
        error: error.message,
      };
    }
    return {
      status: "error",
      lastCheckedAt: new Date().toISOString(),
      api: "error",
      error: "Unknown error checking connection",
    };
  }
}
