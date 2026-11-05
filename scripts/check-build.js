// Smoke-test a finished build: start it on a spare port and check the routes that must never break.
//   npm run build && npm run check
import { spawn } from "node:child_process";

const port = 8000 + Math.floor(Math.random() * 900) + 50;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
const base = `http://127.0.0.1:${port}`;
const checks = [
	["/", 200, /tjabo/i],
	["/sv", 200, /Jag bygger verktygen/],
	["/.well-known/discord", 200, /^dh=/],
	["/en-resume.pdf", 200],
	["/sitemap.xml", 200, /<urlset/],
	["/robots.txt", 200, /Sitemap/],
	["/feed.xml", 200, /<rss/],
	["/api/health", 200, /"ok":true/],
	["/definitely-not-a-page", 404],
	["/en/projects/x", 308],
];

async function waitUp() {
	for (let i = 0; i < 60; i++) {
		try { if ((await fetch(`${base}/api/health`)).ok) return; } catch { /* starting */ }
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error("server did not start");
}

let failed = 0;
try {
	await waitUp();
	const home = await (await fetch(`${base}/`)).text();
	const first = home.match(/href="\/projects\/([^"#?]+)"/)?.[1];
	if (first) checks.push([`/projects/${first}`, 200, /README|readme/], [`/sv/projects/${first}`, 200]);
	for (const [path, status, body] of checks) {
		const res = await fetch(base + path, { redirect: "manual" });
		const text = await res.text();
		const ok = res.status === status && (!body || body.test(text));
		if (!ok) failed++;
		console.log(`${ok ? "ok  " : "FAIL"} ${res.status} ${path}`);
	}
} catch (error) {
	console.error(error.message);
	failed++;
} finally {
	server.kill();
}
process.exit(failed ? 1 : 0);
