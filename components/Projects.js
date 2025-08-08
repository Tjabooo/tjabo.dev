import React from "react";
import ProjectItem from "./ProjectItem";
import { FaPhp, FaRust, FaHtml5, FaJs, FaCss3, FaPython, FaReact, FaNodeJs } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { BiLogoTailwindCss } from "react-icons/bi";
import { TbBrandNextjs } from "react-icons/tb";

const Projects = () => {
  const { t } = useTranslation();

	return (
		<div id="projects" className="w-full">
			<div className="max-w-[1240px] mx-auto px-2 py-16">
			<div className="flex items-center space-x-4 py-4">
			  <h2 className="text-xl uppercase tracking-widest text-[#8839ef]">
          {t('projects.header')}
			  </h2>
          <p className="text-gray-600">{t('projects.notice')}</p>
			</div>
				<div className="grid md:grid-cols-2 gap-8">
				  <ProjectItem
						title="fitcheck-uf-app"
						projectUrl=""
						langs={[<FaPhp key="php" />, <FaHtml5 key="html" />, <FaJs key="js" />, <FaCss3 key="css" />]}
					/>
					<ProjectItem
						title="Tailcord"
						projectUrl=""
						langs={[<FaPython key="python" />]}
					/>
					<ProjectItem
						title={`tjabo.dev ${t('projects.here')}`}
						projectUrl=""
						langs={[<FaReact key="react" />, <TbBrandNextjs key="nextjs" />, <FaNodeJs key="nodejs" />, <BiLogoTailwindCss key="tailwindcss" />]}
					/>
					<ProjectItem
						title="bevy-fps-shooter"
						projectUrl=""
						langs={[<FaRust key="rust" />]}
					/>
				</div>
			</div>
		</div>
	);
};

export default Projects;
