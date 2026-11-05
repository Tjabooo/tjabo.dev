"use client";
import { useEffect, useRef } from "react";

// Hand-written WebGL2: a thermal flow field (domain-warped noise drawn as glowing isotherms)
// plus a few hundred embers rising through it. The cursor is a heat source, scrolling speeds the
// updraft. Rendered at a reduced internal resolution and scaled up, paused when off-screen or the
// tab is hidden, a single still frame when motion is off. ?perf in the URL logs GPU frame time.

const QUAD_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FIELD_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHeat;
uniform float uScroll;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
const mat2 R = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p) {
	float v = 0.0, a = 0.5;
	for (int i = 0; i < 4; i++) { v += a * noise(p); p = R * p; a *= 0.5; }
	return v;
}

void main() {
	float aspect = uRes.x / uRes.y;
	vec2 uv = vUv;
	vec2 p = vec2(uv.x * aspect, uv.y);
	vec2 m = vec2(uMouse.x * aspect, uMouse.y);
	float t = uTime * 0.05;

	// cursor heat: a soft bump that bends the field and shimmers
	vec2 dm = p - m;
	float heat = exp(-dot(dm, dm) * 7.0) * uHeat;

	vec2 q = p * 1.35 + vec2(0.0, -t * 2.2 - uScroll * 0.9);
	vec2 w = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, 1.3) - t * 0.7));
	q += (w - 0.5) * 1.6;
	q += dm * heat * 0.9 + vec2(0.0, sin(uTime * 3.0 + p.x * 40.0) * 0.004 * heat);
	float f = fbm(q * 1.25 + vec2(t * 0.4, -t * 1.6));

	// heat rises from the bottom edge
	float base = smoothstep(1.15, -0.15, uv.y + (f - 0.5) * 0.45);
	float h = clamp(base * base * 1.15 + heat * 0.55, 0.0, 1.0);

	// isotherms: thin glowing contour lines of the field
	float v = f * 11.0 + base * 3.0;
	float d = abs(fract(v) - 0.5) / max(fwidth(v), 1e-3);
	float line = 1.0 - smoothstep(0.0, 1.6, d);
	float major = 1.0 - smoothstep(0.0, 2.2, abs(fract(v / 4.0) - 0.5) / max(fwidth(v / 4.0), 1e-3));

	vec3 bg = vec3(0.071, 0.051, 0.039);
	vec3 deep = vec3(0.24, 0.07, 0.025);
	vec3 ember = vec3(1.0, 0.302, 0.122);
	vec3 orange = vec3(1.0, 0.549, 0.102);
	vec3 gold = vec3(0.961, 0.647, 0.141);

	vec3 col = mix(bg, deep, h * 0.85);
	col += ember * smoothstep(0.5, 1.0, f) * h * 0.35;
	col += mix(ember, orange, h) * line * (0.05 + h * 0.5);
	col += gold * major * h * h * 0.35;
	col += orange * heat * 0.08;
	// keep the top-left (where the text sits) calm
	col = mix(col, bg, smoothstep(0.35, 1.0, uv.y) * smoothstep(0.75, 0.0, uv.x) * 0.55);
	float vig = 1.0 - 0.45 * length((uv - vec2(0.55, 0.4)) * vec2(1.0, 1.2));
	outColor = vec4(col * vig, 1.0);
}`;

const EMBER_VS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uPx;
out float vAlpha;
out float vHot;
float h(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
void main() {
	float id = float(gl_VertexID);
	float speed = mix(0.035, 0.12, h(id + 1.7));
	float life = fract(uTime * speed * (1.0 + uScroll * 0.8) + h(id + 3.1));
	float x = h(id + 7.3);
	float y = -0.05 + life * 1.1;
	x += sin(uTime * mix(0.5, 1.4, h(id + 9.1)) + id) * 0.018 * life + sin(y * 6.0 + id) * 0.01;
	float aspect = uRes.x / uRes.y;
	vec2 dm = vec2((x - uMouse.x) * aspect, y - uMouse.y);
	float r = length(dm);
	vec2 push = (dm / max(r, 1e-3)) * 0.05 * exp(-r * r * 30.0);
	x += push.x / aspect;
	y += push.y + 0.03 * exp(-r * r * 12.0);
	gl_Position = vec4(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
	float big = pow(h(id + 5.5), 6.0);
	gl_PointSize = (1.2 + big * 4.5) * uPx * (1.0 - life * 0.5);
	vHot = h(id + 2.2);
	vAlpha = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life)) * mix(0.35, 1.0, h(id + 4.4));
}`;

const EMBER_FS = `#version 300 es
precision mediump float;
in float vAlpha;
in float vHot;
out vec4 outColor;
void main() {
	float d = length(gl_PointCoord - 0.5);
	float a = smoothstep(0.5, 0.0, d);
	vec3 c = mix(vec3(1.0, 0.302, 0.122), vec3(1.0, 0.78, 0.35), vHot);
	outColor = vec4(c * a * vAlpha, a * vAlpha);
}`;

function compile(gl, vs, fs) {
	const prog = gl.createProgram();
	for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
		const sh = gl.createShader(type);
		gl.shaderSource(sh, src);
		gl.compileShader(sh);
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
		gl.attachShader(prog, sh);
	}
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
	return prog;
}

/** Software renderers, tiny devices and data-saver get the static gradient instead. */
function weakDevice(gl) {
	const dbg = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
	if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(renderer)) return true;
	if (navigator.connection?.saveData) return true;
	if ((navigator.deviceMemory || 8) < 2 || (navigator.hardwareConcurrency || 8) < 3) return true;
	return false;
}

export default function HeroCanvas() {
	const ref = useRef(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const perf = /[?&]perf\b/.test(location.search);
		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true, preserveDrawingBuffer: false });
		if (!gl || (!perf && weakDevice(gl))) return;

		let field, embers;
		try {
			field = compile(gl, QUAD_VS, FIELD_FS);
			embers = compile(gl, EMBER_VS, EMBER_FS);
		} catch (error) {
			console.warn("[hero] shader:", error);
			return;
		}
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		const aPos = gl.getAttribLocation(field, "aPos");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
		const emptyVao = gl.createVertexArray();
		const U = (prog, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)]));
		const fu = U(field, ["uRes", "uTime", "uMouse", "uHeat", "uScroll"]);
		const eu = U(embers, ["uRes", "uTime", "uMouse", "uScroll", "uPx"]);

		const coarse = matchMedia("(pointer: coarse)").matches;
		const count = coarse ? 140 : 320;
		// Internal pixel budget: ~0.55 MP on desktop (≈1000×560 at 1440p), ~0.2 MP on phones.
		let budget = coarse ? 200_000 : 560_000;
		let scale = 1;
		const resize = () => {
			const w = canvas.clientWidth, hgt = canvas.clientHeight;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			scale = Math.min(dpr, Math.sqrt(budget / Math.max(1, w * hgt)));
			canvas.width = Math.max(1, Math.round(w * scale));
			canvas.height = Math.max(1, Math.round(hgt * scale));
		};
		resize();

		const mouse = { x: 0.72, y: 0.3, tx: 0.72, ty: 0.3, heat: 0, theat: 0 };
		let scroll = 0;
		const onMove = (e) => {
			const r = canvas.getBoundingClientRect();
			mouse.tx = (e.clientX - r.left) / r.width;
			mouse.ty = 1 - (e.clientY - r.top) / r.height;
			mouse.theat = 1;
		};
		const onLeave = () => { mouse.theat = 0; };
		const onScroll = () => { scroll = Math.min(1.5, window.scrollY / Math.max(1, window.innerHeight)); };

		const t0 = performance.now() - 40_000 * Math.random();
		let raf = 0, visible = true, running = false, last = performance.now();
		let slow = 0, samples = [], frames = 0;

		const draw = (now) => {
			const time = (now - t0) / 1000;
			const k = Math.min(1, (now - last) / 140);
			mouse.x += (mouse.tx - mouse.x) * k;
			mouse.y += (mouse.ty - mouse.y) * k;
			mouse.heat += (mouse.theat - mouse.heat) * k * 0.5;
			const t1 = perf ? performance.now() : 0;
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.disable(gl.BLEND);
			gl.useProgram(field);
			gl.bindVertexArray(vao);
			gl.uniform2f(fu.uRes, canvas.width, canvas.height);
			gl.uniform1f(fu.uTime, time);
			gl.uniform2f(fu.uMouse, mouse.x, mouse.y);
			gl.uniform1f(fu.uHeat, mouse.heat);
			gl.uniform1f(fu.uScroll, scroll);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE);
			gl.useProgram(embers);
			gl.bindVertexArray(emptyVao);
			gl.uniform2f(eu.uRes, canvas.width, canvas.height);
			gl.uniform1f(eu.uTime, time);
			gl.uniform2f(eu.uMouse, mouse.x, mouse.y);
			gl.uniform1f(eu.uScroll, scroll);
			gl.uniform1f(eu.uPx, scale * 1.4);
			gl.drawArrays(gl.POINTS, 0, count);
			if (perf) {
				gl.finish();
				samples.push(performance.now() - t1);
				if (samples.length === 120) {
					const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
					const msg = `[hero] ${canvas.width}×${canvas.height} internal, ${avg.toFixed(2)} ms/frame (gl.finish), ${count} embers`;
					console.info(msg);
					document.documentElement.dataset.shaderMs = avg.toFixed(2);
					samples = [];
				}
			}
		};

		const loop = (now) => {
			raf = 0;
			const dt = now - last;
			// Adaptive: if frames keep arriving slowly, lower the resolution; give up at the floor.
			if (++frames > 30 && dt > 26) {
				if (++slow > 45) {
					slow = 0;
					if (budget > 120_000) { budget *= 0.6; resize(); }
					else { running = false; draw(now); return; }
				}
			} else if (slow > 0) slow--;
			draw(now);
			last = now;
			if (running) raf = requestAnimationFrame(loop);
		};

		const motionOn = () => document.documentElement.dataset.motion !== "off";
		const start = () => {
			if (running || !visible || document.hidden || !motionOn()) return;
			running = true;
			last = performance.now();
			raf = requestAnimationFrame(loop);
		};
		const stop = () => {
			running = false;
			cancelAnimationFrame(raf);
			raf = 0;
		};
		const still = () => { stop(); draw(performance.now()); };

		draw(performance.now());
		canvas.classList.add("live");

		const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
		io.observe(canvas);
		const onVis = () => (document.hidden ? stop() : start());
		const mo = new MutationObserver(() => (motionOn() ? start() : still()));
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
		const ro = new ResizeObserver(() => { resize(); if (!running) draw(performance.now()); });
		ro.observe(canvas);
		window.addEventListener("pointermove", onMove, { passive: true });
		document.documentElement.addEventListener("pointerleave", onLeave);
		window.addEventListener("scroll", onScroll, { passive: true });
		document.addEventListener("visibilitychange", onVis);
		const onLost = (e) => { e.preventDefault(); stop(); canvas.classList.remove("live"); };
		canvas.addEventListener("webglcontextlost", onLost);
		start();

		return () => {
			stop();
			io.disconnect();
			mo.disconnect();
			ro.disconnect();
			window.removeEventListener("pointermove", onMove);
			document.documentElement.removeEventListener("pointerleave", onLeave);
			window.removeEventListener("scroll", onScroll);
			document.removeEventListener("visibilitychange", onVis);
			canvas.removeEventListener("webglcontextlost", onLost);
		};
	}, []);

	return <canvas ref={ref} aria-hidden="true" />;
}
