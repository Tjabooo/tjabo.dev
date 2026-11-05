"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dict } from "@/lib/i18n";

export default function NotFound() {
	const lang = useParams()?.lang === "sv" ? "sv" : "en";
	const t = dict(lang).notFound;
	return (
		<main id="main" className="nf page">
			<div>
				<p className="code" aria-hidden="true">404</p>
				<h1 className="h2" style={{ marginTop: 18 }}>{t.title}</h1>
				<p className="lede" style={{ margin: "0 auto 26px" }}>{t.body}</p>
				<Link className="btn primary" href={lang === "sv" ? "/sv" : "/"}>{t.home}</Link>
			</div>
		</main>
	);
}
