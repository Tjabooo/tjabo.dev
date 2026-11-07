import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import GenCover from "@/components/GenCover";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import ProjectCard from "@/components/ProjectCard";
import TimeAgo from "@/components/TimeAgo";
import { config, LANGS, SITE_URL, localePath } from "@/lib/config";
import { getPortfolio, getRepo } from "@/lib/github";
import { dict, formatDate } from "@/lib/i18n";
import { findInstall, readmeSummary, renderReadme } from "@/lib/readme";
import { cardData, localized, neighbours, relatedRepos } from "@/lib/view";

export const revalidate = 3600;
export const dynamicParams = true; // a repo created after the build still gets a page

export async function generateStaticParams() {
	const data = await getPortfolio();
	return data.repos.map((r) => ({ repo: r.name }));
}

export async function generateMetadata({ params }) {
	const { lang, repo: name } = await params;
	const repo = await getRepo(decodeURIComponent(name));
	if (!repo) return { title: "404" };
	const { description, tagline } = localized(repo, lang);
	const path = `/projects/${encodeURIComponent(repo.name)}`;
	const desc = tagline ? `${tagline} ${description}` : description || readmeSummary(repo.readme);
	return {
		title: repo.name,
		description: desc,
		alternates: {
			canonical: localePath(lang, path),
			languages: { en: path, sv: `/sv${path}`, "x-default": path },
		},
		openGraph: { type: "article", title: `${repo.name} · tjabo`, description: desc, url: localePath(lang, path) },
		twitter: { card: "summary_large_image", title: `${repo.name} · tjabo`, description: desc },
	};
}

function installSnippet(repo) {
	if (repo.install) return repo.install;
	const fromReadme = findInstall(repo.readme);
	if (fromReadme) return fromReadme.code;
	const lines = [`git clone ${repo.url}.git`, `cd ${repo.name}`];
	if (repo.release) lines.push(`# or grab ${repo.release.tag}:`, `gh release download ${repo.release.tag} -R ${repo.owner}/${repo.name}`);
	return lines.join("\n");
}

export default async function ProjectPage({ params }) {
	const { lang, repo: name } = await params;
	if (!LANGS.includes(lang)) notFound();
	const data = await getPortfolio();
	const repo = data.repos.find((r) => r.name.toLowerCase() === decodeURIComponent(name).toLowerCase());
	if (!repo) notFound();

	const t = dict(lang);
	const p = t.project;
	const { description, tagline } = localized(repo, lang);
	const html = renderReadme(repo.readme, { owner: repo.owner, repo: repo.name, branch: repo.branch });
	const install = installSnippet(repo);
	const related = relatedRepos(repo, data.repos);
	const { prev, next } = neighbours(repo, data.repos);
	const base = lang === "sv" ? "/sv" : "";
	const style = { "--accent": repo.accent || "#ff8c1a" };
	// Without a token (REST fallback) CI status is unknown, not "none".
	const ciLabel = data.mode === "graphql" ? p.ci[repo.ci ?? "null"] : "—";
	const num = (n) => n.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
	const loc = repo.loc?.lines ? repo.loc : null;
	const locTitle = loc ? [p.locDetail(num(loc.lines), num(loc.files)), ...loc.languages.slice(0, 4).map((l) => `${l.name} ${num(l.lines)}`)].join("\n") : undefined;

	return (
		<main id="main" className="page" style={style}>
			<JsonLd data={{
				"@context": "https://schema.org",
				"@type": "SoftwareSourceCode",
				name: repo.name,
				description,
				codeRepository: repo.url,
				url: `${SITE_URL}${localePath(lang, `/projects/${encodeURIComponent(repo.name)}`)}`,
				programmingLanguage: repo.languages.map((l) => l.name),
				keywords: repo.topics.join(", ") || undefined,
				license: repo.license ? `https://spdx.org/licenses/${repo.license}.html` : undefined,
				dateModified: repo.pushedAt,
				dateCreated: repo.createdAt,
				version: repo.release?.tag,
				author: { "@type": "Person", name: config.name, url: SITE_URL },
			}} />
			<header className="proj-hero">
				<div className="hexgrid" />
				<div className="wrap">
					<nav className="crumbs" aria-label="Breadcrumb">
						<Link href={`${base || "/"}#projects`}><Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} />{p.back}</Link>
						<span aria-hidden="true">/</span>
						<span aria-current="page">{repo.name}</span>
					</nav>
					<h1 className="proj-title"><span className="tilde" aria-hidden="true">~/</span>{repo.name}</h1>
					{tagline ? <p className="proj-tagline">{tagline}</p> : null}
					<p className="proj-desc">{description}</p>
					<div className="ctas">
						<a className="btn primary" href={repo.url} target="_blank" rel="noopener" data-magnetic><Icon name="github" size={16} />{p.github}</a>
						{repo.homepage && !repo.homepage.startsWith(SITE_URL) ? (
							<a className="btn" href={repo.homepage} target="_blank" rel="noopener" data-magnetic><Icon name="globe" size={16} />{p.homepage}</a>
						) : null}
						{repo.release ? (
							<a className="btn" href={repo.release.url} target="_blank" rel="noopener" data-magnetic><Icon name="tag" size={16} />{repo.release.tag}</a>
						) : null}
					</div>
					<dl className="proj-stats">
						<div><dt>{p.stars}</dt><dd><Icon name="star" size={14} />{repo.stars}</dd></div>
						<div><dt>{p.forks}</dt><dd><Icon name="fork" size={14} />{repo.forks}</dd></div>
						<div title={locTitle}><dt>{p.loc}</dt><dd><Icon name="file" size={14} />{loc ? num(loc.lines) : "—"}</dd></div>
						<div><dt>{p.languages}</dt><dd>{repo.language ? <><i className="dot" style={{ "--c": repo.language.color }} />{repo.language.name}</> : "—"}</dd></div>
						<div><dt>{p.license}</dt><dd>{repo.license || "—"}</dd></div>
						<div><dt>{p.updated}</dt><dd><TimeAgo date={repo.pushedAt} lang={lang} /></dd></div>
						<div><dt>ci</dt><dd>{data.mode === "graphql" ? <i className={`ci ${repo.ci || ""}`} /> : null}{ciLabel}</dd></div>
					</dl>
				</div>
			</header>

			<div className="wrap">
				{/* A cover taken from the README would show twice; the README already has it. */}
				{repo.coverFromReadme ? null : <figure className="proj-cover" style={{ margin: "32px 0 0" }}>
					{repo.cover ? (
						<Image src={repo.cover} alt={p.cover(repo.name)} width={1600} height={900} sizes="(min-width: 1240px) 1180px, 100vw" style={{ width: "100%", height: "auto" }} priority unoptimized={/\.(gif|svg)(\?|$)/i.test(repo.cover)} />
					) : (
						<div style={{ aspectRatio: "16 / 5" }}><GenCover name={repo.name} accent={repo.accent || "#ff8c1a"} variant={repo.rank} label={`${repo.name}: generated cover`} /></div>
					)}
				</figure>}

				<div className="proj-layout">
					<article className="readme" aria-label={p.readme}>
						<div className="readme-bar"><Icon name="file" size={14} />README.md<span style={{ marginLeft: "auto" }}>{repo.branch}</span></div>
						{html ? <div className="md" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="md"><p className="muted">{p.noReadme}</p></div>}
					</article>

					<aside className="proj-aside">
						<section className="panel" aria-labelledby="install-h">
							<div className="panel-head"><h2 className="panel-title" id="install-h">{p.install}</h2><CopyButton text={install} label={p.copy} done={p.copied} /></div>
							<div className="snippet"><pre><code>{install}</code></pre></div>
						</section>
						{repo.languages.length ? (
							<section className="panel" aria-labelledby="lang-h">
								<div className="panel-head"><h2 className="panel-title" id="lang-h">{p.languages}</h2></div>
								<div className="langbar" aria-hidden="true">{repo.languages.map((l) => <span key={l.name} style={{ "--c": l.color, flex: Math.max(l.share, 0.02) }} />)}</div>
								<ul className="langs">{repo.languages.map((l) => <li key={l.name}><i className="dot" style={{ "--c": l.color }} />{l.name} <span className="n">{(l.share * 100).toFixed(l.share < 0.1 ? 1 : 0)}%</span></li>)}</ul>
							</section>
						) : null}
						{repo.topics.length ? (
							<section className="panel" aria-labelledby="topics-h">
								<div className="panel-head"><h2 className="panel-title" id="topics-h">{p.topics}</h2></div>
								<div className="topics">{repo.topics.map((tp) => <span key={tp} className="chip">{tp}</span>)}</div>
							</section>
						) : null}
						{repo.releases.length ? (
							<section className="panel" aria-labelledby="rel-h">
								<div className="panel-head"><h2 className="panel-title" id="rel-h">{p.releases}</h2></div>
								<ul className="list">{repo.releases.map((r) => <li key={r.tag}><a href={r.url} target="_blank" rel="noopener">{r.name}</a><small>{r.tag} · {formatDate(r.publishedAt, lang)}</small></li>)}</ul>
							</section>
						) : null}
						{repo.commits.length ? (
							<section className="panel" aria-labelledby="commits-h">
								<div className="panel-head"><h2 className="panel-title" id="commits-h">{p.commits}</h2></div>
								<ul className="list">{repo.commits.slice(0, 5).map((c) => <li key={c.sha}><a href={c.url} target="_blank" rel="noopener">{c.message}</a><small>{c.sha.slice(0, 7)} · <TimeAgo date={c.date} lang={lang} /></small></li>)}</ul>
							</section>
						) : null}
					</aside>
				</div>

				{related.length ? (
					<section className="section" aria-labelledby="related-h" style={{ paddingTop: 72 }}>
						<p className="kicker"><span className="hexdot" />{p.related}</p>
						<h2 className="sr-only" id="related-h">{p.related}</h2>
						<div className="related">{related.map((r) => <ProjectCard key={r.name} repo={cardData(r, lang)} lang={lang} />)}</div>
					</section>
				) : null}

				{prev && next ? (
					<nav className="pager" aria-label={`${p.prev} / ${p.next}`} style={{ marginTop: related.length ? 14 : 72 }}>
						<Link href={`${base}/projects/${encodeURIComponent(prev.name)}`} className="prev"><span className="mono-label">← {p.prev}</span><b>{prev.name}</b></Link>
						<Link href={`${base}/projects/${encodeURIComponent(next.name)}`} className="next"><span className="mono-label">{p.next} →</span><b>{next.name}</b></Link>
					</nav>
				) : null}
			</div>
		</main>
	);
}
