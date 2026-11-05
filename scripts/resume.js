#!/usr/bin/env node
// Builds the résumé PDFs served at /en-resume.pdf and /sv-resume.pdf.
//
//   node scripts/resume.js          write resume/out/{en,sv}.html, then print the PDFs if Chrome/Edge is found
//   node scripts/resume.js --html   only write the HTML (print it elsewhere)
//
// Content lives in resume/resume.json (one shared block + one block per language).
// Fonts are embedded, so the HTML prints the same on any machine. Set CHROME=/path/to/chrome to pick the browser.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "resume/resume.json"), "utf8"));
const out = join(root, "resume/out");
mkdirSync(out, { recursive: true });

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// **bold** and [text](url) inside content strings; everything else is escaped.
const md = (s) => esc(s)
	.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
	.replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
const font = (file) => `data:font/woff2;base64,${readFileSync(join(root, file)).toString("base64")}`;

const faces = [
	["Display", "app/fonts/ArchivoExpanded-Black.woff2", 900, "normal"],
	["Mono", "app/fonts/JetBrainsMono-var.woff2", "100 800", "normal"],
	["Body", "resume/fonts/NotoSans-Regular.woff2", 400, "normal"],
	["Body", "resume/fonts/NotoSans-Italic.woff2", 400, "italic"],
	["Body", "resume/fonts/NotoSans-Medium.woff2", 500, "normal"],
	["Body", "resume/fonts/NotoSans-Bold.woff2", 700, "normal"],
].map(([fam, file, weight, style]) =>
	`@font-face{font-family:${fam};src:url(${font(file)}) format("woff2");font-weight:${weight};font-style:${style}}`).join("\n");

const css = `${faces}
@page { size: A4; margin: 0; }
:root {
	--ink: #1b1410; --sub: #4d3f35; --dim: #6e5c4f; --line: #e6dcd2; --wash: #fbf7f3;
	--orange: #ff8c1a; --gold: #f5a524; --ember: #ff4d1f; --accent-ink: #b5480b;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 400 8.8pt/1.4 Body, sans-serif; color: var(--ink); background: #fff; }
a { color: inherit; text-decoration: none; }
.page { position: relative; width: 210mm; min-height: 297mm; padding: 11.5mm 15mm 8mm; }
.page::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 2.2mm;
	background: linear-gradient(90deg, var(--ember), var(--orange) 55%, var(--gold)); }

header { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: end; padding-bottom: 4mm; border-bottom: 0.6pt solid var(--line); }
h1 { font: 900 25pt/0.95 Display, sans-serif; letter-spacing: -0.02em; margin: 0; text-transform: uppercase; }
h1 span { color: var(--orange); }
.role { margin-top: 2.6mm; font-weight: 500; font-size: 10pt; color: var(--sub); }
.contact { font: 400 7.6pt/1.65 Mono, monospace; color: var(--sub); text-align: right; white-space: nowrap; }
.contact b { color: var(--accent-ink); font-weight: 600; }

.summary { margin: 3.4mm 0 0; font-size: 9.1pt; line-height: 1.48; color: var(--sub); max-width: 168mm; }
.summary b { color: var(--ink); font-weight: 500; }

section { margin-top: 4mm; }
h2 { break-after: avoid; display: flex; align-items: center; gap: 2.4mm; margin: 0 0 2.6mm; font: 600 7.4pt/1 Mono, monospace;
	letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-ink); }
h2::before { content: ""; width: 1.7mm; height: 1.7mm; background: var(--orange); }
h2::after { content: ""; flex: 1; height: 0.6pt; background: var(--line); }

.entry { display: grid; grid-template-columns: 1fr auto; column-gap: 6mm; break-inside: avoid; }
.entry + .entry { margin-top: 2.2mm; }
.entry h3 { margin: 0; font-size: 9.6pt; font-weight: 700; }
.entry h3 .org { font-weight: 400; color: var(--sub); }
.entry h3 .org::before { content: "·"; margin: 0 1.6mm; color: var(--orange); font-weight: 700; }
.when { font: 400 7.6pt/1.9 Mono, monospace; color: var(--dim); text-align: right; white-space: nowrap; }
.meta { grid-column: 1 / -1; margin-top: 0.4mm; font-size: 8.2pt; color: var(--dim); font-style: italic; }
ul { grid-column: 1 / -1; margin: 1.1mm 0 0; padding: 0; list-style: none; }
li { position: relative; padding-left: 3.6mm; color: var(--sub); }
li + li { margin-top: 0.5mm; }
li::before { content: ""; position: absolute; left: 0.3mm; top: 0.62em; width: 1.6mm; height: 0.7pt; background: var(--orange); }
li b, .entry p b { color: var(--ink); font-weight: 500; }
.entry p { grid-column: 1 / -1; margin: 0.4mm 0 0; color: var(--sub); }
.stack { grid-column: 1 / -1; margin-top: 1mm; font: 400 7.2pt/1.4 Mono, monospace; color: var(--dim); }

.projects { display: grid; grid-template-columns: 1fr 1fr; gap: 2.6mm 4mm; }
.projects .entry + .entry { margin-top: 0; }
.projects .entry { padding: 2.2mm 3mm 2.4mm; background: var(--wash); border-left: 0.9mm solid var(--orange); }
.projects .entry.wide { grid-column: 1 / -1; }
.projects h3 a { border-bottom: 0.5pt solid var(--line); }

.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; }
.skills { display: grid; grid-template-columns: auto 1fr; gap: 1.1mm 4mm; margin: 0; }
.skills dt { font: 600 7.4pt/1.62 Mono, monospace; color: var(--ink); white-space: nowrap; }
.skills dd { margin: 0; color: var(--sub); }
`;

const entry = (e, extra = "") => `
<div class="entry${extra}">
	<h3>${e.url ? `<a href="${esc(e.url)}">${esc(e.title)}</a>` : esc(e.title)}${e.org ? `<span class="org">${esc(e.org)}</span>` : ""}</h3>
	<div class="when">${esc(e.when ?? "")}</div>
	${e.text ? `<p>${md(e.text)}</p>` : ""}
	${e.meta ? `<div class="meta">${md(e.meta)}</div>` : ""}
	${e.points?.length ? `<ul>${e.points.map((p) => `<li>${md(p)}</li>`).join("")}</ul>` : ""}
	${e.stack ? `<div class="stack">${esc(e.stack)}</div>` : ""}
</div>`;

function html(lang) {
	const c = data.common, d = data[lang];
	const [first, ...rest] = c.name.split(" ");
	const contact = c.contact.map((x) => x.url
		? `<a href="${esc(x.url)}">${esc(x.label)}</a>`
		: `<span>${esc(typeof x.label === "object" ? x.label[lang] : x.label)}</span>`).join("<br>");
	const s = d.sections;
	return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<title>${esc(c.name)}: ${esc(d.doc)}</title>
<meta name="author" content="${esc(c.name)}">
<style>${css}</style></head>
<body><div class="page">
<header>
	<div><h1>${esc(first)} <span>${esc(rest.join(" "))}</span></h1><div class="role">${md(d.role)}</div></div>
	<div class="contact">${contact}</div>
</header>
<p class="summary">${md(d.summary)}</p>
<section><h2>${esc(s.experience)}</h2>${d.experience.map((e) => entry(e)).join("")}</section>
<section><h2>${esc(s.projects)}</h2><div class="projects">${d.projects.map((e) => entry(e, e.wide ? " wide" : "")).join("")}</div></section>
<section><h2>${esc(s.education)}</h2>${d.education.map((e) => entry(e)).join("")}</section>
<section><h2>${esc(s.skills)}</h2><dl class="skills">${d.skills.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${md(v)}</dd>`).join("")}</dl></section>
</div></body></html>`;
}

function findChrome() {
	const candidates = [
		process.env.CHROME,
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
	];
	return candidates.find((p) => p && existsSync(p));
}

const langs = Object.keys(data).filter((k) => k !== "common" && !k.startsWith("$"));
for (const lang of langs) writeFileSync(join(out, `${lang}.html`), html(lang));
console.log(`html: ${langs.map((l) => `resume/out/${l}.html`).join(", ")}`);

if (!process.argv.includes("--html")) {
	const chrome = findChrome();
	if (!chrome) {
		console.error("No Chrome/Edge found: set CHROME=/path/to/chrome, or print resume/out/*.html elsewhere.");
		process.exit(1);
	}
	for (const lang of langs) {
		const pdf = join(root, "public", `${lang}-resume.pdf`);
		execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--no-first-run",
			`--print-to-pdf=${pdf}`, pathToFileURL(join(out, `${lang}.html`)).href], { stdio: "ignore" });
		console.log(`pdf:  public/${lang}-resume.pdf`);
	}
}
