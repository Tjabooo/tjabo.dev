import { dict } from "@/lib/i18n";

const SWATCHES = ["#120d0a", "#1b1410", "#3a2c22", "#7a675a", "#b2a397", "#d8cbbf", "#ff4d1f", "#ff8c1a", "#f5a524", "#e5484d"];

export default function About({ lang, totals }) {
	const t = dict(lang).about;
	const stack = totals.languages.slice(0, 6).map((l) => l.name.toLowerCase()).join(", ") || "python, javascript, c";
	const rows = [
		[t.spec.user, "oliver@tjabo"],
		[t.spec.based, t.spec.basedValue],
		[t.spec.status, t.spec.statusValue],
		[t.spec.os, t.spec.osValue],
		[t.spec.focus, t.spec.focusValue],
		[t.spec.stack, stack],
		[t.spec.rig, "ryzen 7 9800x3d · rx 9070 xt"],
	];
	return (
		<section className="section" id="about" aria-labelledby="about-title">
			<div className="wrap">
				<div className="section-head">
					<p className="kicker" data-reveal><span className="hexdot" />{t.kicker}</p>
					<h2 className="h2" id="about-title" data-reveal>{t.title}</h2>
				</div>
				<div className="about-grid">
					<div className="about-copy">
						<p data-reveal>{t.p1}</p>
						<p data-reveal style={{ "--d": 1 }}>{t.p2}</p>
						<p data-reveal style={{ "--d": 2 }}>{t.p3}</p>
					</div>
					<div className="spec" data-reveal style={{ "--d": 1 }}>
						<div className="spec-bar" aria-hidden="true"><i /><i /><i /><span>~ ❯ neofetch</span></div>
						<div className="spec-body">
							<div className="hexgrid" style={{ position: "absolute", inset: 0, opacity: 0.4, maskImage: "linear-gradient(to left, #000, transparent 70%)" }} />
							<dl>
								{rows.map(([k, v]) => (
									<div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>
								))}
							</dl>
							<div className="swatches" aria-hidden="true">
								{SWATCHES.map((c) => <span key={c} style={{ "--c": c }} />)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
