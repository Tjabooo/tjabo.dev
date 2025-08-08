import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AiOutlineMail } from "react-icons/ai";
import { BsPersonLinesFill } from "react-icons/bs";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useRouter } from "next/router";
import { useTranslation } from 'next-i18next';

const Main = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const isSwedish = router.locale === 'sv';
  const resumeLink = isSwedish ? '/sv-resume.pdf' : '/en-resume.pdf';
	const varients = {
		hidden: {
			scale: 0.8,
			opacity: 0,
		},
		visible: {
			scale: 1,
			opacity: 1,
			transition: {
				delay: 0.4,
			},
		},
	};

	return (
		<div id="home" className="w-full h-screen text-center">
			<div className="max-w-[1240px] w-full h-full mx-auto p-2 flex justify-center items-center">
				<motion.div initial="hidden" animate="visible" variants={varients}>
					<p className="uppercase text-sm tracking-widest text-gray-400">
					   Exploring, experimenting, learning.
					</p>
					<h1 className="py-4 text-gray-300">
            {t('home.greeting')}<span className="text-[#8839ef]">{t('home.name')}</span>
						<br></br>
            {t('home.title')}</h1>
					<p className="py-4 text-gray-400 max-w-[70%] m-auto">
					  {t('home.goal')}

					</p>
					<div className="flex justify-between items-center max-w-[330px] m-auto py-4">
						<a
							href="https://github.com/Tjabooo/"
							target="_blank"
							rel="noreferrer"
						>
							<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
								<FaGithub />
							</div>
						</a>
						<Link href="https://www.linkedin.com/in/oliver-j-p-i-westin-6670902a5/" target="_blank" rel="noreferrer">
							<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
								<FaLinkedin />
							</div>
						</Link>
						<a href="#contact">
							<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
								<AiOutlineMail />
							</div>
						</a>
					</div>
				</motion.div>
			</div>
		</div>
	);
};

export default Main;
