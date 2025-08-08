import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next"
// import NavLogo from "../public/assets/navLogo.png";
import LanguageSwitcher from "./LanguageSwitcher";
import { AiOutlineClose, AiOutlineMail, AiOutlineMenu } from "react-icons/ai";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { useTranslation } from 'next-i18next';

const Navbar = () => {
	const [nav, setNav] = useState(false);
	const [shadow, setShadow] = useState(false);
	const [navBg, setNavBg] = useState("#1e1e2e");
	const [linkColor, setLinkColor] = useState("#cdd6f4");
	const router = useRouter();
  const isSwedish = router.locale === 'sv';
  const resumeLink = isSwedish ? '/sv-resume.pdf' : '/en-resume.pdf';
  const { t } = useTranslation('common');

	useEffect(() => {
		if (
			router.asPath === "/food" ||
			router.asPath === "/crypto" ||
			router.asPath === "/moviepedia" ||
			router.asPath === "/twitch"
		) {
			setNavBg("transparent");
			setLinkColor("#1e1e2e");
		} else {
			setNavBg("#1e1e2e");
			setLinkColor("#cdd6f4");
		}
	}, [router]);

	const handleNav = () => {
		setNav((prevState) => !prevState);
	};

	useEffect(() => {
		const handleShadow = () => {
			if (window.scrollY >= 90) {
				setShadow(true);
			} else {
				setShadow(false);
			}
		};
		window.addEventListener("scroll", handleShadow);
	}, []);

	return (
		<div
			style={{ backgroundColor: `${navBg}` }}
			className={
				shadow
					? "fixed w-full h-20 shadow-xl z-[100]"
					: "fixed w-full h-20 z-[100]"
			}
		>
			<div className="flex justify-between items-center w-full h-full px-2 2xl:px-16">
				{/* <Link legacyBehavior href="/">
					<a>
						<Image
							src={NavLogo}
							alt="/"
							height="60"
							width="80"
							className="cursor-pointer"
						/>
					</a>
				</Link>*/}
				<LanguageSwitcher />
				<div className="flex items-center justify-center">
					<ul style={{ color: `${linkColor}` }} className="hidden md:flex">
						<Link href="/">
							<li className="ml-10 text-sm uppercase hover:text-[#8839ef]">
								{t('nav.home')}
							</li>
						</Link>
						<Link href="#about">
							<li className="ml-10 text-sm uppercase hover:text-[#8839ef]">
								{t('nav.about')}
							</li>
						</Link>
						<Link href="#skills">
							<li className="ml-10 text-sm uppercase hover:text-[#8839ef]">
								{t('nav.skills')}
							</li>
						</Link>
						{/* <Link href="/#projects">
							<li className="ml-10 text-sm uppercase hover:text-[#8839ef]">
								{t('nav.projects')}
							</li>
						</Link> */}
						<Link href="#contact">
							<li className="ml-10 text-sm uppercase hover:text-[#8839ef]">
								{t('nav.contact')}
							</li>
						</Link>
					</ul>

					<div className="ml-10 hidden md:flex">
            <a target="_blank" href={resumeLink} rel="noreferrer">
							<button
								type="button"
								className="inline-block px-5 py-3 border-2 rounded-md bg-transparent border-[#8839ef] text-[#8839ef] font-bold text-sm leading-tight normal-case hover:bg-[#8839ef] hover:text-[white] focus:outline-none transition duration-150 ease-in-out"
							>
								{t('nav.resume')}
							</button>
						</a>
					</div>

					<div onClick={handleNav} className="md:hidden cursor-pointer">
						<AiOutlineMenu size={25} />
					</div>
				</div>
			</div>

			{/* Mobile Menu */}

			<div
				className={
					nav ? "md:hidden fixed left-0 top-0 w-full h-screen bg-black/70" : ""
				}
			>
				<div
					className={
						nav
							? "fixed left-0 top-0 w-[75%] sm:w-[60%] md:w-[45%] h-screen bg-[#1e1e2e] p-10 ease-in duration-300"
							: "fixed left-[-100%] w-[75%] top-0 p-10 ease-in duration-300"
					}
				>
					<div>
						<div className="flex w-full items-center justify-between">
							{/* <Link legacyBehavior href="/">
								<a>
									<Image
										className="cursor-pointer"
										src={NavLogo}
										alt="/"
										width="60"
										height="50"
									/>
								</a>
							</Link>*/}
							<LanguageSwitcher />
							<div
								onClick={handleNav}
								className="rounded-full shadow-lg shadow-gray-900 p-3 cursor-pointer"
							>
								<AiOutlineClose />
							</div>
						</div>
						<div className="border-b border-[#8839ef50] my-4">
							{/* <p className="w-[85%] md:w-[90%] py-3 text-[#8839ef]">
								Let&apos;s build something Legendary Together
							</p>*/}
						</div>
					</div>
					<div className="py-2 flex flex-col">
						<ul className="uppercase">
							<Link href="/">
								<li onClick={() => setNav(false)} className="py-3 text-sm">
									{t('nav.home')}
								</li>
							</Link>
							<Link href="/#about">
								<li onClick={() => setNav(false)} className="py-3 text-sm">
									{t('nav.about')}
								</li>
							</Link>
							<Link href="/#skills">
								<li onClick={() => setNav(false)} className="py-3 text-sm">
									{t('nav.skills')}
								</li>
							</Link>
							<Link href="/#projects">
								<li onClick={() => setNav(false)} className="py-3 text-sm">
								  {t('nav.projects')}
								</li>
							</Link>
							<Link href="/#contact">
								<li onClick={() => setNav(false)} className="py-3 text-sm">
									{t('nav.contact')}
								</li>
							</Link>
						</ul>

						<div className="py-3 flex flex-col">
							<a target="_blank" href={resumeLink} rel="noreferrer">
								<button
									type="button"
									className="inline-block max-w-[50%] px-5 py-3 border-2 rounded-md border-[#7829df] font-bold text-sm leading-tight normal-case hover:bg-[#1E90FF] hover:text-[white] focus:outline-none transition duration-150 ease-in-out"
								>
									{t('nav.resume')}
								</button>
							</a>
						</div>

						<div className="pt-40">
							<p className="uppercase tracking-widest text-[#8839ef]">
								Let&apos;s connect
							</p>
							<div className="flex items-center justify-between my-4 w-full sm:w-[80%]">
								<a
									href="https://github.com/Aperre/"
									target="_blank"
									rel="noreferrer"
								>
									<div className="rounded-full shadow-lg shadow-gray-900 p-3 cursor-pointer hover:scale-105 ease-in duration-300">
										<FaGithub />
									</div>
								</a>
								<Link href="/#contact">
									<div className="rounded-full shadow-lg shadow-gray-900 p-3 cursor-pointer hover:scale-105 ease-in duration-300">
										<AiOutlineMail />
									</div>
								</Link>
								<a target="_blank" href={resumeLink} rel="noreferrer">
									<div className="rounded-full shadow-lg shadow-gray-900 p-3 cursor-pointer hover:scale-105 ease-in duration-300">
										<BsFillPersonLinesFill />
									</div>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			<SpeedInsights />
		</div>
	);
};

export default Navbar;
