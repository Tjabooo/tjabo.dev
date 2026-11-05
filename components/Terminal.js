"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { setMotion } from "./motion";
import { useDialog } from "./useDialog";
import { ago } from "@/lib/i18n";

// The hidden terminal: ` (backtick) anywhere, or "Open terminal" in the ⌘K menu.

const LOGO = [
	"     ▄▀▀▀▀▄     ",
	"   ▄▀  ▄  ▀▄    ",
	"  █   ▐█▌   █   ",
	"  █  ▐███▌  █   ",
	"  █  ▀███▀  █   ",
	"   ▀▄  ▀  ▄▀    ",
	"     ▀▄▄▄▄▀     ",
];

const span = (cls, text) => ({ cls, text });

export default function Terminal({ lang, items, totals, contact, onClose }) {
	const ref = useDialog(onClose);
	const router = useRouter();
	const pathname = usePathname();
	const input = useRef(null);
	const out = useRef(null);
	const [value, setValue] = useState("");
	const [history, setHistory] = useState([]);
	const [hi, setHi] = useState(-1);
	const [lines, setLines] = useState(() => [
		[span("c-o", "tjabo.dev"), span("", " terminal. Type "), span("c-g", "help"), span("", " to see what it can do.")],
		[span("c-s", lang === "sv" ? "(kommandona är på engelska, som en riktig terminal)" : "esc or exit to leave")],
	]);
	const names = items.map((r) => r.name);
	const find = (n) => items.find((r) => r.name.toLowerCase() === String(n || "").toLowerCase());
	const base = lang === "sv" ? "/sv" : "";

	useEffect(() => { input.current?.focus(); }, []);
	useEffect(() => { out.current?.scrollTo(0, out.current.scrollHeight); }, [lines]);

	const print = (...rows) => setLines((l) => [...l, ...rows]);

	const COMMANDS = {
		help: () => [
			["help", "this list"], ["ls projects", "every public repo"], ["cat <repo>", "details for one repo"], ["open <repo>", "go to its page"],
			["neofetch", "about this machine"], ["whoami", "who runs this"], ["stats", "github totals"], ["lang en|sv", "switch language"],
			["motion on|off", "toggle animations"], ["github", "open my github"], ["clear", "clear the screen"], ["exit", "close the terminal"],
		].map(([c, d]) => [span("c-g", c.padEnd(16)), span("c-s", d)]),
		ls: (args) => {
			if (args[0] && !/^projects\/?$/.test(args[0])) return [[span("c-r", `ls: ${args[0]}: no such directory (try: ls projects)`)]];
			return items.map((r) => [span("c-o", r.name.padEnd(22)), span("c-s", `${(r.language || "—").padEnd(12)} *${String(r.stars).padEnd(3)} `), span("", (r.description || "").slice(0, 60))]);
		},
		cat: (args) => {
			const r = find(args[0]);
			if (!args[0]) return [[span("c-r", "cat: which repo? try: cat marquee")]];
			if (!r) return [[span("c-r", `cat: ${args[0]}: no such repo`)]];
			return [
				[span("c-o", `# ${r.name}`)],
				[span("", r.description || "(no description)")],
				[span("c-s", "language  "), span("", r.language || "—")],
				[span("c-s", "stars     "), span("", String(r.stars))],
				[span("c-s", "release   "), span("", r.release || "none")],
				[span("c-s", "license   "), span("", r.license || "—")],
				[span("c-s", "topics    "), span("", r.topics.join(", ") || "—")],
				[span("c-s", "pushed    "), span("", ago(r.pushedAt, "en"))],
				[span("c-s", "repo      "), { link: r.url }],
				[span("c-s", `→ open ${r.name}`)],
			];
		},
		open: (args) => {
			const r = find(args[0]);
			if (!r) return [[span("c-r", `open: ${args[0] || "?"}: no such repo`)]];
			onClose();
			router.push(`${base}/projects/${encodeURIComponent(r.name)}`);
			return [];
		},
		neofetch: () => {
			const info = [
				[span("c-o", "oliver"), span("", "@"), span("c-o", "tjabo.dev")],
				[span("c-s", "─────────────────")],
				[span("c-g", "os       "), span("", "Arch Linux x86_64")],
				[span("c-g", "wm       "), span("", "Hyprland (ember rice)")],
				[span("c-g", "shell    "), span("", "zsh + oh-my-posh")],
				[span("c-g", "term     "), span("", "alacritty")],
				[span("c-g", "cpu      "), span("", "Ryzen 7 9800X3D")],
				[span("c-g", "gpu      "), span("", "Radeon RX 9070 XT")],
				[span("c-g", "location "), span("", "Stockholm, SE")],
				[span("c-g", "repos    "), span("", `${totals.repos} public · ${totals.stars} stars`)],
				[span("c-g", "langs    "), span("", totals.languages.slice(0, 4).map((l) => l.name.toLowerCase()).join(", "))],
			];
			const rows = Math.max(LOGO.length, info.length);
			return Array.from({ length: rows }, (_, i) => [span("c-o", (LOGO[i] || "").padEnd(16)), ...(info[i] || [])]);
		},
		whoami: () => [[span("", "oliver (tjabo): self-taught developer from stockholm, kth ict dropout.")], [span("c-s", "i build the tools i use every day.")]],
		stats: () => [
			[span("c-g", "repos  "), span("", String(totals.repos))],
			[span("c-g", "stars  "), span("", String(totals.stars))],
			...totals.languages.map((l) => [span("c-g", `${l.name.toLowerCase().padEnd(11)}`), span("c-o", "█".repeat(l.count)), span("c-s", ` ${l.count}`)]),
		],
		lang: (args) => {
			const to = args[0];
			if (to !== "en" && to !== "sv") return [[span("c-r", "usage: lang en|sv")]];
			const rest = (pathname || "/").replace(/^\/(en|sv)(?=\/|$)/, "") || "/";
			onClose();
			router.push(to === "sv" ? (rest === "/" ? "/sv" : `/sv${rest}`) : rest);
			return [];
		},
		motion: (args) => {
			if (args[0] !== "on" && args[0] !== "off") return [[span("c-r", "usage: motion on|off")]];
			setMotion(args[0] === "on");
			return [[span("c-s", `motion ${args[0]}`)]];
		},
		github: () => { window.open(contact.github, "_blank", "noopener"); return [[span("c-s", "opening github…")]]; },
		clear: () => { setLines([]); return null; },
		exit: () => { onClose(); return null; },
		sudo: () => [[span("c-r", "oliver is not in the sudoers file. This incident will be reported.")]],
		rm: () => [[span("c-r", "rm: nice try")]],
		pwd: () => [[span("", `/home/guest${(pathname || "/").replace(/^\/(en|sv)/, "")}`)]],
		echo: (args) => [[span("", args.join(" "))]],
		date: () => [[span("", new Date().toLocaleString("en-GB", { timeZone: "Europe/Stockholm" }) + " (Stockholm)")]],
	};

	const run = (raw) => {
		const cmdline = raw.trim();
		print([span("c-o", "guest@tjabo.dev"), span("c-s", ":~$ "), span("", cmdline)]);
		if (!cmdline) return;
		setHistory((h) => [cmdline, ...h].slice(0, 50));
		const [cmd, ...args] = cmdline.split(/\s+/);
		const fn = COMMANDS[cmd.toLowerCase()];
		if (!fn) return print([span("c-r", `${cmd}: command not found. try `), span("c-g", "help")]);
		const res = fn(args);
		if (res) print(...res);
	};

	const complete = () => {
		const parts = value.split(/\s+/);
		if (parts.length === 1) {
			const m = Object.keys(COMMANDS).filter((c) => c.startsWith(parts[0]));
			if (m.length === 1) setValue(`${m[0]} `);
			else if (m.length) print([span("c-s", m.join("  "))]);
		} else {
			const last = parts[parts.length - 1].toLowerCase();
			const pool = parts[0] === "ls" ? ["projects"] : names;
			const m = pool.filter((n) => n.toLowerCase().startsWith(last));
			if (m.length === 1) setValue([...parts.slice(0, -1), m[0]].join(" "));
			else if (m.length) print([span("c-s", m.join("  "))]);
		}
	};

	const onKeyDown = (e) => {
		if (e.key === "Enter") { e.preventDefault(); run(value); setValue(""); setHi(-1); }
		else if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); complete(); }
		else if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(history.length - 1, hi + 1); if (n >= 0) { setHi(n); setValue(history[n]); } }
		else if (e.key === "ArrowDown") { e.preventDefault(); const n = hi - 1; setHi(n); setValue(n >= 0 ? history[n] : ""); }
		else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); }
	};

	return (
		<div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			<div className="term" role="dialog" aria-modal="true" aria-label="Terminal" ref={ref} onMouseUp={() => { if (!window.getSelection()?.toString()) input.current?.focus(); }}>
				<div className="term-bar">
					<i /><i /><i />
					<span>guest@tjabo.dev: ~</span>
					<button type="button" onClick={onClose} aria-label="Close terminal"><Icon name="close" size={16} /></button>
				</div>
				<div className="term-out" ref={out} role="log" aria-live="polite">
					{lines.map((row, i) => (
						<div key={i}>{row.map((s, j) => (s.link ? <a key={j} href={s.link} target="_blank" rel="noopener">{s.link}</a> : <span key={j} className={s.cls || undefined}>{s.text}</span>))}</div>
					))}
				</div>
				<div className="term-line">
					<label htmlFor="term-in">guest@tjabo.dev:~$</label>
					<input id="term-in" ref={input} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKeyDown}
						autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go" />
				</div>
			</div>
		</div>
	);
}
