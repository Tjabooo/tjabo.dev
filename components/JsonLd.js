export default function JsonLd({ data }) {
	// "<" escaped so a README or description can never close the script tag.
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
