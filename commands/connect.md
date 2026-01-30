---
name: connect
description: Connect and authenticate your Seed Network account
argument-hint: "[token]"
allowed-tools:
  - mcp__plugin_seed_seed-network__seed_connect
  - mcp__plugin_seed_seed-network__seed_auth_status
  - mcp__plugin_seed_seed-network__get_current_user
---

# Connect to Seed Network

Authenticate the user's Seed Network account using an API token.

## Steps

1. **If the user provided a token as the argument**: Call `seed_connect` with the token to verify and store it. If successful, confirm the connection showing their email/name. If the token is invalid, tell them and suggest they get a valid token from their Seed Network account settings.

2. **If no token was provided**: Call `seed_auth_status` to check if already authenticated.
   - **If already authenticated**: Tell the user they're connected, showing their email and API base. Call `get_current_user` to confirm the connection is working and show their account details.
   - **If not authenticated**: Tell the user they need to provide their API token. Show usage: `/connect <token>`. Mention they can find their API token in their Seed Network account settings.

Keep the output concise. No need for research or deal creation - this is just about connecting.
