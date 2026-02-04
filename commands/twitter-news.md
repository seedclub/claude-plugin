---
name: twitter-news
description: Get trending news and topics from Twitter/X Explore
allowed-tools:
  - mcp__plugin_seed_seed-network__twitter_check
  - mcp__plugin_seed_seed-network__twitter_news
  - mcp__plugin_seed_seed-network__save_research
  - AskUserQuestion
---

# Twitter/X Trending News & Topics

Fetch trending news, topics, and stories from Twitter/X Explore page.

## Prerequisites

- User must be logged into x.com in Safari, Chrome, or Firefox

## Workflow

### Step 1: Verify Twitter credentials

Call `twitter_check` to verify the user is logged into Twitter/X.

### Step 2: Ask for preferences (optional)

If the user hasn't specified, you can ask which categories they want:

**Tabs available:**
- `forYou` — Personalized trends
- `news` — News stories
- `sports` — Sports news
- `entertainment` — Entertainment news

### Step 3: Fetch news

Call `twitter_news` with the desired options:

```
twitter_news({
  count: 20,           // Number of items (default 10)
  tab: "news",         // Single tab, or...
  tabs: ["news", "sports"],  // Multiple tabs
  withTweets: true     // Include related tweets for each item
})
```

The response includes news items with:
- `headline` — The trending topic or news headline
- `category` — Category (e.g., "News", "Sports", "AI · Trending")
- `timeAgo` — How recent (e.g., "2 hours ago")
- `postCount` — Number of posts about this topic
- `description` — Additional context (if available)
- `url` — Link to the trend/topic page
- `tweets` — Related tweets (if `withTweets: true`)

### Step 4: Display results

Present the news items in a readable format:

```
## Trending Now on X

### News
1. **Headline here** — 2 hours ago · 5.2K posts
   Category: News · Politics

2. **Another headline** — 1 hour ago · 12K posts
   Category: AI · Technology

### Sports
1. **Sports headline** — 30 minutes ago · 8K posts
   Category: Sports · NBA
```

### Step 5: Ask about saving (optional)

Offer to save the trends as research:

**Question:** "Would you like to save these trends as a research artifact?"

If yes, save with `save_research`:

```json
{
  "type": "twitter_trends",
  "title": "Twitter Trends - <date>",
  "content": {
    "fetchedAt": "<timestamp>",
    "categories": ["news", "sports"],
    "items": [<news items>]
  },
  "sourceUrls": ["https://x.com/explore"]
}
```

## Use Cases

- **Morning brief**: Get a quick overview of what's trending
- **Research**: Track trends over time by saving as research
- **Discovery**: Find interesting accounts to follow via related tweets
- **News monitoring**: Stay informed about current events

## Tips

- The `forYou` tab is personalized based on your Twitter activity
- AI-curated items are marked with "AI ·" in the category
- Use `withTweets: true` to see example tweets for each trend
