import React from "react";
import Image from "next/image";
import Link from "next/link";

const ProjectItem = ({ title, backgroundImg, langs = [], projectUrl }) => {
	return (
		<div className="relative flex items-center justify-center h-20 w-full shadow-xl shadow-gray-900 rounded-xl p-4 group hover:scale-105 hover:outline hover:outline-1 hover:outline-[#8839ef] cursor-pointer">
			<Image
				className="rounded-xl group-hover:opacity-10"
				src={backgroundImg}
				alt=""
			/>
			<div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center">
				<h3 className="text-2xl text-[#8839ef] tracking-wider text-center">
					{title}
				</h3>
				<div className="flex flex-row items-center justify-center gap-2 mt-2">
					{langs.map((Icon, idx) => (
						<span key={idx} className="text-white text-2xl flex items-center">
							{Icon}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

export default ProjectItem;
