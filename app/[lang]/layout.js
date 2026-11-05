import localFont from "next/font/local";
import "../globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CommandHost from "@/components/CommandHost";
import Effects from "@/components/Effects";
import { config, LANGS, SITE_URL, localePath } from "@/lib/config";
import { getPortfolio } from "@/lib/github";
import { dict } from "@/lib/i18n";
import { localized } from "@/lib/view";

const mono = localFont({ src: "../fonts/JetBrainsMono-var.woff2", variable: "--font-mono", weight: "100 800", display: "swap" });
const display = localFont({ src: "../fonts/ArchivoExpanded-Black.woff2", variable: "--font-display", weight: "900", display: "swap", preload: true });

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
	const { lang } = await params;
	const t = dict(lang);
	return {
		metadataBase: new URL(SITE_URL),
		title: { default: t.meta.title, template: "%s · tjabo" },
		description: t.meta.description,
		applicationName: "tjabo.dev",
		authors: [{ name: config.name, url: SITE_URL }],
		alternates: {
			canonical: localePath(lang, "/"),
			languages: { en: "/", sv: "/sv", "x-default": "/" },
			types: { "application/rss+xml": [{ url: "/feed.xml", title: "tjabo.dev releases" }] },
		},
		openGraph: { type: "website", siteName: "tjabo.dev", locale: lang === "sv" ? "sv_SE" : "en_GB", url: localePath(lang, "/") },
		twitter: { card: "summary_large_image" },
		robots: { index: true, follow: true },
	};
}

export const viewport = { themeColor: "#120d0a", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Runs before paint: motion preference (saved toggle, else the OS setting) without a flash.
const BOOT = `(function(){var d=document.documentElement;d.classList.add('js');try{var m=localStorage.getItem('tjabo:motion');d.dataset.motion=m||(matchMedia('(prefers-reduced-motion: reduce)').matches?'off':'on')}catch(e){d.dataset.motion='on'}})()`;

export default async function RootLayout({ children, params }) {
	const { lang } = await params;
	const data = await getPortfolio();
	const items = data.repos.map((r) => ({
		name: r.name,
		description: localized(r, lang).description,
		language: r.language?.name || null,
		stars: r.stars,
		topics: r.topics,
		url: r.url,
		homepage: r.homepage,
		release: r.release?.tag || null,
		license: r.license,
		pushedAt: r.pushedAt,
	}));
	return (
		<html lang={lang} suppressHydrationWarning className={`${mono.variable} ${display.variable}`}>
			<head>
				<script dangerouslySetInnerHTML={{ __html: BOOT }} />
			</head>
			<body>
				<a className="skip" href="#main">{dict(lang).skip}</a>
				<Nav lang={lang} />
				{children}
				<Footer lang={lang} fetchedAt={data.fetchedAt} />
				<CommandHost lang={lang} items={items} contact={config.contact} totals={data.totals} />
				<Effects />
			</body>
		</html>
	);
}
