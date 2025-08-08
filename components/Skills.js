import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import Html from "../public/assets/skills/html.png";
import Javascript from "../public/assets/skills/javascript.png";
import NodeImg from "../public/assets/skills/node.png";
import Github from "../public/assets/skills/github1.png";
import Python from "../public/assets/skills/python.png";
import Rust from "../public/assets/skills/rust.png";
import Php from "../public/assets/skills/php.png";
import Linux from "../public/assets/skills/linux.png";
import Cs from "../public/assets/skills/cs.png";
import Css from "../public/assets/skills/css.png";
import NextJs from "../public/assets/skills/nextjs.png";
import React from "../public/assets/skills/react.png";

const skillsList = [
  {
    label: "Python",
    icon: Python,
    levelKey: "python",
  },
  {
    label: "Rust",
    icon: Rust,
    levelKey: "rust",
  },
  {
    label: "C#",
    icon: Cs,
    levelKey: "cs",
  },
  {
    label: "PHP",
    icon: Php,
    levelKey: "php",
  },
  {
    label: "Next.js",
    icon: NextJs,
    levelKey: "nextjs"
  },
  {
    label: "React",
    icon: React,
    levelKey: "react"
  },
  {
    label: "Node JS",
    icon: NodeImg,
    levelKey: "nodejs",
  },
  {
    label: "JavaScript",
    icon: Javascript,
    levelKey: "javascript",
  },
  {
    label: "HTML",
    icon: Html,
    levelKey: "html",
  },
  {
    label: "CSS",
    icon: Css,
    levelKey: "css",
  },
  {
    label: "Linux",
    icon: Linux,
    levelKey: "linux",
  },
  {
    label: "Github",
    icon: Github,
    levelKey: "github",
  },
];

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
              {skillsList.map((skill) => (
                <div
                  key={skill.label}
                  className="p-6 shadow-xl shadow-[#00000030] rounded-xl hover:scale-105 ease-out duration-100 bg-[#262636] hover:bg-[#212131]"
                >
                  <div className="grid grid-cols-2 gap-4 justify-center items-center">
                    <div className="m-auto">
                      <Image src={skill.icon} width="64px" height="64px" alt={skill.label} />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                      {skill.label === "Linux" ? (
                        <h3 className="text-center">
                          Linux<br />
                          <span className="text-xs">{t(`skills.level.${skill.levelKey}`)}</span>
                        </h3>
                      ) : (
                        <>
                          <h3>{skill.label}</h3>
                          <span className="text-xs">{t(`skills.level.${skill.levelKey}`)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;
