// Open Graph cards (1200×630) in the site's look, rendered on demand by next/og.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import GenCover from "@/components/GenCover";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts;
async function loadFonts() {
	const dir = path.join(process.cwd(), "assets", "og");
	fonts ??= Promise.all([
		readFile(path.join(dir, "ArchivoExpanded-Black.ttf")).then((data) => ({ name: "Archivo", data, weight: 900, style: "normal" })),
		readFile(path.join(dir, "JBM-Regular.ttf")).then((data) => ({ name: "JetBrains Mono", data, weight: 400, style: "normal" })),
		readFile(path.join(dir, "JBM-Bold.ttf")).then((data) => ({ name: "JetBrains Mono", data, weight: 700, style: "normal" })),
	]);
	return fonts;
}

const C = { bg: "#120d0a", panel: "#1b1410", line: "#3a2c22", fg: "#d8cbbf", sub: "#b2a397", orange: "#ff8c1a", gold: "#f5a524", ember: "#ff4d1f" };

export async function ogImage({ kicker, title, tagline, chips = [], accent = C.orange, seed = "tjabo" }) {
	const size = title.length > 14 ? 92 : title.length > 9 ? 120 : 150;
	return new ImageResponse(
		(
			<div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.bg, fontFamily: "JetBrains Mono", color: C.fg }}>
				<div style={{ position: "absolute", right: -40, top: 0, width: 760, height: 630, display: "flex", opacity: 0.95 }}>
					<GenCover name={seed} accent={accent} bare />
				</div>
				<div style={{ position: "absolute", inset: 0, display: "flex", background: `linear-gradient(90deg, ${C.bg} 38%, rgba(18,13,10,0.55) 70%, rgba(18,13,10,0.1))` }} />
				<div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 6, display: "flex", background: `linear-gradient(90deg, ${C.ember}, ${C.orange}, ${C.gold})` }} />
				<div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 60px", width: "100%" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, fontWeight: 700 }}>
						<div style={{ width: 34, height: 38, background: accent, display: "flex", clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }} />
						<span>tjabo.dev</span>
						<span style={{ color: C.sub, fontWeight: 400 }}>{kicker}</span>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div style={{ display: "flex", fontFamily: "Archivo", fontSize: size, lineHeight: 0.9, letterSpacing: -4, color: accent }}>{title}</div>
						{tagline ? <div style={{ display: "flex", marginTop: 26, fontSize: 32, lineHeight: 1.3, maxWidth: 820, color: C.fg }}>{tagline}</div> : null}
					</div>
					<div style={{ display: "flex", gap: 14, fontSize: 22, color: C.sub }}>
						{chips.filter(Boolean).map((c) => (
							<div key={c} style={{ display: "flex", padding: "10px 18px", border: `1.5px solid ${C.line}`, borderRadius: 999, background: "rgba(27,20,16,0.85)" }}>{c}</div>
						))}
					</div>
				</div>
			</div>
		),
		{ ...OG_SIZE, fonts: await loadFonts() },
	);
}
