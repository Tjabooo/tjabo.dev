import { NextResponse } from "next/server";

// English lives at the root (/, /projects/x), Swedish under /sv. Internally every page sits
// under app/[lang], so root paths are rewritten to /en/... and /en/... redirects to the root.
export function proxy(request) {
	const { pathname, search } = request.nextUrl;
	if (pathname === "/sv" || pathname.startsWith("/sv/")) return NextResponse.next();
	if (pathname === "/en" || pathname.startsWith("/en/")) {
		// Generated OG images are addressed by their internal path; serve them as is.
		if (/\/(opengraph|twitter)-image/.test(pathname)) return NextResponse.next();
		const url = request.nextUrl.clone();
		url.pathname = pathname.slice(3) || "/";
		return NextResponse.redirect(url, 308);
	}
	const url = request.nextUrl.clone();
	url.pathname = `/en${pathname === "/" ? "" : pathname}`;
	url.search = search;
	return NextResponse.rewrite(url);
}

export const config = {
	// Everything except API routes, Next internals, /.well-known and real files (repo names may contain dots).
	matcher: ["/((?!api/|_next/|\\.well-known/|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|pdf|txt|xml|json|webmanifest|woff2?|ttf|js|css|map)$).*)"],
};
