import Head from "next/head";
import Main from "../components/Main";
import About from "../components/About";
import Skills from "../components/Skills";
// import Projects from "../components/Projects.js";
import Contact from "../components/Contact";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from "next-i18next";

export default function Home() {
  const { t } = useTranslation('common');

	return (
		<div>
			<Head>
        <title>{t('header')}</title>
				{/* <meta name="description" content="Experienced Back-end developper specializing in online/game presence, and cloud architectures using JavaScript, Node.js, Python ..." />
				<meta name="author" content="Ape" />
				<meta name="keywords" content="Ape, Developer, Portfolio" />
				<meta property="og:title" content="Ape | Backend Developer Portfolio" />
				<meta property="og:description" content="Experienced Back-end developper specializing in online/game presence, and cloud architectures using JavaScript, Node.js, Python ..." />
				<meta property="og:url" content="https://ape.revizion.dev/" />*/}

				<link rel="icon" href="/favi.png" />
			</Head>
			<Main />
			<About />
			<Skills />
			{/* <Projects /> */}
			<Contact />
			<SpeedInsights />
		</div>
	);
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  };
}
