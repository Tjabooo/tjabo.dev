import Icon from "./Icon";
import TimeAgo from "./TimeAgo";
import Heatmap from "./Heatmap";
import { dict } from "@/lib/i18n";

export default function Activity({ lang, data }) {
	const t = dict(lang).activity;
	const { totals, calendar, activity } = data;
	const lastPush = data.repos.reduce((m, r) => (r.pushedAt > m ? r.pushedAt : m), "");
	const langTotal = totals.languages.reduce((n, l) => n + l.count, 0) || 1;
	const repoHref = (name) => `${lang === "sv" ? "/sv" : ""}/projects/${encodeURIComponent(name)}`;
	return (
		<section className="section" id="activity" aria-labelledby="activity-title">
			<div className="wrap">
				<div className="section-head">
					<p className="kicker" data-reveal><span className="hexdot" />{t.kicker}</p>
					<h2 className="h2" id="activity-title" data-reveal>{t.title}</h2>
					<p className="lede" data-reveal>{t.sub}</p>
				</div>
				<div className="activity-grid">
					<div style={{ display: "grid", gap: 14, minWidth: 0, alignContent: "start" }}>
						{calendar ? (
							<div className="panel" data-reveal>
								<div className="panel-head">
									<h3 className="panel-title">{t.contributions(calendar.total)}</h3>
									<div className="legend" aria-hidden="true">
										{t.less}
										{[0, 1, 2, 3, 4].map((l) => <i key={l} className={`l${l}`} style={{ background: ["#231a14", "#4a2412", "#8f3914", "#e0621a", "#ffa23a"][l] }} />)}
										{t.more}
									</div>
								</div>
								<div className="heat-scroll" tabIndex={0} aria-label={t.contributions(calendar.total)}>
									<Heatmap weeks={calendar.weeks.map((w) => w.map((d) => [d.date, d.count, d.level]))} total={calendar.total} lang={lang} />
								</div>
							</div>
						) : null}
						<div className="stats" data-reveal>
							<div className="stat"><b>{totals.repos}</b><span>{t.repos}</span></div>
							<div className="stat"><b>{totals.stars}</b><span>{t.stars}</span></div>
							<div className="stat"><b>{totals.languages.length}</b><span>{t.languages}</span></div>
							<div className="stat"><b style={{ fontSize: "clamp(1.2rem, 2.6vw, 1.6rem)", lineHeight: 1.6 }}>{lastPush ? <TimeAgo date={lastPush} lang={lang} /> : "—"}</b><span>{t.lastPush}</span></div>
						</div>
						{totals.languages.length ? (
							<div className="panel" data-reveal>
								<div className="panel-head"><h3 className="panel-title">{t.byRepo}</h3></div>
								<div className="langbar" aria-hidden="true">
									{totals.languages.map((l) => <span key={l.name} style={{ "--c": l.color, flex: l.count / langTotal }} />)}
								</div>
								<ul className="langs">
									{totals.languages.map((l) => <li key={l.name}><i className="dot" style={{ "--c": l.color }} />{l.name.toLowerCase()} <span className="n">{l.count}</span></li>)}
								</ul>
							</div>
						) : null}
					</div>
					<div className="panel" data-reveal style={{ "--d": 1 }}>
						<div className="panel-head"><h3 className="panel-title">{t.latest}</h3><span className="mono-label">live · github</span></div>
						{activity.length ? (
							<ol className="feed">
								{activity.slice(0, 10).map((a) => (
									<li key={`${a.type}-${a.repo}-${a.ref}`} className={a.type}>
										<span className="ico" aria-hidden="true"><Icon name={a.type === "release" ? "tag" : "commit"} size={12} /></span>
										<div style={{ minWidth: 0 }}>
											<a className="msg" href={a.url} target="_blank" rel="noopener">{a.type === "release" ? `${a.repo} ${a.title}` : a.title}</a>
											<div className="sub">
												<a href={repoHref(a.repo)}>{a.repo}</a>
												<span className="ref">{a.type === "release" ? t.release : t.commit} {a.ref}</span>
												<TimeAgo date={a.date} lang={lang} />
											</div>
										</div>
									</li>
								))}
							</ol>
						) : <p className="muted">{t.none}</p>}
					</div>
				</div>
			</div>
		</section>
	);
}
