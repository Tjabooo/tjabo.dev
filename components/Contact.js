import ContactForm from "./ContactForm";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import { config } from "@/lib/config";
import { dict } from "@/lib/i18n";

export default function Contact({ lang }) {
	const t = dict(lang).contact;
	const c = config.contact;
	const handle = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
	return (
		<section className="section" id="contact" aria-labelledby="contact-title">
			<div className="wrap">
				<div className="contact-grid">
					<div>
						<p className="kicker" data-reveal><span className="hexdot" />{t.kicker}</p>
						<h2 className="h2" id="contact-title" data-reveal>{t.title}</h2>
						<p className="lede" data-reveal>{t.sub}</p>
						<div className="links" data-reveal>
							<span className="mono-label" style={{ marginBottom: 4 }}>{t.elsewhere}</span>
							<a className="link-row" href={c.github} target="_blank" rel="me noopener"><Icon name="github" /><span className="lbl">GitHub</span><span className="val">{handle(c.github)}</span></a>
							<a className="link-row" href={c.linkedin} target="_blank" rel="me noopener"><Icon name="linkedin" /><span className="lbl">LinkedIn</span><span className="val">linkedin.com/in/oliver</span></a>
							{c.instagram ? <a className="link-row" href={c.instagram} target="_blank" rel="me noopener"><Icon name="instagram" /><span className="lbl">Instagram</span><span className="val">{handle(c.instagram).replace("instagram.com/", "@")}</span></a> : null}
							{c.discord ? (
								<CopyButton className="link-row" text={c.discord} done={dict(lang).project.copied}>
									<Icon name="discord" /><span className="lbl">{t.discord}</span><span className="val">{c.discord}</span>
								</CopyButton>
							) : null}
							{c.email ? <a className="link-row" href={`mailto:${c.email}`}><Icon name="mail" /><span className="lbl">{t.email}</span><span className="val">{c.email}</span></a> : null}
						</div>
					</div>
					<ContactForm lang={lang} />
				</div>
			</div>
		</section>
	);
}
