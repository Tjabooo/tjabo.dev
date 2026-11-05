"use client";
import { useEffect, useState } from "react";

/** Loads the shader chunk after first paint, so it never blocks the page. */
export function HeroShader() {
	const [Canvas, setCanvas] = useState(null);
	useEffect(() => {
		let cancelled = false;
		const load = () => import("./HeroCanvas").then((m) => { if (!cancelled) setCanvas(() => m.default); });
		const idle = window.requestIdleCallback ? requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 300);
		return () => {
			cancelled = true;
			window.cancelIdleCallback ? cancelIdleCallback(idle) : clearTimeout(idle);
		};
	}, []);
	return Canvas ? <Canvas /> : null;
}

/** Stockholm time, ticking. */
export function Clock() {
	const [now, setNow] = useState(null);
	useEffect(() => {
		const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Stockholm" });
		const tick = () => setNow(fmt.format(new Date()));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);
	return <span suppressHydrationWarning>{now || "--:--:--"}</span>;
}
