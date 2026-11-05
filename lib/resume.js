import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Résumé link with a content hash, so browsers and Cloudflare (which keeps PDFs for hours) never serve a stale copy.
const cache = {};
export function resumeUrl(lang) {
	const file = lang === "sv" ? "sv-resume.pdf" : "en-resume.pdf";
	if (!(file in cache)) {
		try {
			const hash = createHash("sha256").update(readFileSync(join(process.cwd(), "public", file))).digest("hex").slice(0, 10);
			cache[file] = `/${file}?v=${hash}`;
		} catch {
			cache[file] = `/${file}`;
		}
	}
	return cache[file];
}
