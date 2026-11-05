"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Logo from "./Logo";
import { dict } from "@/lib/i18n";

const SECTIONS = ["about", "projects", "activity", "contact"];

/** Strip the language prefix (works for both the browser path and the rewritten /en path). */
function splitPath(pathname) {
	const m = (pathname || "/").match(/^\/(en|sv)(?=\/|$)(.*)$/);
	return m ? m[2] || "/" : pathname || "/";
}

export function openPalette() {
	window.dispatchEvent(new CustomEvent("tjabo:palette"));
}

export default function Nav({ lang }) {
	const t = dict(lang);
	const rest = splitPath(usePathname());
	const isHome = rest === "/";
	const home = lang === "sv" ? "/sv" : "/";
	const other = lang === "sv" ? (rest === "/" ? "/" : rest) : rest === "/" ? "/sv" : `/sv${rest}`;
	const [active, setActive] = useState(isHome ? "home" : rest.startsWith("/projects") ? "projects" : null);
	const [scrolled, setScrolled] = useState(false);
	const [mac, setMac] = useState(false);

	useEffect(() => {
		setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!isHome) {
			setActive(rest.startsWith("/projects") ? "projects" : null);
			return;
		}
		const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
		const seen = new Map();
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
			const best = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
			setActive(best && best[1] > 0 ? best[0] : "home");
		}, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01, 0.5, 1] });
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, [isHome, rest]);

	const href = (id) => (id === "home" ? home : `${home}#${id}`);

	return (
		<>
			<header className={`nav${scrolled || !isHome ? " scrolled" : ""}`}>
				<div className="wrap nav-inner">
					<Link href={home} className="logo" aria-label="tjabo, home">
						<Logo className="logo-mark" />
						<span>tjabo<span className="cur">_</span></span>
					</Link>
					<nav className="nav-links" aria-label="Main">
						{SECTIONS.map((id) => (
							<Link key={id} href={href(id)} aria-current={active === id ? "true" : undefined}>{t.nav[id]}</Link>
						))}
					</nav>
					<div className="nav-tools">
						<Link className="icon-btn" href={other} hrefLang={lang === "sv" ? "en" : "sv"} lang={lang === "sv" ? "en" : "sv"} aria-label={t.nav.lang}>
							{t.nav.langShort}
						</Link>
						<button type="button" className="icon-btn" onClick={openPalette} aria-label={t.nav.menu} aria-keyshortcuts="Control+K Meta+K">
							<Icon name="command" size={16} />
							<span className="k-hint"><kbd>{mac ? "⌘" : "Ctrl"} K</kbd></span>
						</button>
					</div>
				</div>
			</header>
			<nav className="dock" aria-label="Quick">
				<Link href={home} aria-current={active === "home" ? "true" : undefined}><Icon name="home" />{t.nav.home}</Link>
				<Link href={href("projects")} aria-current={active === "projects" ? "true" : undefined}><Icon name="grid" />{t.nav.projects}</Link>
				<button type="button" className="dock-cmd" onClick={openPalette} aria-label={t.nav.menu}><Icon name="command" />{lang === "sv" ? "meny" : "menu"}</button>
				<Link href={href("activity")} aria-current={active === "activity" ? "true" : undefined}><Icon name="pulse" />{t.nav.activity}</Link>
				<Link href={href("contact")} aria-current={active === "contact" ? "true" : undefined}><Icon name="chat" />{t.nav.contact}</Link>
			</nav>
		</>
	);
}
