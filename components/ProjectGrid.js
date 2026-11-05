"use client";
import { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard";
import { dict } from "@/lib/i18n";

export default function ProjectGrid({ repos, lang }) {
	const t = dict(lang).projects;
	const [language, setLanguage] = useState(null);
	const [topic, setTopic] = useState("");
	const [sort, setSort] = useState("featured");

	const languages = useMemo(() => {
		const m = new Map();
		for (const r of repos) if (r.language) m.set(r.language.name, { ...r.language, n: (m.get(r.language.name)?.n || 0) + 1 });
		return [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
	}, [repos]);
	const topics = useMemo(() => {
		const m = new Map();
		for (const r of repos) for (const tp of r.topics) m.set(tp, (m.get(tp) || 0) + 1);
		return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
	}, [repos]);

	const filtered = useMemo(() => {
		const list = repos.filter((r) => (!language || r.language?.name === language) && (!topic || r.topics.includes(topic)));
		if (sort === "stars") list.sort((a, b) => b.stars - a.stars || new Date(b.pushedAt) - new Date(a.pushedAt));
		if (sort === "updated") list.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
		return list;
	}, [repos, language, topic, sort]);

	const pristine = !language && !topic && sort === "featured";
	let bigIndex = 0;

	return (
		<>
			<div className="filters" role="group" aria-label={t.language}>
				<div className="chips">
					<button type="button" className="fchip" aria-pressed={!language} onClick={() => setLanguage(null)}>{t.all}<span className="n">{repos.length}</span></button>
					{languages.map((l) => (
						<button key={l.name} type="button" className="fchip" aria-pressed={language === l.name} onClick={() => setLanguage(language === l.name ? null : l.name)}>
							<i className="dot" style={{ "--c": l.color }} />{l.name}<span className="n">{l.n}</span>
						</button>
					))}
				</div>
				<div className="selects">
					{topics.length > 0 && (
						<div className="select">
							<label className="sr-only" htmlFor="topic">{t.topic}</label>
							<select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
								<option value="">{t.anyTopic}</option>
								{topics.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
							</select>
						</div>
					)}
					<div className="select">
						<label className="sr-only" htmlFor="sort">{t.sort}</label>
						<select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
							<option value="featured">{t.sortFeatured}</option>
							<option value="updated">{t.sortUpdated}</option>
							<option value="stars">{t.sortStars}</option>
						</select>
					</div>
				</div>
			</div>
			<p className="count" aria-live="polite" style={{ marginBottom: 14 }}>{t.count(filtered.length, repos.length)}</p>
			{filtered.length ? (
				<div className="bento">
					{filtered.map((r) => {
						const big = r.featured && (pristine || sort === "featured");
						let variant = "";
						if (big && pristine) {
							variant = bigIndex === 0 ? "hero-card" : bigIndex === 1 ? "tall" : "";
							bigIndex++;
						}
						return <ProjectCard key={r.name} repo={r} lang={lang} size={big ? "big" : "compact"} variant={variant} priority={variant === "hero-card"} />;
					})}
				</div>
			) : (
				<div className="empty">
					<p style={{ margin: "0 0 14px" }}>{t.empty}</p>
					<button type="button" className="btn small" onClick={() => { setLanguage(null); setTopic(""); setSort("featured"); }}>{t.reset}</button>
				</div>
			)}
		</>
	);
}
