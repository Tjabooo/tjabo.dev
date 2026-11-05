// The mark: a hexagon cell with a rising ember, the same shape as the favicon.
export default function Logo({ className, size = 26 }) {
	return (
		<svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id="lg-ember" x1="0" y1="1" x2="0" y2="0">
					<stop offset="0" stopColor="#ff4d1f" />
					<stop offset=".55" stopColor="#ff8c1a" />
					<stop offset="1" stopColor="#f5a524" />
				</linearGradient>
			</defs>
			<path d="M16 1.8 28.3 8.9v14.2L16 30.2 3.7 23.1V8.9z" fill="#1b1410" stroke="url(#lg-ember)" strokeWidth="2" />
			<path d="M16 8.5c2.6 3 4.6 5.6 4.6 8.6a4.6 4.6 0 0 1-9.2 0c0-1.6.7-2.9 1.7-4 .1 1.4.8 2.4 1.9 2.8-.4-2.6.2-5 1-7.4z" fill="url(#lg-ember)" />
		</svg>
	);
}
