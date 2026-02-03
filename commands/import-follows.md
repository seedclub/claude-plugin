---
name: import-follows
description: Import your Twitter/X following list as signals using the bird CLI
allowed-tools:
  - Bash
  - mcp__plugin_seed_seed-network__batch_create_signals
  - mcp__plugin_seed_seed-network__list_signals
  - AskUserQuestion
---

# Import Twitter/X Following List as Signals

Import the accounts the user follows on X (Twitter) using the `bird` CLI tool and create signals for each one.

## Prerequisites

- `bird` CLI must be installed globally (`npm i -g @nicepkg/bird` or check https://github.com/steipete/bird)
- User must be logged into x.com in Safari, Chrome, or Firefox (bird reads browser cookies)
- User must be connected to Seed Network (run `/connect` first if needed)

## Workflow

### Preferred: Run the import script directly

The fastest approach is to run the standalone script via Bash, which handles the entire flow (fetch, transform, upload) in one shot:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/import-follows.sh
```

If the user provided `--auth-token` and `--ct0` values (or `AUTH_TOKEN`/`CT0` env vars), pass them through:

```bash
AUTH_TOKEN=<token> CT0=<ct0> bash ${CLAUDE_PLUGIN_ROOT}/scripts/import-follows.sh
```

The script will:
1. Verify `bird` CLI and Seed Network credentials
2. Fetch the full following list via `bird following --all --json`
3. Transform all users into signal objects
4. POST all signals in a single API request (no batching needed)
5. Report the result

If the script succeeds, skip to the Summary step. If it fails, fall back to the manual workflow below.

### Fallback: Manual workflow

Only use this if the script fails or the user wants fine-grained control.

#### Step 1: Verify bird is available

Run `bird --version` via Bash. If it fails, tell the user to install it:
```
npm install -g @nicepkg/bird
```

#### Step 2: Fetch the following list

Run this command via Bash:
```
bird following --all --json 2>/dev/null
```

If it fails with a credentials error, tell the user they need to be logged into x.com in their browser (Safari or Chrome), or provide `AUTH_TOKEN` and `CT0` env vars.

The output is a JSON object with a `users` key (or sometimes a direct array). Each user has fields like:
- `name` — display name
- `username` — handle
- `description` — bio
- `profileImageUrl` — avatar
- `followersCount`, `followingCount` — metrics

#### Step 3: Check for existing signals

Before creating, call `list_signals` with `type: "twitter_account"` and `tag: "twitter-following"` to see how many already exist. Report this to the user.

#### Step 4: Transform and create signals

Map each Twitter user to a signal object:
```json
{
  "type": "twitter_account",
  "name": "<display name>",
  "description": "<bio>",
  "externalUrl": "https://x.com/<handle>",
  "imageUrl": "<profile_image_url with _normal replaced by _400x400>",
  "tags": ["twitter-following"],
  "metadata": {
    "twitterId": "<id>",
    "handle": "<username>",
    "followersCount": <followersCount>,
    "followingCount": <followingCount>
  }
}
```

**For bulk imports, use curl directly instead of the MCP tool** to avoid excessive context usage. Write the payload to a temp file and POST it:

```bash
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.config/seed-network/token'))['token'])")
API_BASE=$(python3 -c "import json; print(json.load(open('$HOME/.config/seed-network/token')).get('apiBase', 'https://beta.seedclub.com'))")

curl -s -X POST "${API_BASE}/api/mcp/signals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @/tmp/signals_payload.json
```

The API accepts all signals in a single request — no batching needed. It auto-deduplicates by creating `user_signals` links for already-existing signals.

Only use the `batch_create_signals` MCP tool for small lists (under 20 signals) where context usage isn't a concern.

### Summary

Report the final count:
- Total accounts found on X
- Signals created
- Signals that already existed (if any)

## API Reference

- **Endpoint:** `POST {apiBase}/api/mcp/signals` — creates signals (single or batch via `signals` array)
- **Auth:** Bearer token from `~/.config/seed-network/token`
- **No batch limit:** The API accepts hundreds or thousands of signals in a single request
- **Deduplication:** Existing signals are linked rather than duplicated

## Important Notes

- The bird CLI output format may vary. Parse defensively — the top-level JSON could be an array directly, or an object with a `data` or `users` key.
- Replace `_normal` with `_400x400` in profile image URLs to get higher resolution avatars.
- For bulk operations, prefer the script or direct curl over MCP tool calls to minimize context usage.
