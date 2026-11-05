"use client";
import { useState } from "react";
import Icon from "./Icon";
import { dict } from "@/lib/i18n";

const LIMITS = { name: 100, email: 100, subject: 300, message: 1500 };

export default function ContactForm({ lang }) {
	const t = dict(lang).contact;
	const [state, setState] = useState({ status: "idle", text: "" });
	const [len, setLen] = useState(0);

	async function onSubmit(e) {
		e.preventDefault();
		const form = e.currentTarget;
		const body = Object.fromEntries(new FormData(form));
		setState({ status: "sending", text: t.sending });
		try {
			const res = await fetch("/api/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			const json = await res.json().catch(() => ({}));
			if (res.ok) {
				form.reset();
				setLen(0);
				setState({ status: "ok", text: t.sent });
				return;
			}
			const err = t.errors[json.error];
			setState({ status: "err", text: typeof err === "function" ? err(json.retryAfterSeconds || 300) : err || t.errors.generic });
		} catch {
			setState({ status: "err", text: t.errors.generic });
		}
	}

	return (
		<form className="form" onSubmit={onSubmit} noValidate={false} data-reveal style={{ "--d": 1 }}>
			<div className="field">
				<label htmlFor="cf-name">{t.name}</label>
				<input id="cf-name" name="name" autoComplete="name" required maxLength={LIMITS.name} />
			</div>
			<div className="field">
				<label htmlFor="cf-email">{t.email}</label>
				<input id="cf-email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={LIMITS.email} />
			</div>
			<div className="field full">
				<label htmlFor="cf-subject">{t.subject}</label>
				<input id="cf-subject" name="subject" required maxLength={LIMITS.subject} />
			</div>
			<div className="field full">
				<label htmlFor="cf-message">{t.message}</label>
				<textarea id="cf-message" name="message" required maxLength={LIMITS.message} onInput={(e) => setLen(e.currentTarget.value.length)} aria-describedby="cf-count" />
				<span className="counter" id="cf-count">{len}/{LIMITS.message}</span>
			</div>
			<div className="hp" aria-hidden="true">
				<label htmlFor="cf-website">Website</label>
				<input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
			</div>
			<div className="form-foot full">
				<button className="btn primary" type="submit" disabled={state.status === "sending"} data-magnetic>
					{state.status === "sending" ? t.sending : t.send}<Icon name="arrow" size={16} />
				</button>
				<p className={`status${state.status === "ok" ? " ok" : state.status === "err" ? " err" : ""}`} role="status" aria-live="polite">{state.status === "sending" ? "" : state.text}</p>
			</div>
		</form>
	);
}
