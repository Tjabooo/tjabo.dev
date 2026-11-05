import { getPortfolio } from "@/lib/github";
import { dict } from "@/lib/i18n";
import { OG_SIZE, ogImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "tjabo.dev";
export const revalidate = 3600;

export default async function Image({ params }) {
	const { lang } = await params;
	const t = dict(lang);
	const data = await getPortfolio();
	return ogImage({
		kicker: "stockholm, se",
		title: "tjabo_",
		tagline: t.hero.tagline,
		chips: [`${data.totals.repos} repos`, `${data.totals.stars} stars`, ...data.totals.languages.slice(0, 3).map((l) => l.name.toLowerCase())],
		seed: "tjabo.dev",
	});
}
