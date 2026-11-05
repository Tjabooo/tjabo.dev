import Icon from "./Icon";
import TimeAgo from "./TimeAgo";
import { Clock, HeroShader } from "./HeroIslands";
import { config } from "@/lib/config";
import { dict } from "@/lib/i18n";

export default function Hero({ lang, data }) {
	const t = dict(lang).hero;
	const lastPush = data.repos.reduce((m, r) => (r.pushedAt > m ? r.pushedAt : m), "");
	const resume = lang === "sv" ? "/sv-resume.pdf" : "/en-resume.pdf";
	return (
		<section className="hero" aria-labelledby="hero-title">
			<div className="hero-bg" />
			<HeroShader />
			<div className="hero-hex hexgrid" />
			<div className="hero-fade" />
			<div className="hud" aria-hidden="true">
				<i /><i /><i /><i />
				<div className="hud-top">
					<span className="live">sys · online</span>
					<span>59.33°N 18.07°E</span>
				</div>
				<div className="hud-side"><span>EMBER/HUD</span><span>TJABO.DEV</span><span>v2</span></div>
			</div>
			<div className="wrap hero-content">
				<div className="hero-kicker">
					<span className="mono-label"><b>●</b> {config.name.toLowerCase()} · {t.kicker}</span>
				</div>
				<h1 className="hero-name" id="hero-title" aria-label={`tjabo, ${config.name}`}>
					<span className="letters" aria-hidden="true">
						{"tjabo".split("").map((ch, i) => <span key={i} className="l" style={{ "--i": i }}>{ch}</span>)}
					</span>
					<span className="cursor" aria-hidden="true" />
				</h1>
				<p className="hero-tagline"><span className="prompt" aria-hidden="true">❯</span><span>{t.tagline}</span></p>
				<p className="hero-sub">{t.sub}</p>
				<div className="ctas">
					<a className="btn primary" href="#projects" data-magnetic>{t.ctaProjects}<Icon name="arrowDown" size={16} /></a>
					<a className="btn" href={config.contact.github} target="_blank" rel="me noopener" data-magnetic><Icon name="github" size={16} />{t.ctaGithub}</a>
					<a className="btn" href={resume} target="_blank" rel="noopener" data-magnetic><Icon name="file" size={16} />{t.ctaResume}</a>
					<a className="btn" href="#contact" data-magnetic><Icon name="chat" size={16} />{t.ctaContact}</a>
				</div>
				<dl className="readouts">
					<div className="readout">
						<dt>{t.synced}</dt>
						<dd><span className="ok">●</span> {data.fetchedAt ? <TimeAgo date={data.fetchedAt} lang={lang} /> : "—"}</dd>
					</div>
					<div className="readout"><dt>{t.repos}</dt><dd style={{ display: "flex", alignItems: "center", gap: 6 }}>{data.totals.repos} · <Icon name="star" size={13} label="stars" />{data.totals.stars}</dd></div>
					<div className="readout"><dt>{t.lastPush}</dt><dd>{lastPush ? <TimeAgo date={lastPush} lang={lang} /> : "—"}</dd></div>
					<div className="readout"><dt>{t.local} · sthlm</dt><dd><Clock /></dd></div>
				</dl>
			</div>
		</section>
	);
}
