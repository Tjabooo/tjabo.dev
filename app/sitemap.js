import { SITE_URL } from "@/lib/config";
import { getPortfolio } from "@/lib/github";

export const revalidate = 3600;

export default async function sitemap() {
	const data = await getPortfolio();
	const latest = data.repos.reduce((m, r) => (r.pushedAt > m ? r.pushedAt : m), "") || undefined;
	const entry = (path, lastModified, priority) => ({
		url: `${SITE_URL}${path}`,
		lastModified,
		changeFrequency: "weekly",
		priority,
		alternates: { languages: { en: `${SITE_URL}${path}`, sv: `${SITE_URL}/sv${path === "/" ? "" : path}` } },
	});
	return [
		entry("/", latest, 1),
		...data.repos.map((r) => entry(`/projects/${encodeURIComponent(r.name)}`, r.pushedAt, r.featured ? 0.8 : 0.6)),
	];
}
