import assert from "node:assert/strict";
import { test } from "node:test";
import { findCover, findInstall, readmeSummary, renderReadme, rewriteUrl } from "../lib/readme.js";

const ctx = { owner: "Tjabooo", repo: "archfleet", branch: "main" };

test("relative links go to github.com, relative images to raw.githubusercontent.com", () => {
	assert.equal(rewriteUrl("docs/overview.png", ctx, "image"), "https://raw.githubusercontent.com/Tjabooo/archfleet/main/docs/overview.png");
	assert.equal(rewriteUrl("./docs/a b.png", ctx, "image"), "https://raw.githubusercontent.com/Tjabooo/archfleet/main/docs/a%20b.png");
	assert.equal(rewriteUrl("/LICENSE", ctx), "https://github.com/Tjabooo/archfleet/blob/main/LICENSE");
	assert.equal(rewriteUrl("../x/y.md#usage", ctx), "https://github.com/Tjabooo/archfleet/blob/main/x/y.md#usage");
	assert.equal(rewriteUrl("clipdeck/", ctx), "https://github.com/Tjabooo/archfleet/blob/main/clipdeck/");
});

test("absolute URLs, anchors and mailto stay; github blob images become raw", () => {
	assert.equal(rewriteUrl("https://example.com/a", ctx), "https://example.com/a");
	assert.equal(rewriteUrl("#install", ctx), "#install");
	assert.equal(rewriteUrl("mailto:a@b.c", ctx), "mailto:a@b.c");
	assert.equal(rewriteUrl("//cdn.example/x.png", ctx, "image"), "https://cdn.example/x.png");
	assert.equal(rewriteUrl("https://github.com/Tjabooo/dotfiles/blob/master/shot.png?raw=true", ctx, "image"),
		"https://raw.githubusercontent.com/Tjabooo/dotfiles/master/shot.png");
});

test("renders GitHub-flavoured markdown with rewritten links and highlighting", () => {
	const md = [
		"# Archfleet", "", "![Overview](docs/overview.png)", "", "See [the license](LICENSE) or [usage](#usage).", "",
		"| a | b |", "|---|---|", "| 1 | 2 |", "", "```python", "def hi():\n    return 1", "```", "",
		'<p align="center"><img src="docs/logo.svg" width="120"></p>', "", "- [x] done",
	].join("\n");
	const html = renderReadme(md, ctx);
	assert.match(html, /<h1 id="archfleet">/);
	assert.match(html, /src="https:\/\/raw\.githubusercontent\.com\/Tjabooo\/archfleet\/main\/docs\/overview\.png"/);
	assert.match(html, /src="https:\/\/raw\.githubusercontent\.com\/Tjabooo\/archfleet\/main\/docs\/logo\.svg"/);
	assert.match(html, /href="https:\/\/github\.com\/Tjabooo\/archfleet\/blob\/main\/LICENSE"[^>]*target="_blank"/);
	assert.match(html, /href="#usage"/);
	assert.match(html, /<table>/);
	assert.match(html, /<span class="hljs-keyword">def<\/span>/);
	assert.match(html, /<input type="checkbox" disabled="" checked="" \/>|<input type="checkbox" disabled checked/);
});

test("strips scripts, event handlers and javascript: links", () => {
	const html = renderReadme('<script>alert(1)</script><img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a><iframe src="https://evil"></iframe>', ctx);
	assert.doesNotMatch(html, /<script|onerror|javascript:|<iframe/i);
});

test("cover = first non-badge image", () => {
	const md = "[![CI](https://github.com/T/x/actions/workflows/ci.yml/badge.svg)](x) ![license](https://img.shields.io/x)\n\n![shot](docs/shot.gif)";
	assert.equal(findCover(md, ctx), "https://raw.githubusercontent.com/Tjabooo/archfleet/main/docs/shot.gif");
	assert.equal(findCover("no images here", ctx), null);
});

test("install snippet comes from the README's install section", () => {
	const md = "# x\n\n## Usage\n```sh\nx run\n```\n\n## Install\n\nSteps:\n\n```sh\ngit clone https://github.com/T/x\ncd x && ./install.sh\n```\n";
	assert.deepEqual(findInstall(md), { lang: "sh", code: "git clone https://github.com/T/x\ncd x && ./install.sh" });
	assert.equal(findInstall("# x\n\n```sh\nnope\n```"), null);
	assert.equal(readmeSummary("# T\n\n[![b](x)](y)\n\nA *small* [tool](z) for things.\n"), "A small tool for things.");
});
