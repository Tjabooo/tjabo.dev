// Small, serialisable projections of repo data for client components (no README text).

export function localized(repo, lang) {
	const sv = lang === "sv";
	return {
		description: (sv && repo.description_sv) || repo.description || "",
		tagline: (sv && repo.tagline_sv) || repo.tagline || null,
	};
}

export function cardData(repo, lang) {
	const { description, tagline } = localized(repo, lang);
	return {
		name: repo.name,
		description,
		tagline,
		url: repo.url,
		homepage: repo.homepage,
		stars: repo.stars,
		forks: repo.forks,
		language: repo.language,
		languages: (repo.languages || []).slice(0, 4),
		topics: repo.topics || [],
		pushedAt: repo.pushedAt,
		release: repo.release ? repo.release.tag : null,
		ci: repo.ci,
		cover: repo.cover,
		featured: repo.featured,
		rank: repo.rank,
		accent: repo.accent,
		archived: repo.archived,
		license: repo.license,
	};
}

/** Repos that share topics or a language with `repo`, best first. */
export function relatedRepos(repo, repos, limit = 3) {
	const topics = new Set(repo.topics || []);
	return repos
		.filter((r) => r.name !== repo.name)
		.map((r) => {
			let score = (r.topics || []).filter((t) => topics.has(t)).length * 3;
			if (r.language && repo.language && r.language.name === repo.language.name) score += 2;
			if (r.featured) score += 1;
			return { r, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score || new Date(b.r.pushedAt) - new Date(a.r.pushedAt))
		.slice(0, limit)
		.map((x) => x.r);
}

/** Previous / next in the site's order, wrapping around. */
export function neighbours(repo, repos) {
	const i = repos.findIndex((r) => r.name === repo.name);
	if (i < 0 || repos.length < 2) return { prev: null, next: null };
	return { prev: repos[(i - 1 + repos.length) % repos.length], next: repos[(i + 1) % repos.length] };
}
