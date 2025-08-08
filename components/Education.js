import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import ssisLogo from "../public/assets/education/ssis.png";
import kthLogo from "../public/assets/education/kth.png";
import asoLogo from "../public/assets/education/åsö.png";

const educationData = [
  {
    key: "aso",
    logo: asoLogo,
    alt: "Åsö Logo",
  },
  {
    key: "ssis",
    logo: ssisLogo,
    alt: "SSIS Logo",
  },
  {
    key: "kth",
    logo: kthLogo,
    alt: "KTH Logo",
  },
];

const Education = () => {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);
  const timelineRef = useRef(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    const currentRef = timelineRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleExpand = (idx) => {
    setExpanded(expanded === idx ? null : idx);
  };

  return (
      <div id="education" className="w-full h-screen p-2 bg-transparent">      <div
        ref={timelineRef}
        className="max-w-[700px] mx-auto flex flex-col justify-center h-full relative"
      >
        <h2 className="py-4 text-xl tracking-widest uppercase text-[#8839ef] text-center">
          {t("education.header")}
        </h2>
        <div className="relative flex flex-col items-center">
          <div
            className={`absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#8839ef] to-[#262636] z-0 transition-all duration-1000 ${
              isVisible ? "scale-y-100 opacity-100" : "scale-y-50 opacity-0"
            }`}
            style={{ minHeight: "350px", top: "40px", bottom: "0" }}
          />
          <div className="flex flex-col gap-16 z-10 w-full pt-8 pb-8">
            {educationData.map((edu, idx) => {
              const key = edu.key;
              return (
                <div
                  key={key}
                  className="relative flex flex-col items-center group w-full"
                >
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-2 w-12 h-12 rounded-full bg-[#262636] border-4 border-[#8839ef] flex items-center justify-center z-20 shadow-lg transition-all duration-700 ${
                      isVisible
                        ? "scale-100 opacity-100"
                        : "scale-50 opacity-0"
                    }`}
                  >
                    <Image
                      src={edu.logo}
                      alt={edu.alt}
                      className="rounded-full"
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    className={`relative w-full mt-16 transition-all duration-500 cursor-pointer flex justify-center mx-auto ${
                      expanded === idx
                        ? "scale-105 shadow-2xl z-30"
                        : "shadow-xl"
                    }`}
                    onClick={() => handleExpand(idx)}
                    onMouseEnter={() => setExpanded(idx)}
                    onMouseLeave={() => setExpanded(null)}
                  >
                    <div
                      className={`p-6 rounded-xl bg-[#262636] hover:bg-[#212131] border border-[#8839ef40] transition-all duration-300 w-full ${
                        expanded === idx
                          ? "max-h-[400px] opacity-100"
                          : "max-h-[180px] opacity-90"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-[#b4b4b4] mb-2">
                          {t(`education.${key}.time`)}
                        </p>
                        <h3 className="text-lg font-bold text-center text-[#fff]">
                          {t(`education.${key}.name`)}
                        </h3>
                        <span className="text-xs text-[#b4b4b4] mb-2">
                          {t(`education.${key}.location`)}
                        </span>
                        <div
                          className={`transition-all duration-300 overflow-hidden w-full ${
                            expanded === idx
                              ? "max-h-[200px] opacity-100 mt-4"
                              : "max-h-0 opacity-0 mt-0"
                          }`}
                        >
                          <p className="text-center text-[#b4b4b4] text-sm">
                            {t(`education.${key}.programme`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;
