/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	// deploy.ps1 builds into a staging folder; the running site keeps serving the last good build.
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
