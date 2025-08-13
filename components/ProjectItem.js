import React from "react";
import Image from "next/image";
import Link from "next/link";

const ProjectItem = ({ title, backgroundImg, langs = [], projectUrl }) => {
	return (
	  <Link href={projectUrl} target="_blank" rel="noreferrer">
			<div className="relative flex h-24 min-h-[6rem] w-full shadow-xl shadow-gray-900 rounded-lg p-2 group hover:scale-105 ease-out duration-500 hover:outline-none hover:ring-2 hover:ring-[#8839ef] cursor-pointer sm:h-28 sm:min-h-[7rem] md:h-32 md:min-h-[8rem] items-center justify-center">
			  <div className="relative flex flex-col items-center justify-center w-full px-1 z-10">
					<h3 className="text-base xs:text-lg sm:text-xl md:text-2xl text-[#8839ef] tracking-wider text-center break-words whitespace-normal hyphens-auto w-full max-w-full overflow-hidden max-h-[3.2em] leading-tight overflow-y-auto">
					  {title}
					</h3>
					<div className="flex flex-wrap items-center justify-center gap-1 mt-1 w-full">
					  {langs.map((Icon, idx) => (
							<span key={idx} className="text-white text-xl xs:text-2xl sm:text-2xl md:text-3xl flex items-center">
							  {Icon}
							</span>
					  ))}
					</div>
			  </div>
			</div>
		</Link>
	);
}

export default ProjectItem;
