import React from "react";
import Image from "next/image";
import Link from "next/link";
import AboutImg from "../public/assets/me.jpg";
import SignatureImg from "../public/assets/signature.png";
import { useTranslation } from 'next-i18next';

const About = () => {
  const { t } = useTranslation('common'); // using 'common.json'

	return (
		<div id="about" className="w-full md:h-1/2 p-2 flex items-center py-16">
			<div className="max-w-[1240px] m-auto md:grid grid-cols-3 gap-8">
				<div className="col-span-2 ml-[10%] mr-[10%]">
					<h2 className="uppercase text-xl tracking-widest text-[#8839ef]">
						{t('about.header')}
					</h2>
					<p className="py-2 text-gray-300 text-xl text-justify">
						{t('about.p1')}
					</p>
					<p className="py-2 text-gray-300 text-xl text-justify">
						{t('about.p2')}
					</p>
					<p className="py-2 text-gray-300 text-xl text-justify">
					{t('about.p3')}
					</p>
					<p className="py-2 text-gray-300 text-xl text-justify">
					{t('about.p4')}
					</p>
					<Image src={SignatureImg} className="rounded-xl w-auto h-auto" alt="signature" />
				</div>
				<div className="w-full h-auto m-auto shadow-xl shadow-gray-900 rounded-xl flex items-center justify-center p-4 hover:scale-105 ease-in duration-300">
					<Image src={AboutImg} className="rounded-xl" alt="/" />
				</div>
			</div>
		</div>
	);
};

export default About;
