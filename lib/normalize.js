// Pure functions that turn GitHub API responses into the site's data shape.
// No network here, so tests can feed them fixtures.
import { featuredRank, isHidden, overrideFor } from "./config.js";
import { findCover } from "./readme.js";

const LANG_COLORS = {
	JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#4b8bbe", "C#": "#3fb950", C: "#a8b9cc",
	"C++": "#f34b7d", PowerShell: "#5391fe", Rust: "#dea584", Shell: "#89e051", Java: "#e76f00",
	Lua: "#7a8cff", PHP: "#a074c4", HTML: "#e34c26", CSS: "#663399",
};
const NOT_LANGUAGES = new Set(["HTML", "CSS"]); // build.py rule: don't count markup as a repo's language

export function langColor(name, fallback) {
	return LANG_COLORS[name] || fallback || "#b2a397";
}

const CI = { SUCCESS: "success", FAILURE: "failure", ERROR: "failure", PENDING: "pending", EXPECTED: "pending" };

/** Public, non-fork, not hidden. Applied to every source, whatever the query asked for. */
export function isListable(repo) {
	return Boolean(repo) && repo.private === false && repo.fork === false && !isHidden(repo.name);
}

function finish(repo) {
	const o = overrideFor(repo.name);
	const ctx = { owner: repo.owner, repo: repo.name, branch: repo.branch };
	const rank = featuredRank(repo.name);
	return {
		...repo,
		description: o.description || repo.description || "",
		description_sv: o.description_sv || null,
		tagline: o.tagline || null,
		tagline_sv: o.tagline_sv || null,
		accent: o.accent || null,
		install: o.install || null,
		cover: o.cover || findCover(repo.readme, ctx),
		coverFromReadme: !o.cover && Boolean(findCover(repo.readme, ctx)),
		featured: rank >= 0,
		rank,
	};
}

/** GraphQL repository node → repo. */
export function fromGraphQL(node, owner) {
	const target = node.defaultBranchRef?.target;
	const totalSize = (node.languages?.edges || []).reduce((n, e) => n + e.size, 0) || 1;
	const readme = node.readmeUpper?.text ?? node.readmeLower?.text ?? node.readmePlain?.text ?? null;
	return finish({
		name: node.name,
		owner,
		private: node.isPrivate !== false,
		fork: node.isFork !== false,
		url: node.url,
		description: node.description || "",
		homepage: node.homepageUrl || null,
		stars: node.stargazerCount || 0,
		forks: node.forkCount || 0,
		language: node.primaryLanguage ? { name: node.primaryLanguage.name, color: langColor(node.primaryLanguage.name, node.primaryLanguage.color) } : null,
		languages: (node.languages?.edges || []).map((e) => ({
			name: e.node.name, color: langColor(e.node.name, e.node.color), share: e.size / totalSize,
		})),
		topics: (node.repositoryTopics?.nodes || []).map((t) => t.topic.name),
		pushedAt: node.pushedAt,
		createdAt: node.createdAt,
		archived: !!node.isArchived,
		license: node.licenseInfo?.spdxId && node.licenseInfo.spdxId !== "NOASSERTION" ? node.licenseInfo.spdxId : null,
		branch: node.defaultBranchRef?.name || "main",
		ci: CI[target?.statusCheckRollup?.state] || null,
		release: node.latestRelease ? {
			tag: node.latestRelease.tagName, name: node.latestRelease.name || node.latestRelease.tagName,
			publishedAt: node.latestRelease.publishedAt, url: node.latestRelease.url,
		} : null,
		releases: (node.releases?.nodes || []).filter((r) => !r.isDraft).map((r) => ({
			tag: r.tagName, name: r.name || r.tagName, publishedAt: r.publishedAt, url: r.url, prerelease: !!r.isPrerelease,
			body: r.description || "",
		})),
		commits: (target?.history?.nodes || []).map((c) => ({
			sha: c.oid, message: c.messageHeadline, date: c.committedDate, url: c.url,
		})),
		readme,
	});
}

/** REST /users/:u/repos item → repo (used when there's no token). */
export function fromRest(item, readme = null) {
	return finish({
		name: item.name,
		owner: item.owner?.login,
		private: item.private !== false,
		fork: item.fork !== false,
		url: item.html_url,
		description: item.description || "",
		homepage: item.homepage || null,
		stars: item.stargazers_count || 0,
		forks: item.forks_count || 0,
		language: item.language ? { name: item.language, color: langColor(item.language) } : null,
		languages: item.language ? [{ name: item.language, color: langColor(item.language), share: 1 }] : [],
		topics: item.topics || [],
		pushedAt: item.pushed_at,
		createdAt: item.created_at,
		archived: !!item.archived,
		license: item.license?.spdx_id && item.license.spdx_id !== "NOASSERTION" ? item.license.spdx_id : null,
		branch: item.default_branch || "main",
		ci: null,
		release: null,
		releases: [],
		commits: [],
		readme,
	});
}

/** Featured first (in config order), then by last push. */
export function sortRepos(repos) {
	return [...repos].sort((a, b) => {
		if (a.featured !== b.featured) return a.featured ? -1 : 1;
		if (a.featured) return a.rank - b.rank;
		return new Date(b.pushedAt) - new Date(a.pushedAt);
	});
}

/** Totals like build.py: languages counted per repo (primary language), not by bytes. */
export function totals(repos) {
	const langs = {};
	for (const r of repos) {
		const name = r.language?.name;
		if (name && !NOT_LANGUAGES.has(name)) langs[name] = (langs[name] || 0) + 1;
	}
	return {
		repos: repos.length,
		stars: repos.reduce((n, r) => n + r.stars, 0),
		languages: Object.entries(langs)
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([name, count]) => ({ name, count, color: langColor(name) })),
	};
}

/** Commits + releases across repos, newest first. */
export function activityFrom(repos, limit = 14) {
	const items = [];
	for (const r of repos) {
		for (const c of r.commits || []) items.push({ type: "commit", repo: r.name, title: c.message, date: c.date, url: c.url, ref: c.sha.slice(0, 7) });
		for (const rel of r.releases || []) items.push({ type: "release", repo: r.name, title: rel.name, date: rel.publishedAt, url: rel.url, ref: rel.tag });
	}
	return items.filter((i) => i.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

/** Public events (REST fallback) → activity items. */
export function activityFromEvents(events, listable, limit = 14) {
	const items = [];
	for (const e of events || []) {
		const name = e.repo?.name?.split("/")[1];
		if (!name || !listable.has(name)) continue;
		if (e.type === "PushEvent") {
			for (const c of (e.payload?.commits || []).slice(-3).reverse()) {
				items.push({ type: "commit", repo: name, title: (c.message || "").split("\n")[0], date: e.created_at,
					url: `https://github.com/${e.repo.name}/commit/${c.sha}`, ref: c.sha.slice(0, 7) });
			}
		} else if (e.type === "ReleaseEvent" && e.payload?.release) {
			const rel = e.payload.release;
			items.push({ type: "release", repo: name, title: rel.name || rel.tag_name, date: rel.published_at || e.created_at, url: rel.html_url, ref: rel.tag_name });
		}
	}
	return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

/** github.com/users/:u/contributions HTML → same shape. This is the public view, so private work never shows. */
export function calendarFromHtml(html) {
	if (!html) return null;
	const counts = new Map();
	for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
		const n = m[2].match(/^\s*([\d,]+)\s+contribution/);
		counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
	}
	const days = [];
	for (const m of html.matchAll(/<td\b[^>]*>/g)) {
		const tag = m[0];
		const date = tag.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
		if (!date) continue;
		const id = tag.match(/\bid="([^"]+)"/)?.[1];
		days.push({ date, count: counts.get(id) ?? 0, level: Number(tag.match(/\bdata-level="(\d)"/)?.[1] || 0) });
	}
	if (!days.length) return null;
	days.sort((a, b) => a.date.localeCompare(b.date));
	const weeks = [];
	let week = [];
	for (const d of days) {
		if (new Date(`${d.date}T00:00:00Z`).getUTCDay() === 0 && week.length) { weeks.push(week); week = []; }
		week.push(d);
	}
	if (week.length) weeks.push(week);
	const header = html.match(/([\d,]+)\s+contributions?\s+in the last year/i)?.[1];
	const total = header ? Number(header.replace(/,/g, "")) : days.reduce((n, d) => n + d.count, 0);
	return { total, weeks };
}

/** Public repos only, with everything the pages need. */
export function buildPortfolio({ repos, calendar, activity, mode, fetchedAt }) {
	const listable = sortRepos(repos.filter(isListable));
	return {
		mode,
		fetchedAt,
		repos: listable,
		totals: totals(listable),
		calendar: calendar || null,
		activity: activity || activityFrom(listable),
	};
}
