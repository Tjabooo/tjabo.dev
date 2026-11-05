import { createHmac, timingSafeEqual } from "node:crypto";

/** Checks GitHub's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body). */
export function verifySignature(secret, body, header) {
	if (!secret || typeof header !== "string" || !header.startsWith("sha256=")) return false;
	const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
	const got = Buffer.from(header);
	return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Events that change what the site shows. */
export const REFRESH_EVENTS = new Set(["push", "release", "repository", "create", "delete", "public", "star", "workflow_run", "check_suite"]);
