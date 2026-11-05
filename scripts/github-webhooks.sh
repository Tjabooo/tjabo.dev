#!/usr/bin/env bash
# Add (or update) the tjabo.dev webhook on every public, non-fork repo of an owner. Safe to re-run:
# repos that already have a hook for the URL get its secret and events refreshed instead.
#
#   GITHUB_WEBHOOK_SECRET=... scripts/github-webhooks.sh            # owner from site.config.json
#   GITHUB_WEBHOOK_SECRET=... scripts/github-webhooks.sh Tjabooo https://tjabo.dev/api/github
#
# Needs the GitHub CLI (gh) logged in with admin rights on the repos.
set -euo pipefail
owner="${1:-$(python3 -c 'import json;print(json.load(open("site.config.json"))["owner"])')}"
url="${2:-https://tjabo.dev/api/github}"
: "${GITHUB_WEBHOOK_SECRET:?set GITHUB_WEBHOOK_SECRET (same value as on the server)}"
events='["push","release","repository","public","star","create","delete","workflow_run"]'

for repo in $(gh repo list "$owner" --visibility public --source --limit 200 --json name --jq '.[].name'); do
	id=$(gh api "repos/$owner/$repo/hooks" --jq ".[] | select(.config.url == \"$url\") | .id" 2>/dev/null | head -1 || true)
	body=$(printf '{"name":"web","active":true,"events":%s,"config":{"url":"%s","content_type":"json","secret":"%s","insecure_ssl":"0"}}' "$events" "$url" "$GITHUB_WEBHOOK_SECRET")
	if [ -n "$id" ]; then
		echo "$body" | gh api -X PATCH "repos/$owner/$repo/hooks/$id" --input - >/dev/null && echo "updated  $repo"
	else
		echo "$body" | gh api -X POST "repos/$owner/$repo/hooks" --input - >/dev/null && echo "added    $repo"
	fi
done
