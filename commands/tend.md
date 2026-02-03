---
name: tend
description: Check your followed signals for interesting events and updates
argument-hint: [signal type, name, or "all"]
allowed-tools:
  - mcp__plugin_seed_seed-network__get_signals_to_tend
  - mcp__plugin_seed_seed-network__create_event
  - mcp__plugin_seed_seed-network__batch_create_events
  - mcp__plugin_seed_seed-network__mark_signal_tended
  - mcp__plugin_seed_seed-network__batch_mark_signals_tended
  - mcp__plugin_seed_seed-network__list_signals
  - mcp__plugin_seed_seed-network__get_signal
  - WebSearch
  - WebFetch
  - AskUserQuestion
---

# Signal Tending Workflow

Check your followed signals for newsworthy events and updates. This command helps you stay informed about companies, people, and topics you're tracking.

## What Tending Does

1. Identifies signals that haven't been checked recently
2. Researches each signal for recent activity (last few days)
3. Creates events for newsworthy occurrences
4. Marks signals as tended to track when they were last checked

## Event Types to Look For

**Structured Events** (concrete, factual):
- `fundraising_announced` - Funding rounds, investments
- `acquisition` - M&A activity
- `product_launch` - New products, features, services
- `key_hire` - Notable hires (C-suite, key roles)
- `partnership` - Strategic partnerships
- `media_coverage` - Major press coverage
- `regulatory_filing` - SEC filings, regulatory news

**Semi-Structured Events** (signals and trends):
- `social_activity` - Notable tweets, viral moments
- `sentiment_change` - Shifts in public perception
- `market_signal` - Market trends, sector shifts
- `endorsement` - Notable praise or recommendation of another person/company (signal discovery)

**Flexible Events** (insights and observations):
- `insight` - Interesting observations, analysis, "vibes"
- `custom` - Anything that doesn't fit above categories

## Workflow

### Step 1: Get Signals to Tend

If the user specified a signal type or name:
- Use `list_signals` to find matching signals
- Filter to those the user wants to tend

Otherwise:
- Use `get_signals_to_tend` to get signals due for checking
- These are signals that haven't been tended recently

### Step 2: Research Each Signal

For each signal, research recent activity based on signal type:

**Twitter accounts**:
- Search for recent tweets, threads, announcements
- Look for viral moments, notable interactions
- Check for any news mentions

**Companies**:
- Search for funding news, product launches
- Look for press coverage, blog posts
- Check social media for announcements

**People**:
- Search for career moves, speaking engagements
- Look for thought leadership content
- Check for media appearances

**Topics/Custom**:
- Search for recent developments
- Look for trending discussions
- Check for notable opinions or analysis

### Step 3: Create Events

For each noteworthy finding:
- Choose the appropriate event type
- Write a clear, concise title
- Add a summary with context
- Include the source URL
- Set importance (0-100):
  - 90+ = Must know (major funding, acquisition, crisis)
  - 70-89 = Notable (product launch, key hire)
  - 50-69 = Interesting (media mention, social buzz)
  - Below 50 = Minor (routine updates)
- Create a dedupe key to prevent duplicates

**Dedupe Key Format**: `{signalId}:{eventType}:{identifier}`
Examples:
- `abc123:fundraising_announced:2024-01-15`
- `xyz789:social_activity:tweet-123456`
- `def456:product_launch:feature-name`

### Step 4: Mark Signals Tended

After processing each signal:
- Call `mark_signal_tended` to record the check
- If research failed, include the error message

### Step 5: Summary

Report to the user:
- How many signals were tended
- How many events were created
- Any notable highlights
- Any signals that failed

## Example Interaction

**User**: `/seed:tend`

**Response**: "Let me check your signals for recent updates...

Found 5 signals due for tending:
1. @elonmusk (Twitter) - last checked 2 days ago
2. Stripe (Company) - last checked 3 days ago
3. AI Safety (Topic) - never checked
...

Researching @elonmusk...
- Found: Announced new product feature yesterday
- Created: product_launch event (importance: 75)

Researching Stripe...
- No significant news in the last few days
- Marked as tended

...

Summary:
- Tended 5 signals
- Created 3 events
- 2 signals had no new activity"

**User**: `/seed:tend companies`

**Response**: "Focusing on company signals only..."

## Tips for Good Events

1. **Be specific** - "Announced $50M Series B" not "Got funding"
2. **Include context** - Why is this noteworthy?
3. **Cite sources** - Always include the source URL
4. **Set importance appropriately** - Reserve high scores for truly significant news
5. **Use dedupe keys** - Prevent duplicate events for the same occurrence
6. **Capture insights** - Use the `insight` type for interesting observations that don't fit structured types

## Handling Failures

If research fails for a signal:
- Mark it as tended with an error message
- This prevents repeated failed attempts
- After 3 consecutive errors, the signal will be paused for manual review
