import path from "node:path";
import { fileURLToPath } from "node:url";

// Each release folder is its own project root (deploy.ps1 builds inside the git checkout's releases\).
const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
	outputFileTracingRoot: root,
	turbopack: { root },
	reactStrictMode: true,
	poweredByHeader: false,
	// Build output folder (override with NEXT_DIST_DIR, e.g. for side-by-side test builds).
	distDir: process.env.NEXT_DIST_DIR || ".next",
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{ protocol: "https", hostname: "raw.githubusercontent.com" },
			{ protocol: "https", hostname: "github.com", pathname: "/user-attachments/**" },
			{ protocol: "https", hostname: "user-images.githubusercontent.com" },
		],
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
				],
			},
			{
				source: "/.well-known/discord",
				headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
			},
		];
	},
};

export default nextConfig;
