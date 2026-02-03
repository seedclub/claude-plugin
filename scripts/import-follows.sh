#!/bin/bash
# Import Twitter/X following list as Seed Network signals
# Usage: bash scripts/import-follows.sh [--auth-token TOKEN --ct0 CT0]
#
# Prerequisites:
#   - bird CLI installed (npm i -g @nicepkg/bird)
#   - Logged into x.com in Safari/Chrome/Firefox, OR pass --auth-token and --ct0
#   - Connected to Seed Network (/connect)

set -euo pipefail

# --- Config ---
TOKEN_FILE="$HOME/.config/seed-network/token"
TMPDIR="${TMPDIR:-/tmp}"

# --- Check prerequisites ---
if ! command -v bird &>/dev/null; then
  echo "Error: bird CLI not found. Install with: npm i -g @nicepkg/bird" >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "Error: python3 not found" >&2
  exit 1
fi

if [ ! -f "$TOKEN_FILE" ]; then
  echo "Error: Not connected to Seed Network. Run /connect first." >&2
  exit 1
fi

# Read Seed Network credentials
SEED_TOKEN=$(python3 -c "import json; print(json.load(open('$TOKEN_FILE'))['token'])")
API_BASE=$(python3 -c "import json; print(json.load(open('$TOKEN_FILE')).get('apiBase', 'https://beta.seedclub.com'))")

# --- Fetch following list ---
echo "Fetching X following list..."
BIRD_OUTPUT="$TMPDIR/seed_bird_output.json"

if bird following --all --json "$@" 2>/dev/null > "$BIRD_OUTPUT"; then
  echo "Fetched following list."
else
  echo "Error: bird CLI failed. Make sure you're logged into x.com in your browser," >&2
  echo "or pass credentials: --auth-token TOKEN --ct0 CT0" >&2
  exit 1
fi

# --- Transform and upload ---
echo "Transforming and uploading signals..."

python3 << 'PYEOF'
import json, sys, os, subprocess

bird_output = os.environ.get("BIRD_OUTPUT", "/tmp/seed_bird_output.json")
seed_token = os.environ.get("SEED_TOKEN", "")
api_base = os.environ.get("API_BASE", "https://beta.seedclub.com")

with open(bird_output) as f:
    data = json.load(f)

# Parse defensively — could be array or object with users/data key
if isinstance(data, list):
    users = data
elif isinstance(data, dict):
    users = data.get("users", data.get("data", []))
else:
    print(f"Error: unexpected data format", file=sys.stderr)
    sys.exit(1)

print(f"Found {len(users)} accounts")

# Transform to signal objects
signals = []
for u in users:
    handle = u.get("username", u.get("screen_name", ""))
    img = u.get("profileImageUrl", u.get("profile_image_url_https", u.get("profile_image_url", ""))) or ""
    img = img.replace("_normal.", "_400x400.")

    signals.append({
        "type": "twitter_account",
        "name": u.get("name", handle),
        "description": u.get("description", ""),
        "externalUrl": f"https://x.com/{handle}",
        "imageUrl": img,
        "tags": ["twitter-following"],
        "metadata": {
            "twitterId": str(u.get("id", "")),
            "handle": handle,
            "followersCount": u.get("followersCount", u.get("followers_count", 0)),
            "followingCount": u.get("followingCount", u.get("friends_count", 0)),
        },
    })

# POST all signals in one request
payload = json.dumps({"signals": signals}).encode("utf-8")
payload_file = os.path.join(os.environ.get("TMPDIR", "/tmp"), "seed_signals_payload.json")
with open(payload_file, "w") as f:
    json.dump({"signals": signals}, f)

url = f"{api_base}/api/mcp/signals"
result = subprocess.run(
    ["curl", "-s", "-X", "POST", url,
     "-H", "Content-Type: application/json",
     "-H", f"Authorization: Bearer {seed_token}",
     "-d", f"@{payload_file}"],
    capture_output=True, text=True
)

try:
    resp = json.loads(result.stdout)
    count = resp.get("count", len(resp.get("signals", [])))
    message = resp.get("message", f"Created {count} signals")
    print(f"{message}")
except (json.JSONDecodeError, KeyError):
    print(f"Error: unexpected API response: {result.stdout[:500]}", file=sys.stderr)
    if result.stderr:
        print(f"stderr: {result.stderr[:500]}", file=sys.stderr)
    sys.exit(1)

# Cleanup
os.remove(payload_file)
PYEOF

# Cleanup
rm -f "$BIRD_OUTPUT"
echo "Done."
