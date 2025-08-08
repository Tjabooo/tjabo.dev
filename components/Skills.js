import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import Html from "../public/assets/skills/html.png";
import Javascript from "../public/assets/skills/javascript.png";
import Lua from "../public/assets/skills/lua.png";
import NodeImg from "../public/assets/skills/node.png";
import Github from "../public/assets/skills/github1.png";
import Python from "../public/assets/skills/python.png";
import Java from "../public/assets/skills/java.png";
import Rust from "../public/assets/skills/rust.png";
import Php from "../public/assets/skills/php.png";
import Linux from "../public/assets/skills/linux.png";
import Cs from "../public/assets/skills/cs.png";
import Css from "../public/assets/skills/css.png";

const Skills = () => {
  const { t } = useTranslation('common');
	const [isVisible, setIsVisible] = useState(false);
    const skillsRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            setIsVisible(entry.isIntersecting);
        }, { threshold: 0.4 });

        const currentRef = skillsRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);
	return (
	<div id="skills" className="w-full p-2 mb-12 lg:mb-32">
		<div
			ref={skillsRef}
			className="max-w-[1240px] mx-auto flex flex-col justify-center"
		>
				<div className={`transition-all duration-1000 ${isVisible ? 'lg:opacity-100 lg:translate-y-0' : 'lg:opacity-0 lg:translate-y-20'}`}>
				<div className="max-w-[1240px] mx-auto flex flex-col justify-center h-full">
					<h2 className="py-4 text-xl tracking-widest uppercase text-[#8839ef]">
						{t('skills.header')}
					</h2>
						<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Python} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
                    <h3>Python</h3><span className="text-xs">{t('skills.level.python')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Rust} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>Rust</h3><span className="text-xs">{t('skills.level.rust')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Cs} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>C#</h3><span className="text-xs">{t('skills.level.cs')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Php} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>PHP</h3><span className="text-xs">{t('skills.level.php')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={NodeImg} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>Node JS</h3><span className="text-xs">{t('skills.level.nodejs')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Javascript} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>JavaScript</h3><span className="text-xs">{t('skills.level.javascript')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Html} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>HTML</h3><span className="text-xs">{t('skills.level.html')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Css} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>CSS</h3><span className="text-xs">{t('skills.level.css')}</span>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Linux} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
                    <h3 className="text-center">Linux<br></br><span className="text-xs">{t('skills.level.linux')}</span></h3>
									</div>
								</div>
							</div>
							<div className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]">
								<div className="grid grid-cols-2 gap-4 justify-center items-center">
									<div className="m-auto">
										<Image src={Github} width="64px" height="64px" alt="/" />
									</div>
									<div className="flex flex-col justify-center items-center">
										<h3>Github</h3><span className="text-xs">{t('skills.level.github')}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Skills;
