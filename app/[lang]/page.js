import Hero from "@/components/Hero";
import About from "@/components/About";
import ProjectGrid from "@/components/ProjectGrid";
import Activity from "@/components/Activity";
import Contact from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import { config, SITE_URL } from "@/lib/config";
import { getPortfolio } from "@/lib/github";
import { dict } from "@/lib/i18n";
import { cardData } from "@/lib/view";

export const revalidate = 3600;

export default async function Home({ params }) {
	const { lang } = await params;
	const data = await getPortfolio();
	const t = dict(lang).projects;
	const cards = data.repos.map((r) => cardData(r, lang));
	return (
		<main id="main" className="page">
			<JsonLd data={{
				"@context": "https://schema.org",
				"@type": "Person",
				name: config.name,
				alternateName: config.handle,
				url: SITE_URL,
				image: `${SITE_URL}/apple-icon.png`,
				homeLocation: { "@type": "Place", name: "Stockholm, Sweden" },
				jobTitle: lang === "sv" ? "Utvecklare" : "Developer",
				sameAs: [config.contact.github, config.contact.linkedin, config.contact.instagram].filter(Boolean),
				knowsAbout: data.totals.languages.map((l) => l.name),
			}} />
			<Hero lang={lang} data={data} />
			<About lang={lang} totals={data.totals} />
			<section className="section" id="projects" aria-labelledby="projects-title">
				<div className="wrap">
					<div className="section-head">
						<p className="kicker" data-reveal><span className="hexdot" />{t.kicker}</p>
						<h2 className="h2" id="projects-title" data-reveal>{t.title}</h2>
						<p className="lede" data-reveal>{t.sub(data.totals.repos)}</p>
					</div>
					<ProjectGrid repos={cards} lang={lang} />
				</div>
			</section>
			<Activity lang={lang} data={data} />
			<Contact lang={lang} />
		</main>
	);
}
