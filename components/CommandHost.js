"use client";
import { useCallback, useEffect, useState } from "react";

// Keyboard entry points. The palette and the terminal are separate chunks, fetched on first use.
//   Ctrl/⌘ K → palette   ` (backtick) → terminal   also: the nav/dock buttons fire "tjabo:palette"
export default function CommandHost(props) {
	const [open, setOpen] = useState(null); // "palette" | "terminal" | null
	const [mods, setMods] = useState({});

	const load = useCallback(async (which) => {
		if (which === "palette" && !mods.Palette) {
			const m = await import("./Palette");
			setMods((s) => ({ ...s, Palette: m.default }));
		}
		if (which === "terminal" && !mods.Terminal) {
			const m = await import("./Terminal");
			setMods((s) => ({ ...s, Terminal: m.default }));
		}
		setOpen(which);
	}, [mods]);

	useEffect(() => {
		const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
		const onKey = (e) => {
			if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey) && !e.altKey) {
				e.preventDefault();
				open === "palette" ? setOpen(null) : load("palette");
			} else if (e.key === "`" && !open && !typing(document.activeElement) && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				load("terminal");
			}
		};
		const onPalette = () => load("palette");
		const onTerminal = () => load("terminal");
		window.addEventListener("keydown", onKey);
		window.addEventListener("tjabo:palette", onPalette);
		window.addEventListener("tjabo:terminal", onTerminal);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("tjabo:palette", onPalette);
			window.removeEventListener("tjabo:terminal", onTerminal);
		};
	}, [load, open]);

	// Warm the palette chunk when the browser is idle, so the first ⌘K feels instant.
	useEffect(() => {
		const id = window.requestIdleCallback ? requestIdleCallback(() => import("./Palette"), { timeout: 4000 }) : setTimeout(() => import("./Palette"), 2500);
		return () => (window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));
	}, []);

	const close = useCallback(() => setOpen(null), []);
	const { Palette, Terminal } = mods;
	if (open === "palette" && Palette) return <Palette {...props} onClose={close} onTerminal={() => load("terminal")} />;
	if (open === "terminal" && Terminal) return <Terminal {...props} onClose={close} />;
	return null;
}
