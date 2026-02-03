# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code plugin for Seed Network, providing deal sourcing and enrichment tools for investment research. The plugin exposes an MCP (Model Context Protocol) server that connects to the Seed Network API.

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build TypeScript to dist/
pnpm dev              # Watch mode for development
```

## Architecture

### MCP Server

The plugin runs as an MCP server using stdio transport. The entry point is `src/index.ts` which:
- Registers all tools with the MCP SDK
- Routes tool calls to handler functions in `src/tools/`
- Uses `src/api-client.ts` for authenticated API requests to Seed Network

### Tool Organization

Tools are grouped by domain in `src/tools/`:
- `deals.ts` - Deal CRUD and search operations
- `companies.ts` - Company CRUD and search operations
- `research.ts` - Research artifact storage and linking
- `enrichments.ts` - Enrichment submission for curator review
- `utility.ts` - User info and sync status

All tools use the shared `api` client which handles authentication via `SEED_NETWORK_TOKEN` and routes requests to `/api/mcp/*` endpoints.

### Plugin Structure

```
commands/           # Slash commands (/source, /enrich, /activity)
hooks/              # Session hooks (hooks.json)
skills/             # Skills with reference documentation
  deal-sourcing/    # Deal sourcing guidance and patterns
src/                # MCP server TypeScript source
.mcp.json           # MCP server configuration
```

### Commands

Commands are markdown files with YAML frontmatter specifying:
- `name`, `description`, `argument-hint`
- `allowed-tools` - MCP tools and Claude tools the command can use
- `model` (optional) - Specific model to use (e.g., `haiku` for `/activity`)

### Hooks

The `SessionStart` hook runs `scripts/load-context.sh` to validate the API token is set.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SEED_NETWORK_TOKEN` | API token (required) |
| `SEED_NETWORK_API` | API base URL (default: http://localhost:3000) |

## Key Patterns

### API Client

All API requests go through `api-client.ts` which:
- Prepends `/api/mcp` to all endpoints
- Adds Bearer token authentication
- Throws `ApiError` for non-2xx responses

### Error Handling

Tool handlers catch `ApiError` and return `{ error, status }` objects rather than throwing. This allows MCP to return structured error responses.

### Research vs Deals

Research artifacts are raw information collected during sourcing. Deals are structured investment opportunities ready for review. Save research first, create deals when you have sufficient verified information.

### Enrichments

Enrichments are submitted changes to existing deals/companies that go through curator review via GitHub PR before being applied.

### Direct API Access for Bulk Operations

For bulk operations (importing hundreds+ of signals, etc.), calling MCP tools repeatedly is inefficient — each call consumes context and requires permission approval. Instead, use `curl` directly:

- **Token location:** `~/.config/seed-network/token` (JSON with `token` and `apiBase` fields)
- **Endpoint pattern:** All MCP tool endpoints map to `{apiBase}/api/mcp/{path}`
- **Auth:** `Authorization: Bearer {token}` header

Example — bulk create signals:
```bash
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.config/seed-network/token'))['token'])")
API_BASE=$(python3 -c "import json; print(json.load(open('$HOME/.config/seed-network/token')).get('apiBase', 'https://beta.seedclub.com'))")

curl -s -X POST "${API_BASE}/api/mcp/signals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @payload.json
```

Key endpoints:
| Tool | Method | Path |
|------|--------|------|
| `create_signal` / `batch_create_signals` | POST | `/api/mcp/signals` |
| `list_signals` / `get_signal` | GET | `/api/mcp/signals` |
| `delete_signal` | DELETE | `/api/mcp/signals` |
| `create_deal` | POST | `/api/mcp/deals` |
| `list_deals` | GET | `/api/mcp/deals` |
| `save_research` | POST | `/api/mcp/research` |

The signals endpoint accepts the full payload in one request — no batching needed.
