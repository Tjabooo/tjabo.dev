import { revalidatePath } from "next/cache";
import { refreshPortfolio } from "@/lib/github";
import { REFRESH_EVENTS, verifySignature } from "@/lib/webhook";

export const dynamic = "force-dynamic";

// GitHub webhook: push / release / repo changes → refetch now and drop every cached page.
export async function POST(request) {
	const secret = process.env.GITHUB_WEBHOOK_SECRET;
	if (!secret) return Response.json({ error: "webhook not configured" }, { status: 503 });
	const body = await request.text();
	if (!verifySignature(secret, body, request.headers.get("x-hub-signature-256"))) {
		return Response.json({ error: "bad signature" }, { status: 401 });
	}
	const event = request.headers.get("x-github-event") || "";
	if (event === "ping") return Response.json({ ok: true, pong: true });
	if (!REFRESH_EVENTS.has(event)) return Response.json({ ok: true, ignored: event });
	try {
		const data = await refreshPortfolio();
		revalidatePath("/", "layout");
		return Response.json({ ok: true, event, repos: data.repos.length, fetchedAt: data.fetchedAt });
	} catch (error) {
		console.error("[webhook] refresh failed:", error.message);
		return Response.json({ ok: false, error: "refresh failed" }, { status: 502 });
	}
}
