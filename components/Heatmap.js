"use client";
// Client component only so the page payload carries compact [date, count, level] tuples, not 370 SVG nodes twice.
import { dict, formatDate } from "@/lib/i18n";

export default function Heatmap({ weeks: compact, total, lang }) {
	const t = dict(lang).activity;
	const cell = 11, gap = 3, step = cell + gap, top = 18, left = 26;
	const weeks = compact.map((w) => w.map(([date, count, level]) => ({ date, count, level })));
	const W = left + weeks.length * step, H = top + 7 * step;
	const months = [];
	let prev = -1;
	weeks.forEach((w, i) => {
		const d = new Date(`${w[0].date}T00:00:00Z`);
		if (d.getUTCMonth() !== prev && d.getUTCDate() <= 7) {
			months.push({ x: left + i * step, label: new Intl.DateTimeFormat(lang === "sv" ? "sv-SE" : "en-GB", { month: "short", timeZone: "UTC" }).format(d) });
			prev = d.getUTCMonth();
		}
	});
	const dayNames = lang === "sv" ? ["", "mån", "", "ons", "", "fre", ""] : ["", "Mon", "", "Wed", "", "Fri", ""];
	return (
		<svg className="heat" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.contributions(total)}>
			{months.map((m) => <text key={m.x} x={m.x} y={10}>{m.label}</text>)}
			{dayNames.map((d, i) => (d ? <text key={i} x={0} y={top + i * step + 9}>{d}</text> : null))}
			{weeks.map((w, i) => w.map((d) => {
				const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
				return (
					<rect key={d.date} x={left + i * step} y={top + dow * step} width={cell} height={cell} className={`l${d.level}`}>
						<title>{t.day(d.count, formatDate(d.date, lang, { day: "numeric", month: "short", year: "numeric" }))}</title>
					</rect>
				);
			}))}
		</svg>
	);
}
