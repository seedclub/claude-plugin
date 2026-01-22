/**
 * Browser-based OAuth authentication for Seed Network CLI
 *
 * Flow:
 * 1. Check for existing token in ~/.config/seed-network/token
 * 2. If no token, start local callback server and open browser
 * 3. User logs in and authorizes at webapp
 * 4. Webapp redirects to localhost callback with token
 * 5. Token is stored securely for future use
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomBytes } from "crypto";
import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir, unlink, chmod } from "fs/promises";

// Configuration
const CONFIG_DIR = join(homedir(), ".config", "seed-network");
const TOKEN_FILE = join(CONFIG_DIR, "token");
const CALLBACK_TIMEOUT_MS = 300000; // 5 minutes for manual auth
const DEFAULT_API_BASE = "https://beta.seedclub.com";

/**
 * Error thrown when authentication is required
 * Contains the auth URL for the user to visit
 */
export class AuthRequiredError extends Error {
  constructor(public authUrl: string, public port: number) {
    super(`Authentication required. Please visit: ${authUrl}`);
    this.name = "AuthRequiredError";
  }
}

// Track pending auth session
let pendingAuthServer: ReturnType<typeof createServer> | null = null;
let pendingAuthPromise: Promise<AuthResult> | null = null;

export interface StoredToken {
  token: string;
  email: string;
  createdAt: string;
  apiBase: string;
}

export interface AuthResult {
  token: string;
  email: string;
  apiBase: string;
}

/**
 * Get the API base URL from environment or stored token
 */
export function getApiBase(): string {
  return process.env.SEED_NETWORK_API || DEFAULT_API_BASE;
}

/**
 * Read stored token from disk
 */
export async function getStoredToken(): Promise<StoredToken | null> {
  try {
    const content = await readFile(TOKEN_FILE, "utf-8");
    const stored = JSON.parse(content) as StoredToken;

    // Validate token format
    if (!stored.token || !stored.token.startsWith("sn_")) {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

/**
 * Get token for API requests
 * Priority: 1. Environment variable, 2. Stored token
 */
export async function getToken(): Promise<string | null> {
  // Environment variable takes priority (for CI/explicit config)
  if (process.env.SEED_NETWORK_TOKEN) {
    return process.env.SEED_NETWORK_TOKEN;
  }

  // Check stored token
  const stored = await getStoredToken();
  return stored?.token ?? null;
}

/**
 * Store token securely on disk
 */
export async function storeToken(token: string, email: string, apiBase: string): Promise<void> {
  // Ensure config directory exists
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const stored: StoredToken = {
    token,
    email,
    createdAt: new Date().toISOString(),
    apiBase,
  };

  await writeFile(TOKEN_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });

  // Ensure file permissions are correct (double-check on Unix systems)
  try {
    await chmod(TOKEN_FILE, 0o600);
  } catch {
    // Ignore chmod errors on Windows
  }
}

/**
 * Clear stored token (logout)
 */
export async function clearStoredToken(): Promise<boolean> {
  try {
    await unlink(TOKEN_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find an available port for the callback server
 */
function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Could not find available port"));
      }
    });
    server.on("error", reject);
  });
}

/**
 * Start OAuth authentication flow
 * Starts callback server and throws AuthRequiredError with the URL
 * The server runs in background waiting for the callback
 */
export async function authenticate(): Promise<AuthResult> {
  // If there's already a pending auth session, check if token was received
  if (pendingAuthPromise) {
    // Check if token is now available (auth completed in background)
    const token = await getToken();
    if (token) {
      // Auth completed, clean up
      if (pendingAuthServer) {
        pendingAuthServer.close();
        pendingAuthServer = null;
      }
      pendingAuthPromise = null;
      const stored = await getStoredToken();
      return {
        token,
        email: stored?.email || "unknown",
        apiBase: stored?.apiBase || getApiBase(),
      };
    }
    // Still waiting for auth - get the current auth URL info
    // We'll throw again with the same server's info
  }

  const apiBase = getApiBase();
  const port = await findAvailablePort();
  const state = randomBytes(16).toString("hex");
  const authUrl = `${apiBase}/auth/cli/authorize?port=${port}&state=${state}`;

  // Create the auth promise that resolves when callback is received
  pendingAuthPromise = new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pendingAuthServer) {
        pendingAuthServer.close();
        pendingAuthServer = null;
      }
      pendingAuthPromise = null;
    };

    // Timeout handler
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Authentication timed out. Please try again."));
    }, CALLBACK_TIMEOUT_MS);

    pendingAuthServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

      // Only handle callback path
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const receivedState = url.searchParams.get("state");
      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email");
      const error = url.searchParams.get("error");

      // Validate state parameter (CSRF protection)
      if (receivedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(getErrorHtml("Invalid state parameter. Please try again."));
        return;
      }

      // Handle error from webapp
      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(getErrorHtml(error));
        cleanup();
        reject(new Error(error));
        return;
      }

      // Validate token
      if (!token || !token.startsWith("sn_")) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(getErrorHtml("Invalid token received"));
        cleanup();
        reject(new Error("Invalid token received"));
        return;
      }

      // Store token
      try {
        await storeToken(token, email || "unknown", apiBase);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(getSuccessHtml(email));

        cleanup();
        resolve({
          token,
          email: email || "unknown",
          apiBase,
        });
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(getErrorHtml("Failed to store token"));
        cleanup();
        reject(err);
      }
    });

    pendingAuthServer.listen(port, "127.0.0.1", () => {
      console.error(`Auth callback server listening on port ${port}`);
    });

    pendingAuthServer.on("error", (err) => {
      cleanup();
      reject(err);
    });
  });

  // Throw AuthRequiredError with the URL - this will be caught by tool handlers
  // The callback server continues running in background
  throw new AuthRequiredError(authUrl, port);
}

/**
 * Ensure we have a valid token, authenticating if necessary
 */
export async function ensureAuthenticated(): Promise<AuthResult> {
  // Check for existing token
  const existingToken = await getToken();
  if (existingToken) {
    const stored = await getStoredToken();
    return {
      token: existingToken,
      email: stored?.email || "unknown",
      apiBase: stored?.apiBase || getApiBase(),
    };
  }

  // No token found, need to authenticate
  return authenticate();
}

/**
 * HTML response for successful authentication
 */
function getSuccessHtml(email?: string | null): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; font-size: 24px; }
    p { margin: 0; opacity: 0.8; }
    .email {
      font-family: monospace;
      background: rgba(255,255,255,0.1);
      padding: 4px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Authentication Successful</h1>
    <p>Signed in as <span class="email">${email || "user"}</span></p>
    <p style="margin-top: 20px; opacity: 0.6;">You can close this window.</p>
  </div>
</body>
</html>`;
}

/**
 * HTML response for authentication error
 */
function getErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Authentication Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; font-size: 24px; color: #ff6b6b; }
    p { margin: 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✗</div>
    <h1>Authentication Failed</h1>
    <p>${message}</p>
    <p style="margin-top: 20px; opacity: 0.6;">Please try again from Claude Code.</p>
  </div>
</body>
</html>`;
}
