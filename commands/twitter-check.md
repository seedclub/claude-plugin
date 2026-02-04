---
name: twitter-check
description: Check your Twitter/X authentication status
allowed-tools:
  - mcp__plugin_seed_seed-network__twitter_check
---

# Check Twitter/X Authentication

Verify that you're logged into Twitter/X and can access the API.

## What This Does

The plugin reads Twitter session cookies directly from your browser (Safari, Chrome, or Firefox). This command verifies those cookies are present and valid.

## Usage

Call `twitter_check` to verify authentication status.

### If Authenticated

You'll see:
- `authenticated: true`
- `source` — Which browser the cookies came from (e.g., "Safari")
- `user` — Your Twitter account info (id, username, name)

### If Not Authenticated

You'll see:
- `authenticated: false`
- `instructions` — Steps to fix:
  1. Open x.com in Safari, Chrome, or Firefox
  2. Log in to your Twitter/X account
  3. Return here and retry

## Troubleshooting

**"No valid Twitter credentials found"**
- Make sure you're logged into x.com in your browser
- Try logging out and back in to refresh the session
- If using Chrome/Firefox, make sure the browser isn't in private/incognito mode

**Cookie permissions on macOS**
- Safari cookies require Full Disk Access for the terminal app
- Go to System Preferences → Security & Privacy → Privacy → Full Disk Access
- Add your terminal application (Terminal, iTerm2, etc.)

**Browser order**
The plugin checks browsers in this order:
1. Safari
2. Chrome
3. Firefox

It uses the first browser where valid Twitter cookies are found.

## Privacy Note

This plugin only reads the `auth_token` and `ct0` cookies from the browser, which are needed to authenticate with Twitter's API. No other cookies or browser data are accessed.
