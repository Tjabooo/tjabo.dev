// README → safe HTML, rendered on the server only. Relative links point at GitHub,
// relative images at raw.githubusercontent.com, code blocks get highlight.js classes.
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import lua from "highlight.js/lib/languages/lua";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import shell from "highlight.js/lib/languages/shell";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const LANGS = { bash, c, cpp, csharp, css, diff, ini, java, javascript, json, lua, markdown, php, plaintext,
	powershell, python, rust, shell, typescript, xml, yaml };
for (const [name, def] of Object.entries(LANGS)) hljs.registerLanguage(name, def);
hljs.registerAliases(["sh", "zsh", "console"], { languageName: "bash" });
hljs.registerAliases(["toml", "conf", "cfg", "desktop", "service"], { languageName: "ini" });
hljs.registerAliases(["ps1", "pwsh", "ps"], { languageName: "powershell" });
hljs.registerAliases(["js", "mjs", "cjs", "jsx"], { languageName: "javascript" });
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["py"], { languageName: "python" });
hljs.registerAliases(["rs"], { languageName: "rust" });
hljs.registerAliases(["cs", "c#"], { languageName: "csharp" });
hljs.registerAliases(["html", "svg"], { languageName: "xml" });
hljs.registerAliases(["yml"], { languageName: "yaml" });
hljs.registerAliases(["text", "txt"], { languageName: "plaintext" });

const BADGE = /shields\.io|badgen\.net|badge\.svg|\/badges?\/|codecov\.io|skillicons\.dev|komarev|github-readme-stats|vercel\.app\/api/i;

/**
 * Point a README URL at the right place on GitHub.
 * kind "image" → raw file, kind "link" → the file's page on github.com.
 */
export function rewriteUrl(url, { owner, repo, branch = "HEAD" }, kind = "link") {
	if (url == null) return url;
	const u = String(url).trim();
	if (!u || u.startsWith("#")) return u;
	if (u.startsWith("//")) return `https:${u}`;
	if (/^[a-z][a-z0-9+.-]*:/i.test(u)) {
		// github.com/<owner>/<repo>/blob/... images don't render as <img>; use the raw file.
		const m = kind === "image" && u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+?)(\?raw=true)?$/i);
		if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
		return u;
	}
	const resolved = new URL(u, "https://repo.invalid/");
	const path = resolved.pathname.replace(/^\/+/, "");
	const tail = resolved.search + resolved.hash;
	if (kind === "image") return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}${resolved.search}`;
	return `https://github.com/${owner}/${repo}/${path ? `blob/${branch}/${path}` : ""}${tail}`;
}

/** GitHub-style heading anchor. */
export function slugify(text) {
	return String(text)
		.toLowerCase()
		.replace(/<[^>]+>/g, "")
		.replace(/&[a-z0-9#]+;/g, "")
		.trim()
		.replace(/[^\p{L}\p{N}\s_-]/gu, "")
		.replace(/\s/g, "-");
}

/** First real image in a README (no badges), as an absolute URL. */
export function findCover(markdown, ctx) {
	if (!markdown) return null;
	const re = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
	for (const m of markdown.matchAll(re)) {
		const src = m[1] || m[2];
		if (!src || BADGE.test(src)) continue;
		return rewriteUrl(src, ctx, "image");
	}
	return null;
}

function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function highlight(code, lang) {
	const name = (lang || "").trim().split(/\s+/)[0].toLowerCase();
	if (name && hljs.getLanguage(name)) {
		return { html: hljs.highlight(code, { language: name, ignoreIllegals: true }).value, lang: name };
	}
	return { html: escapeHtml(code), lang: name || "text" };
}

function makeMarked() {
	const seen = new Map();
	const marked = new Marked({ gfm: true, breaks: false });
	marked.use({
		renderer: {
			heading({ tokens, depth }) {
				const inner = this.parser.parseInline(tokens);
				let id = slugify(inner) || "section";
				const n = seen.get(id) || 0;
				seen.set(id, n + 1);
				if (n) id = `${id}-${n}`;
				return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
			},
			code({ text, lang }) {
				const { html, lang: name } = highlight(text, lang);
				return `<pre data-lang="${escapeHtml(name)}"><code class="hljs language-${escapeHtml(name)}">${html}</code></pre>\n`;
			},
		},
	});
	return marked;
}

const ALLOWED_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "a", "img", "picture", "source", "video",
	"pre", "code", "span", "kbd", "samp", "var", "blockquote", "ul", "ol", "li", "dl", "dt", "dd", "table", "thead",
	"tbody", "tfoot", "tr", "th", "td", "em", "strong", "b", "i", "u", "s", "del", "ins", "sup", "sub", "small",
	"mark", "abbr", "details", "summary", "div", "input", "figure", "figcaption"];

/** Render README markdown to sanitized HTML. */
export function renderReadme(markdown, ctx) {
	if (!markdown) return "";
	const raw = makeMarked().parse(markdown);
	return sanitizeHtml(raw, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: {
			"*": ["align", "id", "title"],
			a: ["href", "name", "target", "rel", "aria-hidden", "tabindex", "class"],
			img: ["src", "alt", "width", "height", "loading", "decoding"],
			source: ["srcset", "media", "type"],
			video: ["src", "controls", "muted", "loop", "playsinline", "poster", "width"],
			pre: ["data-lang"],
			code: ["class"],
			span: ["class"],
			td: ["align", "colspan", "rowspan"],
			th: ["align", "colspan", "rowspan"],
			input: ["type", "checked", "disabled"],
			details: ["open"],
			ol: ["start"],
		},
		allowedClasses: { code: ["hljs", /^language-[\w#+-]+$/], span: [/^hljs-[\w-]+$/], a: ["anchor"] },
		allowedSchemes: ["http", "https", "mailto"],
		allowedSchemesByTag: { img: ["http", "https", "data"] },
		allowProtocolRelative: true,
		transformTags: {
			a: (tag, attribs) => {
				const href = rewriteUrl(attribs.href, ctx, "link");
				const out = { ...attribs, href };
				if (href && /^https?:/i.test(href)) {
					out.target = "_blank";
					out.rel = "noopener noreferrer";
				}
				return { tagName: "a", attribs: out };
			},
			img: (tag, attribs) => ({
				tagName: "img",
				attribs: { ...attribs, src: rewriteUrl(attribs.src, ctx, "image"), loading: "lazy", decoding: "async",
					alt: attribs.alt ?? "" },
			}),
			source: (tag, attribs) => ({
				tagName: "source",
				attribs: { ...attribs, srcset: (attribs.srcset || "").split(",").map((part) => {
					const [url, ...rest] = part.trim().split(/\s+/);
					return [rewriteUrl(url, ctx, "image"), ...rest].join(" ");
				}).join(", ") },
			}),
			video: (tag, attribs) => ({ tagName: "video", attribs: { ...attribs, src: rewriteUrl(attribs.src, ctx, "image"), controls: "" } }),
			input: (tag, attribs) => ({ tagName: "input", attribs: { type: "checkbox", disabled: "", ...(attribs.checked !== undefined ? { checked: "" } : {}) } }),
		},
		exclusiveFilter: (frame) => frame.tag === "input" && frame.attribs.type !== "checkbox",
	});
}

/** First code block under an Install / Setup / Quick start heading, if the README has one. */
export function findInstall(markdown) {
	if (!markdown) return null;
	const lines = markdown.split(/\r?\n/);
	let inSection = false;
	let level = 0;
	for (let i = 0; i < lines.length; i++) {
		const h = lines[i].match(/^(#{1,4})\s+(.*)$/);
		if (h) {
			if (inSection && h[1].length <= level) inSection = false;
			if (!inSection && /\b(install(ation|ing)?|setup|set up|quick ?start|getting started)\b/i.test(h[2])) {
				inSection = true;
				level = h[1].length;
			}
			continue;
		}
		const fence = inSection && lines[i].match(/^(\s*)(`{3,}|~{3,})\s*([\w+#-]*)/);
		if (fence) {
			const body = [];
			for (let j = i + 1; j < lines.length && !lines[j].trimStart().startsWith(fence[2]); j++) body.push(lines[j].slice(fence[1].length));
			const code = body.join("\n").trim();
			if (code && code.split("\n").length <= 12) return { lang: fence[3] || "bash", code };
			return null;
		}
	}
	return null;
}

/** First paragraph of plain text, for meta descriptions. */
export function readmeSummary(markdown, max = 200) {
	if (!markdown) return "";
	const para = markdown
		.replace(/<[^>]+>/g, " ")
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.find((p) => p && !/^(#|!\[|\[!\[|```|\||-{3,}|>)/.test(p));
	if (!para) return "";
	const text = para.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
	return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
