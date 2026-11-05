import Link from "next/link";
import Image from "next/image";
import GenCover from "./GenCover";
import Icon from "./Icon";
import TimeAgo from "./TimeAgo";
import { dict } from "@/lib/i18n";

export default function ProjectCard({ repo, lang, size = "compact", variant = "", priority = false }) {
	const t = dict(lang);
	const href = `${lang === "sv" ? "/sv" : ""}/projects/${encodeURIComponent(repo.name)}`;
	const big = size === "big";
	const style = repo.accent ? { "--accent": repo.accent } : undefined;
	return (
		<article className={`card card-${size}${variant ? ` ${variant}` : ""}`} style={style} data-tilt>
			{big && (
				<div className="card-cover">
					{repo.cover ? (
						<Image src={repo.cover} alt={t.project.cover(repo.name)} fill sizes="(min-width: 1000px) 60vw, 100vw" priority={priority} unoptimized={/\.(gif|svg)(\?|$)/i.test(repo.cover)} />
					) : (
						<GenCover name={repo.name} accent={repo.accent || "#ff8c1a"} variant={repo.rank} label={`${repo.name}: generated cover`} />
					)}
				</div>
			)}
			<div className="card-body">
				<div className="card-top">
					<h3 className="card-name">{repo.name}</h3>
					{big && repo.featured ? <span className="badge-feat">{t.projects.featured}</span> : <Icon name="external" size={16} className="arrow-go" />}
				</div>
				{repo.tagline && big ? <p className="card-tagline">{repo.tagline}</p> : null}
				<p className="card-desc">{big && repo.tagline ? repo.description : repo.tagline || repo.description}</p>
				{big && repo.topics.length ? (
					<div className="topics">{repo.topics.slice(0, 4).map((tp) => <span key={tp} className="chip">{tp}</span>)}</div>
				) : null}
				<div className="card-meta">
					{repo.language ? <span><i className="dot" style={{ "--c": repo.language.color }} />{repo.language.name}</span> : null}
					<span><Icon name="star" size={13} />{repo.stars}</span>
					{repo.release ? <span><Icon name="tag" size={13} />{repo.release}</span> : null}
					{repo.ci ? <span title={t.project.ci[repo.ci]}><i className={`ci ${repo.ci}`} /><span className="sr-only">{t.project.ci[repo.ci]}</span></span> : null}
					<span><TimeAgo date={repo.pushedAt} lang={lang} /></span>
				</div>
			</div>
			<Link className="card-link" href={href} aria-label={`${repo.name}: ${t.projects.open}`} />
		</article>
	);
}
