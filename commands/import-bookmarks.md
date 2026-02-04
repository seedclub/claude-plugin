---
name: import-bookmarks
description: Import your Twitter/X bookmarks as signals or research
allowed-tools:
  - mcp__plugin_seed_seed-network__twitter_check
  - mcp__plugin_seed_seed-network__twitter_bookmarks
  - mcp__plugin_seed_seed-network__batch_create_signals
  - mcp__plugin_seed_seed-network__save_research
  - mcp__plugin_seed_seed-network__list_signals
  - AskUserQuestion
---

# Import Twitter/X Bookmarks

Fetch your bookmarked tweets and optionally create signals for the authors or save as a research artifact.

## Prerequisites

- User must be logged into x.com in Safari, Chrome, or Firefox
- User must be connected to Seed Network (run `/connect` first if needed)

## Workflow

### Step 1: Verify Twitter credentials

Call `twitter_check` to verify the user is logged into Twitter/X.

### Step 2: Fetch bookmarks

Call `twitter_bookmarks`. Ask the user if they want to fetch all bookmarks or just recent ones:

- Recent (default 20): `twitter_bookmarks`
- All bookmarks: `twitter_bookmarks` with `all: true`

The response includes tweets with:
- `id` — Tweet ID
- `text` — Tweet content
- `author` — `{ username, name }`
- `url` — Link to tweet
- `createdAt` — When posted
- `likeCount`, `retweetCount`, `replyCount` — Engagement metrics

### Step 3: Ask what to do with bookmarks

Use AskUserQuestion to ask the user:

**Question:** "What would you like to do with your bookmarks?"

Options:
1. **Create signals for authors** — Create twitter_account signals for unique authors
2. **Save as research** — Save the bookmarks collection as a research artifact
3. **Both** — Create signals AND save research
4. **Just show me** — Display the bookmarks without saving

### Step 4A: Create signals for authors (if selected)

Extract unique authors from the bookmarks and create signals:

```json
{
  "type": "twitter_account",
  "name": "<author name>",
  "externalUrl": "https://x.com/<username>",
  "tags": ["twitter-bookmarked"],
  "metadata": {
    "handle": "<username>",
    "bookmarkedTweetId": "<tweet_id>",
    "bookmarkedAt": "<fetch timestamp>"
  }
}
```

Use `batch_create_signals` to create all at once.

### Step 4B: Save as research (if selected)

Save the bookmarks as a research artifact:

```json
{
  "type": "twitter_bookmarks",
  "title": "Twitter Bookmarks Export - <date>",
  "content": {
    "exportedAt": "<timestamp>",
    "totalBookmarks": <count>,
    "bookmarks": [
      {
        "tweetId": "<id>",
        "text": "<text>",
        "author": "<username>",
        "authorName": "<name>",
        "url": "<url>",
        "createdAt": "<createdAt>",
        "metrics": { "likes": <n>, "retweets": <n>, "replies": <n> }
      }
    ]
  },
  "sourceUrls": ["https://x.com/i/bookmarks"]
}
```

### Step 5: Summary

Report:
- Total bookmarks fetched
- Unique authors found
- Signals created (if applicable)
- Research artifact saved (if applicable)

## Important Notes

- Bookmarks are private to the authenticated user
- Creating signals for authors lets you track them in the future
- Saving as research preserves the full bookmark context
