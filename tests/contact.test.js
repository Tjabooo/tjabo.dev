// Contact form: rate limit (kept from the old tests/rate-limit-test.js), validation, Discord payload.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter, discordPayload, handleContact, validateContact } from "../lib/contact.js";

const good = { name: "Test", email: "test@example.com", subject: "Hi", message: "Bleh bleh bleh" };
const req = (body, ip = "1.2.3.4") => new Request("http://x/api/send", {
	method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify(body),
});

test("allows 3 messages per IP per 5 minutes, then 429 with Retry-After", async () => {
	let t = 0;
	const rateLimiter = createRateLimiter({ now: () => t });
	const sent = [];
	const send = async (url, init) => { sent.push(JSON.parse(init.body)); return new Response(null, { status: 204 }); };
	const env = { DISCORD_WEBHOOK_URL: "https://discord.invalid/hook" };
	const codes = [];
	for (let i = 0; i < 15; i++) codes.push((await handleContact(req(good), { env, rateLimiter, send })).status);
	assert.deepEqual(codes, [200, 200, 200, ...Array(12).fill(429)]);
	assert.equal(sent.length, 3);
	const limited = await handleContact(req(good), { env, rateLimiter, send });
	assert.ok(Number(limited.headers.get("retry-after")) > 0);
	assert.equal((await handleContact(req(good, "5.6.7.8"), { env, rateLimiter, send })).status, 200, "other IPs are not affected");
	t += 5 * 60_000 + 1;
	assert.equal((await handleContact(req(good), { env, rateLimiter, send })).status, 200, "window expires");
});

test("rejects missing, oversized and malformed fields", () => {
	assert.equal(validateContact({ ...good, name: "" }).error, "missing");
	assert.equal(validateContact({ ...good, message: "x".repeat(1501) }).error, "too_long");
	assert.equal(validateContact({ ...good, email: "nope" }).error, "email");
	assert.equal(validateContact(null).error, "invalid");
	assert.ok(validateContact(good).ok);
});

test("honeypot submissions pretend to succeed and send nothing", async () => {
	let called = false;
	const res = await handleContact(req({ ...good, website: "spam.example" }), {
		env: { DISCORD_WEBHOOK_URL: "x" }, rateLimiter: createRateLimiter(), send: async () => { called = true; return new Response(); },
	});
	assert.equal(res.status, 200);
	assert.equal(called, false);
});

test("Discord payload only ever pings the owner", () => {
	const p = discordPayload({ ...good, message: "@everyone hello <@123>" }, "42");
	assert.deepEqual(p.allowed_mentions, { parse: [], users: ["42"] });
	assert.ok(p.content.includes("<@42>"));
	assert.deepEqual(discordPayload(good).allowed_mentions.users, []);
});

test("500 without a webhook URL, 502 when Discord fails", async () => {
	const rl = createRateLimiter({ max: 100 });
	assert.equal((await handleContact(req(good), { env: {}, rateLimiter: rl })).status, 500);
	const res = await handleContact(req(good), { env: { DISCORD_WEBHOOK_URL: "x" }, rateLimiter: rl, send: async () => new Response("", { status: 500 }) });
	assert.equal(res.status, 502);
});
