"use client";
import { useEffect, useState } from "react";
import { ago, formatDate } from "@/lib/i18n";

/** Server renders a fixed date (cache-safe), the browser swaps in "3 hours ago" and keeps it fresh. */
export default function TimeAgo({ date, lang }) {
	const [text, setText] = useState(() => formatDate(date, lang));
	useEffect(() => {
		const tick = () => setText(ago(date, lang));
		tick();
		const id = setInterval(tick, 60_000);
		return () => clearInterval(id);
	}, [date, lang]);
	if (!date) return null;
	return <time dateTime={date} title={formatDate(date, lang, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning>{text}</time>;
}
