import { config } from "@/lib/config";
import { dict } from "@/lib/i18n";
import TimeAgo from "./TimeAgo";

export default function Footer({ lang, fetchedAt }) {
	const t = dict(lang);
	return (
		<footer className="footer">
			<div className="wrap">
				<p className="footer-big" aria-hidden="true">tjabo_</p>
				<div className="footer-row">
					<span>© {new Date().getFullYear()} {config.name} · {t.footer.built}</span>
					<span>
						{t.footer.synced}: {fetchedAt ? <TimeAgo date={fetchedAt} lang={lang} /> : t.footer.never}
					</span>
					<span>
						<kbd>Ctrl</kbd> <kbd>K</kbd> {t.footer.palette} · <kbd>`</kbd> {t.footer.terminal}
					</span>
					<span>
						<a href={config.contact.github} rel="me noopener" target="_blank">GitHub</a> · <a href="/feed.xml">RSS</a> · <a href={`https://github.com/${config.owner}/tjabo.dev`} target="_blank" rel="noopener">source</a>
					</span>
				</div>
			</div>
		</footer>
	);
}
