// Search titles and descriptions for project pages. A bare repo name ("lilin · tjabo") ranks for
// nothing, so the title carries what a searcher would type: "lilin: Self-hosted media server …".
import { localized } from "./view.js";

const MAX_DESC = 160;

function clip(text, max) {
	const s = (text || "").replace(/\s+/g, " ").trim();
	if (s.length <= max) return s;
	const cut = s.slice(0, max - 1);
	const at = cut.lastIndexOf(" ");
	return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.(-]+$/, "")}…`;
}

// The part of a description before its first colon is usually the category ("Software KVM for
// Wayland and Hyprland, like Synergy or Input Leap"): that is the search phrase.
export function searchPhrase(repo, lang) {
	const sv = lang === "sv";
	const own = (sv && repo.seo_title_sv) || repo.seo_title;
	if (own) return own;
	const { description, tagline } = localized(repo, lang);
	const head = (description || "").split(/:\s/)[0].trim();
	if (head && head !== description && head.length >= 12 && head.length <= 75) return head;
	if (tagline) return clip(tagline.replace(/\.$/, ""), 75);
	return clip(description, 60);
}

export function projectTitle(repo, lang) {
	const phrase = searchPhrase(repo, lang);
	return phrase ? `${repo.name}: ${phrase}` : repo.name;
}

export function projectDescription(repo, lang, fallback = "") {
	const { description, tagline } = localized(repo, lang);
	return clip(description || tagline || fallback, MAX_DESC);
}

// Topics as plain words for keywords/JSON-LD ("plex-alternative" → "plex alternative").
export function topicWords(repo) {
	return (repo.topics || []).map((t) => t.replace(/-/g, " "));
}

// Best-effort platform list from topics, for SoftwareApplication.operatingSystem.
export function platforms(repo) {
	const t = new Set(repo.topics || []);
	const os = [];
	if (["linux", "arch-linux", "hyprland", "wayland"].some((x) => t.has(x))) os.push("Linux");
	if (t.has("windows")) os.push("Windows");
	if (t.has("docker") || t.has("nodejs")) os.push("Windows", "Linux", "macOS");
	return [...new Set(os)];
}
