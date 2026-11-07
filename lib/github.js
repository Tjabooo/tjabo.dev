// Server-only GitHub sync. Never imported by client components.
//
// getPortfolio() → memory cache → disk cache (fresh) → GitHub → disk cache (stale) → empty.
// So a GitHub outage, a bad token or a rate limit never breaks a page: it just shows older data.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { OWNER } from "./config.js";
import { attachLoc } from "./loc.js";
import { activityFromEvents, buildPortfolio, calendarFromHtml, fromGraphQL, fromRest } from "./normalize.js";

const TTL_MS = Number(process.env.GITHUB_CACHE_TTL_MINUTES || 30) * 60_000;
const TIMEOUT_MS = 9_000;
const UA = "tjabo.dev-sync";

export function cacheFile() {
	return path.join(process.env.CACHE_DIR || path.join(process.cwd(), ".cache"), "github.json");
}

const REPO_FIELDS = `
	name url homepageUrl stargazerCount forkCount pushedAt createdAt isArchived isFork isPrivate
	primaryLanguage { name color }
	languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
	repositoryTopics(first: 12) { nodes { topic { name } } }
	licenseInfo { spdxId }
	latestRelease { name tagName publishedAt url }
	releases(first: 3, orderBy: { field: CREATED_AT, direction: DESC }) { nodes { name tagName publishedAt url isPrerelease isDraft description } }
	defaultBranchRef { name target { ... on Commit {
		statusCheckRollup { state }
		history(first: 6) { nodes { oid messageHeadline committedDate url } }
	} } }
	readmeUpper: object(expression: "HEAD:README.md") { ... on Blob { text } }
	readmeLower: object(expression: "HEAD:readme.md") { ... on Blob { text } }
	readmePlain: object(expression: "HEAD:README") { ... on Blob { text } }
	description
`;

export const REPOS_QUERY = `query($login: String!, $after: String) {
	user(login: $login) {
		repositories(first: 40, after: $after, privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER,
			orderBy: { field: PUSHED_AT, direction: DESC }) {
			pageInfo { hasNextPage endCursor }
			nodes { ${REPO_FIELDS} }
		}
	}
}`;

async function request(url, init = {}) {
	const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": UA, ...init.headers } });
	if (!res.ok) throw new Error(`${init.method || "GET"} ${url} → ${res.status}`);
	return res;
}

async function graphql(token, query, variables) {
	const res = await request("https://api.github.com/graphql", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
	});
	const json = await res.json();
	if (json.errors?.length) throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
	return json.data;
}

async function publicCalendar(owner) {
	try {
		const res = await request(`https://github.com/users/${encodeURIComponent(owner)}/contributions`, { headers: { Accept: "text/html" } });
		return calendarFromHtml(await res.text());
	} catch (error) {
		console.warn("[github] contributions:", error.message);
		return null;
	}
}

async function fetchWithToken(token, owner) {
	const nodes = [];
	let after = null;
	for (let page = 0; page < 5; page++) {
		const data = await graphql(token, REPOS_QUERY, { login: owner, after });
		const conn = data.user?.repositories;
		if (!conn) throw new Error(`GitHub user ${owner} not found`);
		nodes.push(...conn.nodes);
		if (!conn.pageInfo.hasNextPage) break;
		after = conn.pageInfo.endCursor;
	}
	return { repos: nodes.map((n) => fromGraphQL(n, owner)), mode: "graphql" };
}

async function fetchWithoutToken(owner) {
	const res = await request(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&type=owner&sort=pushed`,
		{ headers: { Accept: "application/vnd.github+json" } });
	const items = (await res.json()).filter((r) => r.private === false && r.fork === false);
	const repos = await Promise.all(items.map(async (item) => {
		let readme = null;
		for (const name of ["README.md", "readme.md", "README"]) {
			try {
				readme = await (await request(`https://raw.githubusercontent.com/${owner}/${item.name}/${item.default_branch}/${name}`)).text();
				break;
			} catch { /* try the next name */ }
		}
		return fromRest(item, readme);
	}));
	let activity = null;
	try {
		const ev = await request(`https://api.github.com/users/${encodeURIComponent(owner)}/events/public?per_page=100`,
			{ headers: { Accept: "application/vnd.github+json" } });
		activity = activityFromEvents(await ev.json(), new Set(repos.map((r) => r.name)));
	} catch (error) {
		console.warn("[github] events:", error.message);
	}
	return { repos, activity, mode: "rest" };
}

/** Always hits GitHub. */
export async function fetchPortfolio({ token = process.env.GITHUB_TOKEN, owner = OWNER } = {}) {
	const [source, calendar] = await Promise.all([
		token ? fetchWithToken(token, owner) : fetchWithoutToken(owner),
		publicCalendar(owner),
	]);
	const portfolio = buildPortfolio({ ...source, calendar, fetchedAt: new Date().toISOString() });
	if (process.env.LOC_COUNT !== "0") await attachLoc(portfolio.repos, owner);
	return portfolio;
}

const EMPTY = Object.freeze({ mode: "empty", fetchedAt: null, repos: [], totals: { repos: 0, stars: 0, languages: [] }, calendar: null, activity: [] });

async function readDisk() {
	try {
		return JSON.parse(await readFile(cacheFile(), "utf8"));
	} catch {
		return null;
	}
}

async function writeDisk(data) {
	const file = cacheFile();
	await mkdir(path.dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	await writeFile(tmp, JSON.stringify(data));
	await rename(tmp, file);
}

const g = globalThis;
g.__tjaboGithub ??= { memory: null, inflight: null, lastError: null };
const state = g.__tjaboGithub;

const age = (d) => (d?.fetchedAt ? Date.now() - new Date(d.fetchedAt).getTime() : Infinity);

/** Fetch now and store the result. Shares one request between concurrent callers. */
export function refreshPortfolio() {
	state.inflight ??= (async () => {
		try {
			const data = await fetchPortfolio();
			state.memory = data;
			state.lastError = null;
			await writeDisk(data).catch((error) => console.warn("[github] cache write:", error.message));
			return data;
		} finally {
			state.inflight = null;
		}
	})();
	return state.inflight;
}

/** Cached data, refreshed when older than the TTL. Never throws. */
export async function getPortfolio() {
	if (state.memory && age(state.memory) < TTL_MS) return state.memory;
	const disk = await readDisk();
	if (disk && age(disk) < TTL_MS && age(disk) <= age(state.memory)) {
		state.memory = disk;
		return disk;
	}
	// Just failed? Don't hammer GitHub on every request; serve what we have for a couple of minutes.
	const recentFailure = state.lastError && Date.now() - new Date(state.lastError.at).getTime() < 120_000;
	if (recentFailure && (state.memory || disk)) return state.memory || disk;
	try {
		return await refreshPortfolio();
	} catch (error) {
		state.lastError = { message: error.message, at: new Date().toISOString() };
		console.warn("[github] sync failed, using cache:", error.message);
		const best = [state.memory, disk].filter(Boolean).sort((a, b) => age(a) - age(b))[0];
		if (best) state.memory = best;
		return best || EMPTY;
	}
}

export function syncStatus() {
	return { fetchedAt: state.memory?.fetchedAt || null, mode: state.memory?.mode || null, lastError: state.lastError };
}

export async function getRepo(name) {
	const data = await getPortfolio();
	const lower = String(name).toLowerCase();
	return data.repos.find((r) => r.name.toLowerCase() === lower) || null;
}
