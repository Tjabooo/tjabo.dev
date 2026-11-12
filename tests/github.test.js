// GitHub sync: only public, non-fork, non-hidden repos ever reach a page; outages fall back to the disk cache.
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { activityFrom, buildPortfolio, calendarFromHtml, fromGraphQL, fromRest, isListable, totals } from "../lib/normalize.js";

const node = (name, extra = {}) => ({
	name, url: `https://github.com/Tjabooo/${name}`, description: `${name} desc`, homepageUrl: "", stargazerCount: 2, forkCount: 0,
	pushedAt: "2026-11-01T10:00:00Z", createdAt: "2026-01-01T00:00:00Z", isArchived: false, isFork: false, isPrivate: false,
	primaryLanguage: { name: "Python", color: "#3572A5" }, languages: { edges: [{ size: 90, node: { name: "Python", color: "#3572A5" } }, { size: 10, node: { name: "Shell", color: "#89e051" } }] },
	repositoryTopics: { nodes: [{ topic: { name: "linux" } }] }, licenseInfo: { spdxId: "MIT" },
	latestRelease: { name: "First", tagName: "v0.1.0", publishedAt: "2026-11-02T00:00:00Z", url: "https://r" },
	releases: { nodes: [{ name: "First", tagName: "v0.1.0", publishedAt: "2026-11-02T00:00:00Z", url: "https://r", isDraft: false, isPrerelease: false, description: "" }] },
	defaultBranchRef: { name: "main", target: { statusCheckRollup: { state: "SUCCESS" }, history: { nodes: [{ oid: "abcdef1234567", messageHeadline: "feat: x", committedDate: "2026-11-03T00:00:00Z", url: "https://c" }] } } },
	readmeUpper: { text: "# hi\n\n![s](docs/s.png)" },
	...extra,
});

test("private repos, forks and hidden repos are dropped", () => {
	const repos = [
		fromGraphQL(node("lilin"), "Tjabooo"),
		fromGraphQL(node("secret-thing", { isPrivate: true }), "Tjabooo"),
		fromGraphQL(node("someone-elses", { isFork: true }), "Tjabooo"),
		fromGraphQL(node("fitcheck-uf-app"), "Tjabooo"), // hidden in site.config.json
		fromGraphQL(node("no-flags", { isPrivate: undefined, isFork: undefined }), "Tjabooo"), // unknown = not shown
	];
	const data = buildPortfolio({ repos, mode: "graphql", fetchedAt: "now" });
	assert.deepEqual(data.repos.map((r) => r.name), ["lilin"]);
	assert.equal(data.totals.repos, 1);
	const json = JSON.stringify(data);
	for (const name of ["secret-thing", "someone-elses", "fitcheck-uf-app", "no-flags"]) assert.ok(!json.includes(name), `${name} leaked`);
	assert.equal(isListable(fromRest({ name: "x", private: true, fork: false })), false);
	assert.equal(isListable(fromRest({ name: "x", private: false, fork: true })), false);
	assert.equal(isListable(fromRest({ name: "x", private: false, fork: false })), true);
});

test("GraphQL node → repo with release, CI, languages, cover and overrides", () => {
	const r = fromGraphQL(node("archfleet"), "Tjabooo");
	assert.equal(r.release.tag, "v0.1.0");
	assert.equal(r.ci, "success");
	assert.equal(r.license, "MIT");
	assert.equal(r.languages[0].share, 0.9);
	assert.equal(r.cover, "https://raw.githubusercontent.com/Tjabooo/archfleet/main/docs/s.png");
	assert.equal(r.featured, true);
	assert.ok(r.description_sv, "Swedish description comes from site.config.json");
	assert.equal(activityFrom([r])[0].type, "commit");
});

test("languages are counted per repo, not by bytes, and skip HTML/CSS", () => {
	const mk = (lang) => ({ language: lang ? { name: lang } : null, stars: 1 });
	const t = totals([mk("Python"), mk("Python"), mk("C"), mk("HTML"), mk(null)]);
	assert.deepEqual(t.languages.map((l) => [l.name, l.count]), [["Python", 2], ["C", 1]]);
	assert.equal(t.stars, 5);
});

test("parses GitHub's public contributions calendar", () => {
	const html = `<h2>\n 12\n contributions\n in the last year\n</h2>
		<td data-date="2026-10-31" id="d-0" data-level="0"></td><tool-tip for="d-0">No contributions on October 31st.</tool-tip>
		<td data-date="2026-11-01" id="d-1" data-level="3"></td><tool-tip for="d-1">12 contributions on November 1st.</tool-tip>`;
	const cal = calendarFromHtml(html);
	assert.equal(cal.total, 12);
	assert.equal(cal.weeks.length, 2, "Sunday starts a new week");
	assert.deepEqual(cal.weeks[1][0], { date: "2026-11-01", count: 12, level: 3 });
});

test("a GitHub outage serves the disk cache instead of breaking the page", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "tjabo-cache-"));
	process.env.CACHE_DIR = dir;
	delete process.env.GITHUB_TOKEN;
	const stale = { mode: "graphql", fetchedAt: "2020-01-01T00:00:00Z", repos: [{ name: "lilin" }], totals: { repos: 1, stars: 0, languages: [] }, calendar: null, activity: [] };
	await writeFile(path.join(dir, "github.json"), JSON.stringify(stale));
	const realFetch = globalThis.fetch;
	globalThis.fetch = async () => { throw new Error("network down"); };
	try {
		const { getPortfolio, syncStatus } = await import("../lib/github.js");
		const data = await getPortfolio();
		assert.equal(data.repos[0].name, "lilin");
		assert.ok(syncStatus().lastError, "the failure is recorded");
	} finally {
		globalThis.fetch = realFetch;
	}
});
