import Head from "next/head";
import Main from "../components/Main";
import About from "../components/About";
import Education from "../components/Education";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
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
				<link rel="icon" href="/favi.png" />
			</Head>
			<Main />
			<About />
			<Education />
			<Skills />
			<Projects />
			<Contact />
			<SpeedInsights />
			<footer>
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-500 text-sm">© {new Date().getFullYear()} Tjabooo</p>
				</div>
			</footer>
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
