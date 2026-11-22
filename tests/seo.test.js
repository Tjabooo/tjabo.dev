import { test } from "node:test";
import assert from "node:assert/strict";
import { projectDescription, projectTitle, searchPhrase } from "../lib/seo.js";

test("title takes the category before the colon", () => {
	const repo = { name: "edgehop", description: "Software KVM for Wayland and Hyprland, like Synergy: push the cursor off a screen edge" };
	assert.equal(projectTitle(repo, "en"), "edgehop: Software KVM for Wayland and Hyprland, like Synergy");
});

test("own seo_title wins, Swedish one on /sv", () => {
	const repo = { name: "lilin", description: "x: y", seo_title: "Media server", seo_title_sv: "Mediaserver" };
	assert.equal(searchPhrase(repo, "en"), "Media server");
	assert.equal(searchPhrase(repo, "sv"), "Mediaserver");
});

test("no colon falls back to tagline, then a clipped description", () => {
	assert.equal(searchPhrase({ name: "a", description: "Plain sentence without any colon in it", tagline: "Short pitch." }, "en"), "Short pitch");
	const long = "word ".repeat(40);
	assert.ok(searchPhrase({ name: "a", description: long }, "en").length <= 60);
});

test("description is clipped to 160 on a word boundary", () => {
	const d = projectDescription({ description: "alpha beta ".repeat(30) }, "en");
	assert.ok(d.length <= 160 && d.endsWith("…") && !d.includes("  "));
});
