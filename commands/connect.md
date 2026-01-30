---
name: connect
description: Connect and authenticate your Seed Network account
allowed-tools:
  - mcp__plugin_seed_seed-network__seed_auth_status
  - mcp__plugin_seed_seed-network__get_current_user
---

# Connect to Seed Network

Authenticate the user's Seed Network account. This is a simple connection check.

## Steps

1. Call `seed_auth_status` to check if already authenticated.

2. **If already authenticated**: Tell the user they're connected, showing their email and API base. Then call `get_current_user` to confirm the connection is working and show their account details.

3. **If not authenticated**: Call `get_current_user` — this will trigger the browser-based auth flow automatically. The MCP server will return an `auth_required` response with a URL. Present the URL to the user and tell them to:
   - Open the URL in their browser
   - Sign in with their Seed Network account
   - Come back and run `/connect` again to verify

Keep the output concise. No need for research or deal creation — this is just about connecting.
