// Lines-of-code counter: classification, line counting, the tar reader and the per-commit cache.
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { attachLoc, classify, countLines, countTarball } from "../lib/loc.js";

function header(name, size, type = "0") {
	const h = Buffer.alloc(512);
	h.write(name.slice(0, 100), 0, "utf8");
	h.write("0000644\0", 100);
	h.write("0000000\0", 108);
	h.write("0000000\0", 116);
	h.write(`${size.toString(8).padStart(11, "0")}\0`, 124);
	h.write("00000000000\0", 136);
	h.write(type, 156);
	h.write("ustar\0", 257);
	h.write("00", 263);
	h.fill(" ", 148, 156);
	let sum = 0;
	for (const b of h) sum += b;
	h.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
	return h;
}
const pad = (buf) => Buffer.concat([buf, Buffer.alloc((512 - (buf.length % 512)) % 512)]);

/** files: [path, content, type?] → gzipped tarball like codeload's (pax global header, one top folder). */
function tarball(files) {
	const parts = [];
	const global = Buffer.from("52 comment=0123456789abcdef0123456789abcdef01234567\n");
	parts.push(header("pax_global_header", global.length, "g"), pad(global));
	for (const [name, content, type = "0"] of files) {
		const body = Buffer.from(content);
		const full = `repo-abc123/${name}`;
		if (Buffer.byteLength(full) > 100) {
			const rec = ` path=${full}\n`;
			let len = rec.length + 2;
			if (String(len + rec.length).length !== String(len).length) len++;
			const pax = Buffer.from(`${len}${rec}`);
			parts.push(header("PaxHeader", pax.length, "x"), pad(pax));
		}
		parts.push(header(full, body.length, type), pad(body));
	}
	parts.push(Buffer.alloc(1024));
	return gzipSync(Buffer.concat(parts));
}

async function* chunked(buf, size = 333) {
	for (let i = 0; i < buf.length; i += size) yield buf.subarray(i, i + size);
}

test("classify: source counts; docs, data, lockfiles, vendored and minified code don't", () => {
	assert.equal(classify("lib/github.js"), "JavaScript");
	assert.equal(classify("src/main.rs"), "Rust");
	assert.equal(classify("scripts/windows/setup.ps1"), "PowerShell");
	assert.equal(classify("Dockerfile"), "Dockerfile");
	assert.equal(classify("bin/agent-mesh"), ""); // decided by shebang
	for (const p of ["README.md", "package.json", "config.yaml", "Cargo.toml", "package-lock.json", "yarn.lock",
		"node_modules/x/index.js", "vendor/lib.c", "dist/app.js", "public/app.min.js", "types/index.d.ts", ".gitignore", "logo.png"]) {
		assert.equal(classify(p), null, p);
	}
});

test("countLines skips blank lines, handles CRLF and a missing final newline, rejects binary", () => {
	assert.equal(countLines(Buffer.from("a\n\n  \n\tb\r\n\r\nc")), 3);
	assert.equal(countLines(Buffer.from("")), 0);
	assert.equal(countLines(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2])), null);
});

test("countTarball reads a codeload-style tarball in small chunks", async () => {
	const deep = `${"very-long-directory-name/".repeat(5)}deep.py`;
	const gz = tarball([
		["index.js", "const a = 1;\n\nconsole.log(a);\n"],
		["style.css", "a {\n  color: red;\n}\n"],
		["README.md", "# hi\n\ntext\n"],
		["bin/tool", "#!/usr/bin/env python3\nprint('hi')\n"],
		["bin/data", "just some words\n"],
		["node_modules/dep/index.js", "x\ny\n"],
		["docs/", "", "5"],
		[deep, "x = 1\ny = 2\n"],
		["img.js", "\0\0\0binary"],
	]);
	const r = await countTarball(chunked(gz));
	assert.equal(r.lines, 2 + 3 + 2 + 2);
	assert.equal(r.files, 4);
	assert.deepEqual(r.languages, [{ name: "Python", lines: 4 }, { name: "CSS", lines: 3 }, { name: "JavaScript", lines: 2 }]);
});

test("countTarball refuses oversized downloads", async () => {
	const gz = tarball([["a.js", "x\n".repeat(5000)]]);
	await assert.rejects(countTarball(chunked(gz), { maxBytes: 100 }), /over/);
});

test("attachLoc counts once per commit and reuses the disk cache", async () => {
	const dir = await mkdtemp(path.join(tmpdir(), "tjabo-loc-"));
	const prevCache = process.env.CACHE_DIR;
	process.env.CACHE_DIR = dir;
	const realFetch = globalThis.fetch;
	const urls = [];
	const gz = tarball([["main.go", "package main\n\nfunc main() {}\n"]]);
	globalThis.fetch = async (url) => {
		urls.push(url);
		return new Response(gz, { headers: { "content-length": String(gz.length) } });
	};
	try {
		const repo = () => ({ name: "tool", owner: "me", branch: "main", commits: [{ sha: "abc" }] });
		const [a] = await attachLoc([repo()], "me");
		assert.equal(a.loc.lines, 2);
		assert.equal(urls.length, 1);
		assert.match(urls[0], /codeload\.github\.com\/me\/tool\/tar\.gz\/abc$/);
		const saved = JSON.parse(await readFile(path.join(dir, "loc.json"), "utf8"));
		assert.equal(saved.repos.tool.key, "abc");

		const [b] = await attachLoc([repo()], "me"); // same commit: no download
		assert.equal(b.loc.lines, 2);
		assert.equal(urls.length, 1);

		globalThis.fetch = async () => { throw new Error("network down"); };
		const [c] = await attachLoc([{ ...repo(), commits: [{ sha: "def" }] }], "me"); // new commit, GitHub down: keep the old count
		assert.equal(c.loc.lines, 2);
	} finally {
		globalThis.fetch = realFetch;
		if (prevCache === undefined) delete process.env.CACHE_DIR;
		else process.env.CACHE_DIR = prevCache;
	}
});
