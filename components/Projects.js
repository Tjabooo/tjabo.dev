import React from "react";
import ProjectItem from "./ProjectItem";
// import foodImg from "../public/assets/projects/food-app.jpg";
// import cryptoImg from "../public/assets/projects/crypto.jpg";
// import movieImg from "../public/assets/projects/moviepedia.png";
// import twitchImg from "../public/assets/projects/twitch.jpg";
import { FaPhp, FaRust, FaHtml5, FaJs, FaCss3, FaPython } from "react-icons/fa";
import { useTranslation } from "next-i18next";

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
						// backgroundImg={foodImg}
						projectUrl="/food"
						// php, blade, html, js, css
						langs={[<FaPhp key="php" />, <FaHtml5 key="html" />, <FaJs key="js" />, <FaCss3 key="css" />]}
					/>
					<ProjectItem
						title="Tailcord"
						// backgroundImg={twitchImg}
						projectUrl="/twitch"
						langs={[<FaPython key="python" />]}
					/>
					<ProjectItem
						title="facial-recog"
						// backgroundImg={movieImg}
						projectUrl="/moviepedia"
						langs={[<FaPython key="python" />]}
					/>
					<ProjectItem
						title="bevy-fps-shooter"
						// backgroundImg={cryptoImg}
						projectUrl="/crypto"
						langs={[<FaRust key="rust" />]}
					/>
				</div>
			</div>
		</div>
	);
};

export default Projects;
