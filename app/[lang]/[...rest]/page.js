import { notFound } from "next/navigation";

// Anything under a language that no route matches → the themed 404 (inside the layout).
export default function CatchAll() {
	notFound();
}
