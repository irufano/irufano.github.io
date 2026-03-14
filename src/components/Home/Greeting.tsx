"use client";

import { Cloud, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

const getGreeting = (): string => {
  const hours = new Date().getHours();
  if (hours < 12) return "Good Morning";
  if (hours < 18) return "Good Afternoon";
  return "Good Evening";
};

const quotes = [
  { quote: "Knowledge enlivens the soul.", author: "Al-Kindi" },
  { quote: "The cure for ignorance is inquiry.", author: "Ibn Khaldun" },
  { quote: "Seek knowledge, gain wisdom.", author: "Muhammad SAW" },
  { quote: "Knowledge is power.", author: "Imam Ali" },
  { quote: "Patience leads to victory.", author: "Al-Ghazali" },
  { quote: "Knowledge enlivens the soul.", author: "Ibn Sina" },
  { quote: "Knowledge is true wealth.", author: "Ibn Khaldun" },
  { quote: "Learning enhances human dignity.", author: "Al-Ghazali" },
];

const Greeting = () => {
  const [greeting, setGreeting] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const quoteDuration = 5000;

  useEffect(() => {
    setGreeting(getGreeting());

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
      setProgress(0);
    }, quoteDuration);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => prevProgress + 100 / (quoteDuration / 100));
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentQuoteIndex]);

  return (
    <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-full md:max-w-md w-full">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {greeting}
          </h2>
          {greeting?.toLowerCase() === "good morning" ? (
            <Cloud size={30} className="text-yellow-500" />
          ) : greeting?.toLowerCase() === "good afternoon" ? (
            <Sun size={30} className="text-yellow-500" />
          ) : (
            <Moon size={30} className="text-yellow-500" />
          )}
        </div>
        <div key={currentQuoteIndex} className="mt-3">
          <p className=" text-gray-600 dark:text-gray-300">
            {quotes[currentQuoteIndex].quote}
          </p>
          <span className="mt-2 text-xs text-gray-500 dark:text-gray-200 ">
            {quotes[currentQuoteIndex].author}
          </span>
        </div>
        <div className="w-full  flex-1 flex items-center justify-center">
          <div className="w-1/4 h-2 mt-4 bg-gray-300 dark:bg-gray-600 rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Greeting;
