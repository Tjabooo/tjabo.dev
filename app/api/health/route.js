import { readFileSync } from "node:fs";
import path from "node:path";
import { syncStatus } from "@/lib/github";

export const dynamic = "force-dynamic";

let buildId = null;
function readBuildId() {
	if (buildId) return buildId;
	try {
		buildId = readFileSync(path.join(process.cwd(), process.env.NEXT_DIST_DIR || ".next", "BUILD_ID"), "utf8").trim();
	} catch {
		buildId = "dev";
	}
	return buildId;
}

// deploy.ps1 checks this after a restart: 200 + the BUILD_ID it just built.
export function GET() {
	const s = syncStatus();
	return Response.json(
		{ ok: true, build: readBuildId(), sync: { fetchedAt: s.fetchedAt, mode: s.mode, error: s.lastError ? s.lastError.at : null } },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
