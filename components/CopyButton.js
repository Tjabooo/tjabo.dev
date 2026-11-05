"use client";
import { useState } from "react";
import Icon from "./Icon";

export async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand("copy");
		ta.remove();
		return ok;
	}
}

export default function CopyButton({ text, label, done, className = "copy", children }) {
	const [copied, setCopied] = useState(false);
	return (
		<button type="button" className={className} onClick={async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 1600); } }} aria-label={children ? undefined : label}>
			{children}
			<Icon name={copied ? "check" : "copy"} size={14} />
			{children ? null : <span>{copied ? done : label}</span>}
			<span className="sr-only" role="status">{copied ? done : ""}</span>
		</button>
	);
}
