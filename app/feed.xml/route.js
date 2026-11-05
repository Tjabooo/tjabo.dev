import { config, SITE_URL } from "@/lib/config";
import { getPortfolio } from "@/lib/github";

export const revalidate = 3600;

const esc = (s) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

// RSS of releases across every public repo.
export async function GET() {
	const data = await getPortfolio();
	const releases = data.repos
		.flatMap((r) => r.releases.map((rel) => ({ ...rel, repo: r })))
		.filter((r) => r.publishedAt)
		.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
		.slice(0, 40);
	const items = releases.map((rel) => `
		<item>
			<title>${esc(`${rel.repo.name} ${rel.name}`)}</title>
			<link>${esc(rel.url)}</link>
			<guid isPermaLink="false">${esc(`${rel.repo.name}@${rel.tag}`)}</guid>
			<pubDate>${new Date(rel.publishedAt).toUTCString()}</pubDate>
			<category>${esc(rel.repo.name)}</category>
			<description>${esc(rel.body ? rel.body.slice(0, 1200) : rel.repo.description)}</description>
		</item>`).join("");
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>tjabo.dev releases</title>
		<link>${SITE_URL}</link>
		<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
		<description>New releases from ${esc(config.name)}'s public GitHub repos.</description>
		<language>en</language>
		${releases[0] ? `<lastBuildDate>${new Date(releases[0].publishedAt).toUTCString()}</lastBuildDate>` : ""}${items}
	</channel>
</rss>`;
	return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
