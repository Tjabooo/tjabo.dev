#!/usr/bin/env node
// Tells Bing, Yandex, Seznam and Naver (IndexNow) about every URL in the live sitemap, so new
// and changed project pages get crawled within hours instead of weeks. Run after a deploy.
// Usage: node scripts/indexnow.js [siteUrl]   (key = the 32-hex file in public/)
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = (process.argv[2] || "https://tjabo.dev").replace(/\/$/, "");
const keyFile = readdirSync(join(root, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) { console.error("indexnow: no key file in public/"); process.exit(1); }
const key = keyFile.slice(0, -4);

const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<(?:loc|xhtml:link[^>]*href=")([^<"]+)/g)].map((m) => m[1].replace(/^>/, "")))]
	.filter((u) => u.startsWith(site));
if (!urls.length) { console.error("indexnow: sitemap had no URLs"); process.exit(1); }

const res = await fetch("https://api.indexnow.org/indexnow", {
	method: "POST",
	headers: { "content-type": "application/json; charset=utf-8" },
	body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${keyFile}`, urlList: urls }),
});
console.log(`indexnow: ${urls.length} URLs → HTTP ${res.status}`);
process.exit(res.status < 300 ? 0 : 1);
