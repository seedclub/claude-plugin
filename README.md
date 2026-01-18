# Seed Network Plugin for Claude Code

Deal sourcing and enrichment plugin for [Seed Network](https://seed.network).

## Installation

```bash
/plugin install seedclub/claude-plugin
```

Then build the MCP server:

```bash
cd ~/.claude/plugins/seedclub/claude-plugin
pnpm install
pnpm build
```

## Configuration

Set these environment variables:

| Variable | Description |
|----------|-------------|
| `SEED_NETWORK_TOKEN` | API token from /admin/api-tokens |
| `SEED_NETWORK_API` | API base URL (default: http://localhost:3000) |

## Commands

| Command | Description |
|---------|-------------|
| `/source <company>` | Research and create a deal submission |
| `/enrich <deal>` | Add information to an existing deal |
| `/activity` | View your contributions |

## MCP Tools

The plugin provides these tools via the MCP server:

**Deals**
- `create_deal` - Create a new deal
- `update_deal` - Update deal fields
- `get_deal` - Get deal by ID or slug
- `list_deals` - List deals with filters
- `search_deals` - Full-text search

**Companies**
- `create_company` - Create a company
- `update_company` - Update company fields
- `get_company` - Get company by ID or slug
- `list_companies` - List companies with filters
- `search_companies` - Full-text search

**Research**
- `save_research` - Save a research artifact
- `get_research` - Get research by ID
- `query_research` - Search research
- `link_research` - Link research to company/deal

**Enrichments**
- `add_enrichment` - Submit an enrichment for review
- `get_enrichments` - Get enrichment history
- `cancel_enrichment` - Cancel pending enrichment

**Utility**
- `get_current_user` - Get current user info
- `sync_status` - Check API connection

## Development

```bash
pnpm install
pnpm build

# Watch mode
pnpm dev
```

## License

UNLICENSED