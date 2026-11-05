import { handleContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

export async function POST(request) {
	return handleContact(request);
}
