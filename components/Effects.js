"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const motionOn = () => document.documentElement.dataset.motion !== "off";

/**
 * Page-wide motion, all event-delegated so it costs nothing when idle:
 *  [data-reveal]   fades/rises in when scrolled into view
 *  [data-magnetic] buttons lean toward the cursor
 *  .card[data-tilt] cards tilt and their glow follows the cursor
 */
export default function Effects() {
	const pathname = usePathname();

	useEffect(() => {
		const els = document.querySelectorAll("[data-reveal]:not(.in)");
		if (!("IntersectionObserver" in window)) {
			els.forEach((el) => el.classList.add("in"));
			return;
		}
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					e.target.classList.add("in");
					io.unobserve(e.target);
				}
			}
		}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, [pathname]);

	useEffect(() => {
		const fine = matchMedia("(hover: hover) and (pointer: fine)");
		let raf = 0;
		let last = null;
		let magnet = null;
		let card = null;

		const reset = (el) => {
			if (!el) return;
			el.style.removeProperty("--rx");
			el.style.removeProperty("--ry");
			el.style.removeProperty("transform");
		};

		const frame = () => {
			raf = 0;
			const e = last;
			if (!e) return;
			if (magnet) {
				const r = magnet.getBoundingClientRect();
				const dx = e.clientX - (r.left + r.width / 2);
				const dy = e.clientY - (r.top + r.height / 2);
				magnet.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
			}
			if (card) {
				const r = card.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width;
				const py = (e.clientY - r.top) / r.height;
				card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
				card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
				const k = card.classList.contains("card-big") ? 3 : 5;
				card.style.setProperty("--rx", `${((0.5 - py) * k).toFixed(2)}deg`);
				card.style.setProperty("--ry", `${((px - 0.5) * k).toFixed(2)}deg`);
			}
		};

		const onMove = (e) => {
			if (!fine.matches || !motionOn()) return;
			const t = e.target instanceof Element ? e.target : null;
			const m = t?.closest("[data-magnetic]") || null;
			const c = t?.closest(".card[data-tilt]") || null;
			if (m !== magnet) { if (magnet) magnet.style.transform = ""; magnet = m; }
			if (c !== card) { reset(card); card = c; }
			last = e;
			if ((magnet || card) && !raf) raf = requestAnimationFrame(frame);
		};
		const onLeave = () => {
			if (magnet) magnet.style.transform = "";
			reset(card);
			magnet = card = null;
		};

		document.addEventListener("pointermove", onMove, { passive: true });
		document.documentElement.addEventListener("pointerleave", onLeave);
		return () => {
			document.removeEventListener("pointermove", onMove);
			document.documentElement.removeEventListener("pointerleave", onLeave);
			cancelAnimationFrame(raf);
		};
	}, []);

	return null;
}
