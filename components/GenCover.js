// Deterministic cover art for repos without a screenshot. The repo name seeds one of four
// HUD-style plates (isotherms, flow field, hex heat map, radar), so each project looks different
// but the same name always draws the same picture. `bare` drops <text> for the OG renderer.

function seeded(str) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
	return () => {
		h = Math.imul(h ^ (h >>> 15), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		return ((h ^= h >>> 16) >>> 0) / 4294967296;
	};
}

const W = 640, H = 340;
const r0 = (n) => Math.round(n);

function isotherms(rnd, cx, cy, accent) {
	const ph = rnd() * 6.28, amp = 10 + rnd() * 16, f1 = 0.008 + rnd() * 0.01;
	const out = [];
	for (let k = 0; k < 11; k++) {
		const r = 30 + k * (19 + rnd() * 6);
		let d = "";
		for (let a = 0; a < 40; a++) {
			const th = (a / 40) * Math.PI * 2;
			const rr = r + Math.sin(th * 3 + ph + k * 0.4) * amp * (k / 10) + Math.sin(th * 5 - ph) * amp * 0.35 + Math.sin(cx * f1 + th * 2) * k * 1.2;
			d += `${a ? "L" : "M"}${r0(cx + Math.cos(th) * rr * 1.45)} ${r0(cy + Math.sin(th) * rr)}`;
		}
		const major = k % 4 === 0;
		out.push(<path key={k} d={`${d}Z`} fill="none" stroke={major ? accent : "#7a675a"} strokeOpacity={major ? 0.8 - k * 0.05 : 0.34 - k * 0.018} strokeWidth={major ? 1.3 : 0.8} />);
	}
	return out;
}

function flow(rnd, cx, cy, accent) {
	const f = 0.01 + rnd() * 0.008, ph = rnd() * 6.28, out = [];
	for (let i = 0; i < 22; i++) {
		const y0 = 8 + i * 15;
		let d = "";
		for (let x = -20; x <= W + 20; x += 32) {
			const pull = Math.exp(-((x - cx) ** 2) / 26000) * (cy - y0) * 0.35;
			d += `${x < 0 ? "M" : "L"}${x} ${r0(y0 + Math.sin(x * f + ph + i * 0.35) * 10 + pull)}`;
		}
		const hot = Math.abs(y0 - cy) < 34;
		out.push(<path key={i} d={d} fill="none" stroke={hot ? accent : "#7a675a"} strokeOpacity={hot ? 0.75 : 0.28} strokeWidth={hot ? 1.4 : 0.8} />);
	}
	for (let i = 0; i < 26; i++) {
		const x = cx + (rnd() - 0.5) * 260, y = cy - rnd() * 150;
		out.push(<circle key={`e${i}`} cx={r0(x)} cy={r0(y)} r={(0.8 + rnd() * 2).toFixed(1)} fill={rnd() > 0.5 ? accent : "#f5a524"} opacity={(0.3 + rnd() * 0.6).toFixed(2)} />);
	}
	return out;
}

function hexes(rnd, cx, cy, accent) {
	const s = 17, w = s * Math.sqrt(3), out = [];
	for (let row = -1; row < H / (s * 1.5) + 1; row++) {
		for (let col = -1; col < W / w + 1; col++) {
			const x = col * w + (row % 2 ? w / 2 : 0), y = row * s * 1.5;
			const dist = Math.hypot((x - cx) / 1.3, y - cy);
			const heat = Math.max(0, 1 - dist / 210) ** 1.6 * (0.55 + rnd() * 0.6);
			const d = `M${r0(x)} ${r0(y - s + 2)}l${r0(w / 2 - 2)} ${r0(s / 2 - 1)}v${r0(s - 2)}l${-r0(w / 2 - 2)} ${r0(s / 2 - 1)}l${-r0(w / 2 - 2)} ${-r0(s / 2 - 1)}v${-r0(s - 2)}z`;
			out.push(<path key={`${row}-${col}`} d={d} fill={heat > 0.08 ? accent : "none"} fillOpacity={Math.min(0.85, heat).toFixed(2)} stroke="#3a2c22" strokeWidth="1" />);
		}
	}
	return out;
}

function radar(rnd, cx, cy, accent) {
	const out = [];
	for (let k = 1; k <= 6; k++) out.push(<circle key={k} cx={r0(cx)} cy={r0(cy)} r={k * 34} fill="none" stroke={k === 3 ? accent : "#7a675a"} strokeOpacity={k === 3 ? 0.6 : 0.3} strokeWidth={k === 3 ? 1.2 : 0.8} />);
	out.push(<path key="x" d={`M${r0(cx - 230)} ${r0(cy)}H${r0(cx + 230)}M${r0(cx)} ${r0(cy - 220)}V${r0(cy + 220)}`} stroke="#7a675a" strokeOpacity=".35" strokeDasharray="2 5" />);
	const a = rnd() * Math.PI * 2, b = a + 0.9;
	out.push(<path key="sweep" d={`M${r0(cx)} ${r0(cy)}L${r0(cx + Math.cos(a) * 204)} ${r0(cy + Math.sin(a) * 204)}A204 204 0 0 1 ${r0(cx + Math.cos(b) * 204)} ${r0(cy + Math.sin(b) * 204)}Z`} fill={accent} fillOpacity=".16" stroke={accent} strokeOpacity=".7" />);
	for (let i = 0; i < 9; i++) {
		const t = rnd() * Math.PI * 2, d = 30 + rnd() * 170;
		out.push(<circle key={`b${i}`} cx={r0(cx + Math.cos(t) * d)} cy={r0(cy + Math.sin(t) * d)} r={i < 3 ? 3 : 1.8} fill={i < 3 ? accent : "#f5a524"} opacity={i < 3 ? 1 : 0.6} />);
	}
	return out;
}

const STYLES = [["isotherm", isotherms], ["flow", flow], ["hexfield", hexes], ["radar", radar]];

export default function GenCover({ name, accent = "#ff8c1a", label, bare = false, variant = -1 }) {
	const rnd = seeded(name);
	const pick = Math.floor(rnd() * STYLES.length);
	const [styleName, style] = STYLES[variant >= 0 ? variant % STYLES.length : pick];
	const cx = 150 + rnd() * 340, cy = 110 + rnd() * 130;
	const id = `g-${name.replace(/[^a-z0-9]/gi, "")}`;
	const hx = (x, y, s) => `M${r0(x)} ${r0(y - s)}L${r0(x + s * 0.866)} ${r0(y - s / 2)}V${r0(y + s / 2)}L${r0(x)} ${r0(y + s)}L${r0(x - s * 0.866)} ${r0(y + s / 2)}V${r0(y - s / 2)}Z`;
	const labelRight = cx + 160 < W - 20;
	return (
		<svg viewBox={`0 0 ${W} ${H}`} width={bare ? 760 : undefined} height={bare ? 630 : undefined} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || `${name} cover`}>
			<defs>
				<radialGradient id={id} cx={cx / W} cy={cy / H} r="0.6">
					<stop offset="0" stopColor={accent} stopOpacity=".34" />
					<stop offset=".4" stopColor="#ff4d1f" stopOpacity=".1" />
					<stop offset="1" stopColor="#120d0a" stopOpacity="0" />
				</radialGradient>
			</defs>
			<rect width={W} height={H} fill="#140f0b" />
			<rect width={W} height={H} fill={`url(#${id})`} />
			{style(rnd, cx, cy, accent)}
			<path d={hx(cx, cy, 11)} fill="#140f0b" stroke={accent} strokeWidth="1.6" />
			<circle cx={r0(cx)} cy={r0(cy)} r="2.6" fill={accent} />
			<path d={labelRight ? `M${r0(cx + 15)} ${r0(cy)}H${r0(cx + 70)}` : `M${r0(cx - 15)} ${r0(cy)}H${r0(cx - 70)}`} stroke={accent} strokeOpacity=".7" strokeDasharray="3 3" />
			{bare ? null : <text x={r0(labelRight ? cx + 78 : cx - 78)} y={r0(cy + 4)} fill="#d8cbbf" fontFamily="var(--font-mono), monospace" fontSize="12" textAnchor={labelRight ? "start" : "end"}>~/{name}</text>}
			{bare ? null : <text x="16" y={H - 14} fill="#b2a397" fontFamily="var(--font-mono), monospace" fontSize="10" letterSpacing="2" opacity=".75">{`${styleName.toUpperCase()} · ${(59.2 + rnd() * 0.3).toFixed(2)}N ${(17.9 + rnd() * 0.3).toFixed(2)}E`}</text>}
		</svg>
	);
}
