#!/bin/bash
# Seed Network Plugin - Session Context Loader
# Validates auth token at session start and persists session context

if [ -z "$SEED_NETWORK_TOKEN" ]; then
  echo "Warning: SEED_NETWORK_TOKEN not set" >&2
  exit 0
fi

# Signal that the token is present and session is ready
echo "export SEED_NETWORK_READY=true" >> "$CLAUDE_ENV_FILE"
