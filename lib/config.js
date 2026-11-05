import site from "../site.config.json" with { type: "json" };

export const config = site;
export const OWNER = process.env.GITHUB_OWNER || site.owner;
export const SITE_URL = (process.env.SITE_URL || site.siteUrl).replace(/\/$/, "");
export const LANGS = ["en", "sv"];

const hidden = new Set((site.hidden || []).map((n) => n.toLowerCase()));
const featured = (site.featured || []).map((n) => n.toLowerCase());

export function isHidden(name) {
	return hidden.has(String(name).toLowerCase());
}

/** Position in the featured list, or -1. */
export function featuredRank(name) {
	return featured.indexOf(String(name).toLowerCase());
}

export function overrideFor(name) {
	const all = site.overrides || {};
	const key = Object.keys(all).find((k) => k.toLowerCase() === String(name).toLowerCase());
	return key ? all[key] : {};
}

/** Path on this site for a language: en lives at the root, sv under /sv. */
export function localePath(lang, path = "/") {
	const p = path.startsWith("/") ? path : `/${path}`;
	if (lang === "sv") return p === "/" ? "/sv" : `/sv${p}`;
	return p;
}
