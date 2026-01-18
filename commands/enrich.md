---
name: enrich
description: Add new information to an existing Seed Network deal
argument-hint: <deal name or slug>
allowed-tools:
  # All plugin MCP tools (wildcard)
  - mcp__plugin_seed_seed-network__*
  # Web tools
  - WebSearch
  - WebFetch
  - AskUserQuestion
---

# Seed Network Deal Enrichment

Guide the user through adding new information to an existing deal. Enrichments are submitted for curator review via GitHub PR.

## Workflow

### Step 1: Find the Deal

If the user provided a deal name or slug:
- Use `search_deals` to find matching deals
- If multiple matches, ask user to clarify

If no deal specified:
- Ask what deal they want to enrich
- Use `list_deals` to show recent deals if helpful

### Step 2: Show Current State

Once a deal is identified:
- Use `get_deal` to fetch full details
- Display current information clearly
- Use `get_enrichments` to show pending enrichments

Help user understand:
- What information already exists
- What's missing or potentially outdated
- What enrichments are pending review

### Step 3: Identify What to Add

Ask the user what information they want to add:
- New funding round?
- Updated valuation?
- Team changes?
- Product updates?
- Market context?

### Step 4: Gather Evidence

For each piece of information:
- Find authoritative sources
- Save research artifacts with `save_research`
- Note confidence level (high, medium, low)

### Step 5: Submit Enrichment

Use `add_enrichment` to submit the update:
- Include all fields being updated
- Reference source URLs
- Add notes explaining the update

Explain to user:
- Enrichment creates a GitHub PR
- Curator will review and approve/reject
- They'll be notified of the outcome

### Step 6: Summary

Provide the user with:
- Confirmation of submission
- PR URL for tracking
- Expected review timeline

## Quality Standards

Good enrichments include:
- Specific, verifiable information
- Authoritative source URLs
- Clear confidence level
- Explanation of why the update matters

## Example Interactions

User: `/seed:enrich Acme Corp`

Response: "Let me find Acme Corp and show you its current state... Here's what we have:
- Name: Acme Corp
- Summary: AI-powered supply chain optimization
- Stage: Pre-seed
- Valuation: Not set

What would you like to add or update?"

User: "They just raised a seed round"

Response: "Great, let me help you add their seed round. Do you have details on:
- Amount raised?
- Valuation?
- Lead investor?
- Source (news article, press release)?"
