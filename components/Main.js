import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AiOutlineMail } from "react-icons/ai";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const Main = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const greeting = t("home.greeting");
  const name = t("home.name");
  const greetingBlock = useMemo(() => greeting + name, [greeting, name]);
  const titleBlock = useMemo(() => t("home.title"), [t]);

  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState("typingGreeting");

  function renderGreetingWithColor(text) {
    const idx = greeting.length;
    if (text.length <= idx) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: "#8839ef" }}>{text.slice(idx)}</span>
      </>
    );
  }

  function renderTitleWithColor(text) {
    const match = /Fullstack/i.exec(titleBlock);
    if (!match) return text;
    const idx = match.index;
    return (
      <>
        {text.slice(0, Math.min(idx, text.length))}
        <span style={{ color: "#8839ef" }}>
          {text.slice(idx, Math.min(idx + match[0].length, text.length))}
        </span>
        {text.slice(idx + match[0].length)}
      </>
    );
  }

  useEffect(() => {
    let timeout;
    const speed = 70;
    const pauseAfterWrite = 2000;
    const pauseAfterErase = 500;

    if (phase === "typingGreeting") {
      if (displayText.length < greetingBlock.length) {
        timeout = setTimeout(
          () =>
            setDisplayText(greetingBlock.slice(0, displayText.length + 1)),
          speed
        );
      } else {
        timeout = setTimeout(
          () => setPhase("erasingGreeting"),
          pauseAfterWrite
        );
      }
    } else if (phase === "erasingGreeting") {
      if (displayText.length > 0) {
        timeout = setTimeout(
          () => setDisplayText(displayText.slice(0, -1)),
          speed
        );
      } else {
        timeout = setTimeout(() => setPhase("typingTitle"), pauseAfterErase);
      }
    } else if (phase === "typingTitle") {
      if (displayText.length < titleBlock.length) {
        timeout = setTimeout(
          () =>
            setDisplayText(titleBlock.slice(0, displayText.length + 1)),
          speed
        );
      } else {
        timeout = setTimeout(() => setPhase("erasingTitle"), pauseAfterWrite);
      }
    } else if (phase === "erasingTitle") {
      if (displayText.length > 0) {
        timeout = setTimeout(
          () => setDisplayText(displayText.slice(0, -1)),
          speed
        );
      } else {
        timeout = setTimeout(() => setPhase("typingGreeting"), pauseAfterErase);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayText, phase, greetingBlock, titleBlock]);

  const variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { delay: 0.4 } },
  };

  return (
    <div id="home" className="w-full h-screen text-center">
      <div className="max-w-[1240px] w-full h-full mx-auto p-2 flex justify-center items-center">
        <motion.div initial="hidden" animate="visible" variants={variants}>
          <p className="uppercase text-sm tracking-widest text-gray-400">
            Exploring, experimenting, learning.
          </p>
          <h1 className="py-4 text-gray-300 min-h-[2.5rem] flex items-center justify-center">
            <span>
              {phase === "typingGreeting" || phase === "erasingGreeting"
                ? renderGreetingWithColor(displayText)
                : renderTitleWithColor(displayText)}
              <span className="animate-pulse">|</span>
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
