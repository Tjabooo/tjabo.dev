"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { copyText } from "./CopyButton";
import { useDialog } from "./useDialog";
import { setMotion } from "./motion";
import { dict } from "@/lib/i18n";

/** Subsequence match; higher is better, -1 = no match. Rewards word starts and contiguous runs. */
export function score(query, text) {
	if (!query) return 0;
	const q = query.toLowerCase(), s = text.toLowerCase();
	const idx = s.indexOf(q);
	if (idx >= 0) return 100 - idx + (idx === 0 || /[\s/·-]/.test(s[idx - 1]) ? 50 : 0);
	let i = 0, run = 0, total = 0;
	for (let j = 0; j < s.length && i < q.length; j++) {
		if (s[j] === q[i]) { i++; run++; total += run; } else run = 0;
	}
	return i === q.length ? total : -1;
}

export default function Palette({ lang, items, contact, onClose, onTerminal }) {
	const t = dict(lang).palette;
	const router = useRouter();
	const pathname = usePathname();
	const ref = useDialog(onClose);
	const input = useRef(null);
	const [q, setQ] = useState("");
	const [sel, setSel] = useState(0);
	const [toast, setToast] = useState("");
	const motionOn = typeof document !== "undefined" && document.documentElement.dataset.motion !== "off";

	const base = lang === "sv" ? "/sv" : "";
	const rest = (pathname || "/").replace(/^\/(en|sv)(?=\/|$)/, "") || "/";
	const go = (path) => { onClose(); router.push(path); };
	const goSection = (id) => {
		onClose();
		if (rest === "/") document.getElementById(id)?.scrollIntoView({ behavior: motionOn ? "smooth" : "auto" });
		else router.push(`${base || "/"}#${id}`);
	};
	const flash = (msg) => { setToast(msg); setTimeout(onClose, 900); };

	const commands = useMemo(() => {
		const nav = [
			{ id: "home", group: t.navigate, label: t.goHome, icon: "home", run: () => go(base || "/") },
			{ id: "projects", group: t.navigate, label: t.goProjects, icon: "grid", run: () => goSection("projects") },
			{ id: "activity", group: t.navigate, label: t.goActivity, icon: "pulse", run: () => goSection("activity") },
			{ id: "about", group: t.navigate, label: t.goAbout, icon: "user", run: () => goSection("about") },
			{ id: "contact", group: t.navigate, label: t.goContact, icon: "chat", run: () => goSection("contact") },
		];
		const projects = items.map((r) => ({
			id: `p-${r.name}`, group: t.projects, label: r.name, desc: r.description, icon: "arrow", keywords: `${r.language || ""} ${r.topics.join(" ")}`,
			run: () => go(`${base}/projects/${encodeURIComponent(r.name)}`),
		}));
		const actions = [
			{ id: "github", group: t.actions, label: t.github, icon: "github", run: () => { onClose(); window.open(contact.github, "_blank", "noopener"); } },
			{ id: "resume", group: t.actions, label: t.resume, icon: "file", run: () => { onClose(); window.open(lang === "sv" ? "/sv-resume.pdf" : "/en-resume.pdf", "_blank", "noopener"); } },
			{ id: "lang", group: t.actions, label: t.lang, icon: "lang", keywords: "language språk svenska english", run: () => go(lang === "sv" ? rest : rest === "/" ? "/sv" : `/sv${rest}`) },
			contact.email
				? { id: "email", group: t.actions, label: t.email, desc: contact.email, icon: "mail", keywords: "mail", run: async () => { await copyText(contact.email); flash(t.copied); } }
				: null,
			contact.discord
				? { id: "discord", group: t.actions, label: t.discord, desc: contact.discord, icon: "discord", keywords: "copy contact", run: async () => { await copyText(contact.discord); flash(t.copied); } }
				: null,
			{ id: "motion", group: t.actions, label: motionOn ? t.motionOff : t.motionOn, icon: "motion", keywords: "animation reduce", run: () => { setMotion(!motionOn); onClose(); } },
			{ id: "terminal", group: t.actions, label: t.terminal, icon: "terminal", keywords: "shell console cli", run: () => onTerminal() },
		].filter(Boolean);
		return [...nav, ...projects, ...actions];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items, lang, rest, motionOn]);

	const results = useMemo(() => {
		if (!q.trim()) return commands;
		return commands
			.map((c) => ({ c, s: Math.max(score(q.trim(), c.label), score(q.trim(), `${c.keywords || ""} ${c.desc || ""}`) - 40) }))
			.filter((x) => x.s >= 0)
			.sort((a, b) => b.s - a.s)
			.map((x) => x.c);
	}, [q, commands]);

	useEffect(() => { input.current?.focus(); }, []);
	useEffect(() => { setSel(0); }, [q]);
	useEffect(() => {
		ref.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
	}, [sel, ref]);

	const onKeyDown = (e) => {
		if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
		else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
		else if (e.key === "Home") { setSel(0); }
		else if (e.key === "End") { setSel(results.length - 1); }
		else if (e.key === "Enter") { e.preventDefault(); results[sel]?.run(); }
	};

	let lastGroup = null;
	return (
		<div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			<div className="palette" role="dialog" aria-modal="true" aria-label={t.label} ref={ref}>
				<div className="palette-input">
					<span className="p" aria-hidden="true">❯</span>
					<input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} placeholder={t.placeholder}
						role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
						aria-activedescendant={results[sel] ? `cmd-${results[sel].id}` : undefined} spellCheck={false} autoComplete="off" />
					<kbd>esc</kbd>
				</div>
				<div className="palette-list" id="palette-list" role="listbox" aria-label={t.label}>
					{results.length === 0 ? <p className="palette-group" style={{ textTransform: "none", letterSpacing: 0 }}>{t.none}</p> : null}
					{results.map((c, i) => {
						const header = !q.trim() && c.group !== lastGroup ? <div className="palette-group" role="presentation" key={`g-${c.group}`}>{c.group}</div> : null;
						lastGroup = c.group;
						return [
							header,
							<button key={c.id} id={`cmd-${c.id}`} data-i={i} type="button" role="option" aria-selected={i === sel} className="palette-item" tabIndex={-1}
								onMouseMove={() => setSel(i)} onClick={() => c.run()}>
								<Icon name={c.icon} size={16} />
								<span>{c.label}</span>
								{c.desc ? <span className="desc">{c.desc}</span> : null}
							</button>,
						];
					})}
				</div>
				<div className="palette-foot"><span>{t.hint}</span><span>tjabo.dev</span></div>
			</div>
			{toast ? <div className="toast" role="status">{toast}</div> : null}
		</div>
	);
}
