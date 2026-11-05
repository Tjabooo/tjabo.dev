"use client";
import { useEffect, useRef } from "react";

/** Modal basics: Escape closes, Tab stays inside, focus returns to where it was, page doesn't scroll. */
export function useDialog(onClose) {
	const ref = useRef(null);
	useEffect(() => {
		const prev = document.activeElement;
		const html = document.documentElement;
		const overflow = html.style.overflow;
		html.style.overflow = "hidden";
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			} else if (e.key === "Tab" && ref.current) {
				const f = [...ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
				if (!f.length) return;
				const first = f[0], last = f[f.length - 1];
				if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
				else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
			}
		};
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			html.style.overflow = overflow;
			if (prev && prev.focus) prev.focus({ preventScroll: true });
		};
	}, [onClose]);
	return ref;
}
