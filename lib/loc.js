// Server-only: lines of code per repo, counted from the default branch's tarball.
//
// GitHub's API has no line count, so this downloads codeload's tar.gz (public, no token, no API rate limit),
// streams it through gunzip + a small tar reader and counts non-blank lines in source files. Docs, data/config
// files (Markdown, JSON, YAML, TOML), lockfiles, minified bundles, vendored/build folders and binaries don't count.
// Results are cached on disk per commit, so only repos that changed since the last sync are downloaded again.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

/** Bump when the counting rules change: every cached count is then redone. */
export const COUNTER_VERSION = 1;

const MAX_DOWNLOAD = 200 * 1024 * 1024; // compressed bytes; bigger repos are left uncounted
const MAX_FILE = 1024 * 1024; // larger "source" files are almost always generated
const DOWNLOAD_TIMEOUT_MS = 120_000;
const BUDGET_MS = 25_000; // how long a sync waits for counts; slower ones finish in the background
const CONCURRENCY = 3;

const EXT = {
	js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript", jsx: "JavaScript",
	ts: "TypeScript", tsx: "TypeScript", mts: "TypeScript", cts: "TypeScript",
	py: "Python", pyw: "Python", pyi: "Python",
	lua: "Lua", luau: "Luau",
	sh: "Shell", bash: "Shell", zsh: "Shell", ksh: "Shell", fish: "Fish",
	ps1: "PowerShell", psm1: "PowerShell", psd1: "PowerShell", bat: "Batchfile", cmd: "Batchfile",
	c: "C", h: "C", cc: "C++", cpp: "C++", cxx: "C++", hh: "C++", hpp: "C++", hxx: "C++", ino: "C++",
	cs: "C#", fs: "F#", vb: "Visual Basic", xaml: "XAML", razor: "Razor", cshtml: "Razor",
	rs: "Rust", go: "Go", zig: "Zig", nim: "Nim", v: "V", odin: "Odin",
	java: "Java", kt: "Kotlin", kts: "Kotlin", scala: "Scala", groovy: "Groovy", gradle: "Groovy", clj: "Clojure",
	swift: "Swift", mm: "Objective-C++", dart: "Dart",
	rb: "Ruby", php: "PHP", pl: "Perl", pm: "Perl", r: "R", jl: "Julia",
	hs: "Haskell", ml: "OCaml", ex: "Elixir", exs: "Elixir", erl: "Erlang", el: "Emacs Lisp", lisp: "Lisp", scm: "Scheme",
	html: "HTML", htm: "HTML", css: "CSS", scss: "SCSS", sass: "Sass", less: "Less", styl: "Stylus",
	vue: "Vue", svelte: "Svelte", astro: "Astro",
	sql: "SQL", graphql: "GraphQL", gql: "GraphQL",
	glsl: "GLSL", vert: "GLSL", frag: "GLSL", comp: "GLSL", wgsl: "WGSL", hlsl: "HLSL", shader: "ShaderLab",
	gd: "GDScript", qml: "QML", nix: "Nix", vim: "Vim Script", tf: "HCL", cmake: "CMake",
	ahk: "AutoHotkey", yuck: "Yuck", rasi: "Rasi", awk: "Awk", tcl: "Tcl",
};
const NAMES = { dockerfile: "Dockerfile", makefile: "Makefile", "gnumakefile": "Makefile", pkgbuild: "Shell", "cmakelists.txt": "CMake", justfile: "Just" };
const SKIP_DIRS = new Set([
	".git", "node_modules", "bower_components", "jspm_packages", "vendor", "vendors", "third_party", "third-party", "thirdparty",
	"external", "deps", "dist", ".next", ".nuxt", ".svelte-kit", ".turbo", ".cache", "coverage", "__pycache__", "venv", ".venv",
	"target", "Pods", ".yarn", ".gradle", "obj",
]);
const LOCKFILES = new Set([
	"package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "bun.lock", "cargo.lock", "poetry.lock",
	"uv.lock", "pipfile.lock", "go.sum", "composer.lock", "gemfile.lock", "flake.lock", "packages.lock.json", "pubspec.lock",
]);
const GENERATED = /(\.min\.(js|css)|\.bundle\.js|\.map|\.d\.ts|\.pb\.go|_pb2\.py|\.generated\.\w+|\.g\.dart)$/i;

/**
 * Which language a path counts as, or "" when it might be an extensionless script (decided by its shebang),
 * or null when it doesn't count at all. `rel` is relative to the repo root.
 */
export function classify(rel) {
	const parts = rel.split("/");
	const base = parts[parts.length - 1];
	if (!base) return null;
	for (let i = 0; i < parts.length - 1; i++) if (SKIP_DIRS.has(parts[i]) || SKIP_DIRS.has(parts[i].toLowerCase())) return null;
	const lower = base.toLowerCase();
	if (LOCKFILES.has(lower) || GENERATED.test(lower)) return null;
	if (NAMES[lower]) return NAMES[lower];
	const dot = lower.lastIndexOf(".");
	if (dot <= 0) return lower.startsWith(".") ? null : ""; // dotfiles never; "agent-mesh" maybe (shebang)
	return EXT[lower.slice(dot + 1)] || null;
}

const SHEBANG = /^#!.*\b(ba|z|k|da|fi)?sh\b|^#!.*\b(python[\d.]*|node|bun|deno|lua|ruby|perl|php)\b/;
const SHEBANG_LANG = [[/python/, "Python"], [/node|bun|deno/, "JavaScript"], [/lua/, "Lua"], [/ruby/, "Ruby"], [/perl/, "Perl"], [/php/, "PHP"], [/fish/, "Fish"], [/sh\b/, "Shell"]];

function shebangLanguage(buf) {
	if (buf[0] !== 0x23 || buf[1] !== 0x21) return null; // "#!"
	const end = buf.indexOf(10);
	const line = buf.subarray(0, end < 0 ? Math.min(buf.length, 200) : end).toString("latin1");
	if (!SHEBANG.test(line)) return null;
	return SHEBANG_LANG.find(([re]) => re.test(line))?.[1] || null;
}

/** Non-blank lines in a text buffer; null for binary (a NUL byte near the start). */
export function countLines(buf) {
	const probe = Math.min(buf.length, 8000);
	for (let i = 0; i < probe; i++) if (buf[i] === 0) return null;
	let lines = 0;
	let content = false;
	for (let i = 0; i < buf.length; i++) {
		const b = buf[i];
		if (b === 10) {
			if (content) lines++;
			content = false;
		} else if (!content && b !== 32 && b !== 9 && b !== 13 && b !== 11 && b !== 12) {
			content = true;
		}
	}
	return content ? lines + 1 : lines;
}

/** Adds one file to a running tally. */
export function tallyFile(tally, rel, buf) {
	let lang = classify(rel);
	if (lang === null) return;
	if (lang === "") lang = shebangLanguage(buf);
	if (!lang) return;
	const n = countLines(buf);
	if (!n) return;
	tally.lines += n;
	tally.files += 1;
	tally.byLang.set(lang, (tally.byLang.get(lang) || 0) + n);
}

function octal(buf, start, len) {
	if (buf[start] & 0x80) { // GNU base-256 for sizes ≥ 8 GiB
		let n = 0;
		for (let i = start + 1; i < start + len; i++) n = n * 256 + buf[i];
		return n;
	}
	const s = buf.toString("latin1", start, start + len).replace(/\0.*$/s, "").trim();
	return s ? parseInt(s, 8) : 0;
}

const cstr = (buf, start, len) => {
	const end = buf.indexOf(0, start);
	return buf.toString("utf8", start, end < 0 || end > start + len ? start + len : end);
};

/**
 * A streaming tar reader: push() raw (already gunzipped) chunks, onFile(path, data) is called for every
 * regular file whose path wanted(path, size) accepts. Handles ustar prefixes, pax and GNU long names.
 */
export function tarReader(wanted, onFile) {
	let buf = Buffer.alloc(0);
	let entry = null; // { path, remaining, pad, parts: Buffer[] | null, meta }
	let longName = null;
	let paxPath = null;
	let done = false;

	function finishEntry(e) {
		const data = e.parts ? Buffer.concat(e.parts) : null;
		if (e.meta === "L") longName = data.toString("utf8").replace(/\0+$/, "");
		else if (e.meta === "x") {
			for (const m of data.toString("utf8").matchAll(/^\d+ path=(.*)$/gm)) paxPath = m[1];
		} else if (data) onFile(e.path, data);
	}

	return {
		get done() { return done; },
		push(chunk) {
			if (done) return;
			buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
			while (!done) {
				if (entry) {
					if (entry.remaining > 0) {
						if (!buf.length) return;
						const take = Math.min(entry.remaining, buf.length);
						if (entry.parts) entry.parts.push(buf.subarray(0, take));
						entry.remaining -= take;
						buf = buf.subarray(take);
						if (entry.remaining > 0) return;
					}
					if (buf.length < entry.pad) {
						entry.pad -= buf.length;
						buf = buf.subarray(buf.length);
						return;
					}
					buf = buf.subarray(entry.pad);
					const e = entry;
					entry = null;
					finishEntry(e);
					continue;
				}
				if (buf.length < 512) return;
				const h = buf.subarray(0, 512);
				buf = buf.subarray(512);
				if (h[0] === 0) { done = true; return; } // end-of-archive block
				const size = octal(h, 124, 12);
				const type = String.fromCharCode(h[156] || 48);
				const pad = (512 - (size % 512)) % 512;
				if (type === "L" || type === "x") {
					entry = { meta: type, remaining: size, pad, parts: [] };
					continue;
				}
				if (type === "g") { entry = { meta: "g", remaining: size, pad, parts: null }; continue; }
				const ustar = h.toString("latin1", 257, 262) === "ustar";
				const prefix = ustar ? cstr(h, 345, 155) : "";
				const name = longName ?? paxPath ?? (prefix ? `${prefix}/${cstr(h, 0, 100)}` : cstr(h, 0, 100));
				longName = paxPath = null;
				const isFile = type === "0" || type === "7";
				entry = { path: name, remaining: size, pad, parts: isFile && wanted(name, size) ? [] : null };
			}
		},
	};
}

/** Count a gzipped tarball (any async iterable of byte chunks). GitHub tarballs have one top folder: it's stripped. */
export async function countTarball(chunks, { maxBytes = MAX_DOWNLOAD } = {}) {
	const tally = { lines: 0, files: 0, byLang: new Map() };
	const strip = (p) => p.slice(p.indexOf("/") + 1);
	const reader = tarReader(
		(p, size) => size > 0 && size <= MAX_FILE && classify(strip(p)) !== null,
		(p, data) => tallyFile(tally, strip(p), data),
	);
	let seen = 0;
	await pipeline(
		Readable.from(chunks),
		async function* limit(source) {
			for await (const chunk of source) {
				seen += chunk.length;
				if (seen > maxBytes) throw new Error(`tarball over ${Math.round(maxBytes / 1048576)} MB`);
				yield chunk;
			}
		},
		createGunzip(),
		async function read(source) {
			for await (const chunk of source) reader.push(chunk);
		},
	);
	return {
		lines: tally.lines,
		files: tally.files,
		languages: [...tally.byLang].sort((a, b) => b[1] - a[1]).map(([name, lines]) => ({ name, lines })),
	};
}

async function countRepo(owner, name, ref) {
	const url = `https://codeload.github.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tar.gz/${encodeURIComponent(ref)}`;
	const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS), headers: { "User-Agent": "tjabo.dev-sync" } });
	if (!res.ok || !res.body) throw new Error(`GET ${url} → ${res.status}`);
	const length = Number(res.headers.get("content-length"));
	if (length > MAX_DOWNLOAD) {
		await res.body.cancel();
		throw new Error(`tarball is ${Math.round(length / 1048576)} MB`);
	}
	return countTarball(res.body);
}

function cacheFile() {
	return path.join(process.env.CACHE_DIR || path.join(process.cwd(), ".cache"), "loc.json");
}

async function readCache() {
	try {
		const data = JSON.parse(await readFile(cacheFile(), "utf8"));
		return data?.version === COUNTER_VERSION && data.repos ? data.repos : {};
	} catch {
		return {};
	}
}

// One read-modify-write at a time, so parallel counts don't drop each other's entries.
let writing = Promise.resolve();
function saveCount(name, entry) {
	writing = writing.then(async () => {
		const repos = await readCache();
		repos[name] = entry;
		const file = cacheFile();
		await mkdir(path.dirname(file), { recursive: true });
		const tmp = `${file}.${process.pid}.tmp`;
		await writeFile(tmp, JSON.stringify({ version: COUNTER_VERSION, repos }));
		await rename(tmp, file);
	}).catch((error) => console.warn("[loc] cache write:", error.message));
	return writing;
}

const g = globalThis;
g.__tjaboLoc ??= { inflight: new Map() };
const running = g.__tjaboLoc.inflight;

/** What identifies the counted tree: the head commit when we know it, else the push time. */
function keyOf(repo) {
	return repo.commits?.[0]?.sha || repo.pushedAt || null;
}

/**
 * Sets repo.loc = { lines, files, languages } on every repo (or null when unknown). Uses the disk cache for
 * unchanged repos, counts the rest, and waits at most `budget` ms: counts still running then keep going in the
 * background and land in the cache for the next sync, while this one shows the previous count. Never throws.
 */
export async function attachLoc(repos, owner, { budget = BUDGET_MS } = {}) {
	const cache = await readCache();
	const todo = [];
	for (const repo of repos) {
		const hit = cache[repo.name];
		const key = keyOf(repo);
		repo.loc = hit ? { lines: hit.lines, files: hit.files, languages: hit.languages || [] } : null;
		if (key && hit?.key !== key) todo.push({ repo, key });
	}
	if (!todo.length) return repos;

	const queue = todo.slice();
	const worker = async () => {
		for (let job; (job = queue.shift());) {
			const { repo, key } = job;
			const id = `${repo.name}@${key}`;
			if (!running.has(id)) {
				running.set(id, (async () => {
					try {
						const ref = repo.commits?.[0]?.sha || repo.branch || "HEAD";
						const result = await countRepo(repo.owner || owner, repo.name, ref);
						await saveCount(repo.name, { key, ...result, countedAt: new Date().toISOString() });
						return result;
					} catch (error) {
						console.warn(`[loc] ${repo.name}:`, error.message);
						return null;
					} finally {
						running.delete(id);
					}
				})());
			}
			const result = await running.get(id);
			if (result) repo.loc = result;
		}
	};
	const all = Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
	let timer;
	await Promise.race([all, new Promise((r) => { timer = setTimeout(r, budget); })]);
	clearTimeout(timer);
	return repos;
}
