import React, { useState, useEffect } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  return (
    <div className="w-full h-18 flex items-center bg-white dark:bg-zinc-800 justify-end z-50 backdrop-blur-sm md:pt-2 lg:pt-4">
      <div className="flex flex-col items-center">
        <h1 className=" text-3xl sm:text-4xl md:text-4xl lg:text-5xl mr-4 font-bold text-yellow dark:text-white lg:mr-10">
          e-Tymology
        </h1>
        <p className="text-black dark:text-white text-sm sm:text-lg lg:text-xl font-stretch-extra-expanded mr-4 lg:mr-10">
          Every word has a story
        </p>
      </div>
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="mr-5 rounded-2xl border-1 p-2 bg-blue-700 dark:bg-zinc-800 text-white hover:bg-blue-600 dark:hover:bg-zinc-700 transition"
        title="Toggle Dark Mode"
      >
        {isDarkMode ? <LuMoon size={20} /> : <LuSun size={20} />}
      </button>
    </div>
  );
};

export default Header;
