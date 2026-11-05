// Contact form → Discord webhook, with a per-IP rate limit.

export function createRateLimiter({ windowMs = 5 * 60_000, max = 3, now = Date.now } = {}) {
	const hits = new Map();
	return {
		/** Counts one request for `key`. */
		hit(key) {
			const t = now();
			if (hits.size > 5000) for (const [k, v] of hits) if (v.expires < t) hits.delete(k);
			let entry = hits.get(key);
			if (!entry || entry.expires < t) {
				entry = { count: 0, expires: t + windowMs };
				hits.set(key, entry);
			}
			entry.count += 1;
			return entry.count > max ? { ok: false, retryAfter: Math.ceil((entry.expires - t) / 1000) } : { ok: true };
		},
		reset() {
			hits.clear();
		},
	};
}

/** Cloudflare sets CF-Connecting-IP; fall back to the first X-Forwarded-For hop. */
export function clientIp(headers) {
	return headers.get("cf-connecting-ip") || headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

const LIMITS = { name: 100, email: 100, subject: 300, message: 1500 };

export function validateContact(body) {
	if (!body || typeof body !== "object") return { ok: false, error: "invalid" };
	const data = {};
	for (const [field, max] of Object.entries(LIMITS)) {
		const value = typeof body[field] === "string" ? body[field].trim() : "";
		if (!value) return { ok: false, error: "missing", field };
		if (value.length > max) return { ok: false, error: "too_long", field };
		data[field] = value;
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, error: "email", field: "email" };
	return { ok: true, data, spam: typeof body.website === "string" && body.website.length > 0 };
}

export function discordPayload({ name, email, subject, message }, mentionId) {
	const ping = mentionId ? `\n\n<@${mentionId}>` : "";
	return {
		content: `## New contact form message\n**Name:** ${name}\n**Email:** ${email}\n**Subject:** ${subject}\n**Message:**\n${message}${ping}`.slice(0, 2000),
		// Only ever ping the owner, whatever the visitor typed (no @everyone from the form).
		allowed_mentions: { parse: [], users: mentionId ? [mentionId] : [] },
	};
}

const limiter = createRateLimiter();

/** The POST /api/send handler, kept framework-free so tests can call it. */
export async function handleContact(request, { env = process.env, rateLimiter = limiter, send = fetch } = {}) {
	const gate = rateLimiter.hit(clientIp(request.headers));
	if (!gate.ok) {
		return Response.json({ error: "rate_limited", retryAfterSeconds: gate.retryAfter }, { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });
	}
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid" }, { status: 400 });
	}
	const check = validateContact(body);
	if (!check.ok) return Response.json({ error: check.error, field: check.field }, { status: 400 });
	if (check.spam) return Response.json({ success: true });
	if (!env.DISCORD_WEBHOOK_URL) {
		console.error("[contact] DISCORD_WEBHOOK_URL is not set");
		return Response.json({ error: "not_configured" }, { status: 500 });
	}
	try {
		const res = await send(env.DISCORD_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(discordPayload(check.data, env.DISCORD_MENTION_USER_ID)),
			signal: AbortSignal.timeout(8000),
		});
		if (!res.ok) throw new Error(`Discord answered ${res.status}`);
		return Response.json({ success: true });
	} catch (error) {
		console.error("[contact]", error.message);
		return Response.json({ error: "send_failed" }, { status: 502 });
	}
}
