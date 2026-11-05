export function setMotion(on) {
	const v = on ? "on" : "off";
	document.documentElement.dataset.motion = v;
	try {
		localStorage.setItem("tjabo:motion", v);
	} catch {
		/* private mode: still applies for this visit */
	}
}
