---
name: activity
description: View your Seed Network contributions - deals created, research saved, and enrichments submitted
model: haiku
allowed-tools:
  # All plugin MCP tools (wildcard)
  - mcp__plugin_seed_seed-network__*
---

# Seed Network Activity

Show the user their contributions to Seed Network, including deals created, research saved, and enrichments submitted.

## Workflow

### Step 1: Get User Info

Use `get_current_user` to get:
- User identity
- Activity statistics
- Contribution counts

### Step 2: Display Summary

Show an overview of the user's contributions:

```
Your Seed Network Activity
--------------------------
Deals Created:        5
Research Saved:      12
Enrichments:          3 (2 approved, 1 pending)
```

### Step 3: Offer Deep Dives

Ask if the user wants to explore specific areas:
- "View my deals" - List deals they created
- "View my research" - List research artifacts
- "View pending enrichments" - Show enrichments awaiting review
- "Check sync status" - Show cache and connection status

### Step 4: Detail Views

**My Deals:**
- Use `list_deals` with `createdBy` filter
- Show name, stage, status for each
- Offer to view full details of any deal

**My Research:**
- Use `query_research` with user filter
- Group by type (company profiles, market analysis, etc.)
- Show linked deals

**Pending Enrichments:**
- Use `get_enrichments` filtered to pending status
- Show PR URLs for tracking
- Indicate how long each has been waiting

### Step 5: Sync Status (if requested)

Use `sync_status` to show:
- Cache freshness
- Pending writes
- Connection status

## Example Interactions

User: `/seed:activity`

Response:
```
Your Seed Network Activity
--------------------------
Deals Created:        5
Research Saved:      12
Enrichments:          3 (2 approved, 1 pending)

Would you like to:
1. View your deals
2. View your research
3. Check pending enrichments
4. See sync status
```

User: "Show my pending enrichments"

Response:
```
Pending Enrichments (1)
-----------------------
• Acme Corp - Updated valuation
  PR: https://github.com/seedclub/seed-network-enrichments/pull/42
  Submitted: 2 days ago
  Status: Awaiting curator review
```
