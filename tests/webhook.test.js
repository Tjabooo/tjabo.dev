import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifySignature } from "../lib/webhook.js";

const secret = "s3cret";
const body = JSON.stringify({ ref: "refs/heads/main", repository: { name: "marquee" } });
const sign = (b, s = secret) => `sha256=${createHmac("sha256", s).update(b).digest("hex")}`;

test("accepts GitHub's HMAC-SHA256 signature", () => {
	assert.equal(verifySignature(secret, body, sign(body)), true);
});

test("rejects wrong secret, tampered body, bad format and missing pieces", () => {
	assert.equal(verifySignature(secret, body, sign(body, "other")), false);
	assert.equal(verifySignature(secret, `${body} `, sign(body)), false);
	assert.equal(verifySignature(secret, body, sign(body).replace("sha256=", "sha1=")), false);
	assert.equal(verifySignature(secret, body, "sha256=abc"), false);
	assert.equal(verifySignature(secret, body, null), false);
	assert.equal(verifySignature("", body, sign(body, "")), false, "no secret configured = never valid");
});
