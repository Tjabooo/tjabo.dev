import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AiOutlineMail } from "react-icons/ai";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import Typewriter from "typewriter-effect";

const Main = () => {
  const { t, i18n } = useTranslation("common");
  const greeting = t("home.greeting");
  const name = t("home.name");
  const greetingBlock = useMemo(() => greeting + name, [greeting, name]);
  const titleBlock = useMemo(() => t("home.title"), [t]);

  const variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { delay: 0.4 } },
  };

  return (
    <div id="home" className="w-full h-screen text-center">
      <div className="max-w-[1240px] w-full h-full mx-auto p-2 flex justify-center items-center">
        <motion.div initial="hidden" animate="visible" variants={variants}>
          <p className="uppercase text-sm tracking-widest text-gray-400">
            Gay, Alcoholic, Schizophrenic
          </p>
          <h1 className="py-4 text-gray-300 min-h-[2.5rem] flex items-center justify-center">
            <span>
              <Typewriter
                key={i18n.language}
                options={{
                  delay: 70,
                  deleteSpeed: 70,
                  loop: true,
                  cursor: "|",
                  pauseFor: 1750,
                  autoStart: true,
                  html: true,
                }}
                onInit={(typewriter) => {
                  typewriter
                    .typeString(
                      `<span>${greeting}<span style="color: #8839ef">${name}</span></span>`
                    )
                    .pauseFor(2000)
                    .deleteAll(70)
                    .typeString(
                      (() => {
                        const title = titleBlock;
                        const idx = title.toLowerCase().indexOf("fullstack");
                        if (idx === -1) {
                          return `<span>${title}</span>`;
                        }
                        const before = title.slice(0, idx);
                        const word = title.slice(idx, idx + "Fullstack".length);
                        const after = title.slice(idx + "Fullstack".length);
                        return `<span>${before}<span style="color: #8839ef">${word}</span>${after}</span>`;
                      })()
                    )
                    .pauseFor(2000)
                    .deleteAll(70)
                    .start();
                }}
              />
            </span>
          </h1>
          <p className="py-4 text-gray-400 max-w-[70%] m-auto">
            {t("home.goal")}
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
            <Link
              href="https://www.linkedin.com/in/oliver-j-p-i-westin-6670902a5/"
              target="_blank"
              rel="noreferrer"
            >
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
