---
name: import-follows
description: Import your Twitter/X following list as signals
allowed-tools:
  - mcp__plugin_seed_seed-network__twitter_check
  - mcp__plugin_seed_seed-network__twitter_following
  - mcp__plugin_seed_seed-network__batch_create_signals
  - mcp__plugin_seed_seed-network__list_signals
  - AskUserQuestion
---

# Import Twitter/X Following List as Signals

Import the accounts the user follows on X (Twitter) and create signals for each one.

## Prerequisites

- User must be logged into x.com in Safari, Chrome, or Firefox (the plugin reads browser cookies directly)
- User must be connected to Seed Network (run `/connect` first if needed)

## Workflow

### Step 1: Verify Twitter credentials

Call `twitter_check` to verify the user is logged into Twitter/X. If not authenticated, show the instructions from the response.

### Step 2: Fetch the following list

Call `twitter_following` with `all: true` to fetch the complete following list.

The response includes an array of users with:
- `id` — Twitter user ID
- `username` — handle
- `name` — display name
- `description` — bio
- `profileImageUrl` — avatar URL
- `followersCount`, `followingCount` — metrics
- `profileUrl` — link to profile

### Step 3: Check for existing signals

Before creating, call `list_signals` with `type: "twitter_account"` and `tag: "twitter-following"` to see how many already exist. Report this to the user.

### Step 4: Transform and create signals

Map each Twitter user to a signal object:
```json
{
  "type": "twitter_account",
  "name": "<display name>",
  "description": "<bio>",
  "externalUrl": "https://x.com/<handle>",
  "imageUrl": "<profile_image_url with _400x400>",
  "tags": ["twitter-following"],
  "metadata": {
    "twitterId": "<id>",
    "handle": "<username>",
    "followersCount": <followersCount>,
    "followingCount": <followingCount>
  }
}
```

Use `batch_create_signals` to create all signals at once. The API handles deduplication automatically.

### Step 5: Summary

Report the final count:
- Total accounts found on X
- Signals created
- Signals that already existed (if any)

## Important Notes

- Profile image URLs should use `_400x400` suffix for higher resolution (the twitter_following tool already does this)
- The API auto-deduplicates by creating `user_signals` links for already-existing signals
- No external CLI installation required - the plugin reads cookies directly from your browser
