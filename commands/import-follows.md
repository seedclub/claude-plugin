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

### Step 1: Verify bird is available

Run `bird --version` via Bash. If it fails, tell the user to install it:
```
npm install -g @nicepkg/bird
```

### Step 2: Fetch the following list

Run this command via Bash:
```
bird following --all --json 2>/dev/null
```

If it fails with a credentials error, tell the user they need to be logged into x.com in their browser (Safari or Chrome).

The output is a JSON array of user objects. Each user has fields like:
- `name` — display name
- `screen_name` or `username` — handle
- `description` — bio
- `profile_image_url_https` or `profile_image_url` — avatar
- `followers_count`, `friends_count` — metrics

### Step 3: Check for existing signals

Before creating, call `list_signals` with `type: "twitter_account"` and `tag: "twitter-following"` to see how many already exist. Report this to the user.

### Step 4: Transform and batch-create

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
    "handle": "<screen_name>",
    "followersCount": <followers_count>,
    "followingCount": <friends_count>
  }
}
```

Use `batch_create_signals` to create them in batches of 50. The API will auto-deduplicate by creating `user_signals` links for already-existing signals.

Report progress after each batch: "Created X/Y signals..."

### Step 5: Summary

Report the final count:
- Total accounts found on X
- Signals created
- Signals that already existed (if any)

## Important Notes

- The bird CLI output format may vary. Parse defensively — the top-level JSON could be an array directly, or an object with a `data` or `users` key.
- Replace `_normal` with `_400x400` in profile image URLs to get higher resolution avatars.
- If the following list is very large (1000+), warn the user it may take a moment and show batch progress.
