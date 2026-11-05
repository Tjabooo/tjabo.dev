import { getRepo } from "@/lib/github";
import { OG_SIZE, ogImage } from "@/lib/og";
import { localized } from "@/lib/view";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Project on tjabo.dev";
export const revalidate = 3600;

export default async function Image({ params }) {
	const { lang, repo: name } = await params;
	const repo = await getRepo(decodeURIComponent(name));
	if (!repo) return ogImage({ kicker: "404", title: "not found", seed: "404" });
	const { description, tagline } = localized(repo, lang);
	const text = tagline || description;
	return ogImage({
		kicker: "~/projects",
		title: repo.name,
		tagline: text.length > 120 ? `${text.slice(0, 117)}…` : text,
		chips: [repo.language?.name, `${repo.stars} ${repo.stars === 1 ? "star" : "stars"}`, repo.release?.tag, repo.license].filter(Boolean),
		accent: repo.accent || "#ff8c1a",
		seed: repo.name,
	});
}
