"use client";

import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import HistoryBar from "./components/HistoryBar";
import { LuPanelLeftOpen, LuPanelRightOpen } from "react-icons/lu";
import { randomWord } from "../../utils/randomWord";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [typedLines, setTypedLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const typingTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    const cleanedHistory = savedHistory.filter(
      (item) => item.question && item.question.trim().length > 0
    );
    setHistory(cleanedHistory);
    localStorage.setItem("chatHistory", JSON.stringify(cleanedHistory));
  }, []);

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (error) {
      clearTypingTimeout();
      setTypedLines([]);
      return;
    }

    const currentAnswer = selectedHistoryItem?.answer || answer;
    if (!currentAnswer) {
      clearTypingTimeout();
      setTypedLines([]);
      return;
    }

    const safe = (v) =>
      typeof v === "string" ? v : v == null ? "N/A" : String(v);

    const fields = [
      safe(currentAnswer.modernMeaning).trim() || "N/A",
      safe(currentAnswer.centuryOfOrigin).trim() || "N/A",
      safe(currentAnswer.detailedEtymology).trim() || "N/A",
      safe(currentAnswer.funFact).trim() || "N/A",
    ];

    clearTypingTimeout();
    setTypedLines(Array(fields.length).fill(""));

    const typeField = (fieldIndex, charIndex) => {
      if (fieldIndex >= fields.length) return;

      const text = fields[fieldIndex];

      setTypedLines((prev) => {
        const next = [...prev];
        next[fieldIndex] = text.slice(0, charIndex + 1);
        return next;
      });

      if (charIndex + 1 < text.length) {
        typingTimeoutRef.current = setTimeout(
          () => typeField(fieldIndex, charIndex + 1),
          25
        );
      } else {
        typingTimeoutRef.current = setTimeout(
          () => typeField(fieldIndex + 1, 0),
          150
        );
      }
    };

    typeField(0, 0);

    return () => clearTypingTimeout();
  }, [answer, selectedHistoryItem, error]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setError("");
    setSelectedHistoryItem(null);
    const currentQuestion = question;
    setSubmittedQuestion(currentQuestion);
    setQuestion("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentQuestion }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      const safeData = {
        modernMeaning: data.modernMeaning || "N/A",
        centuryOfOrigin: data.centuryOfOrigin || "N/A",
        detailedEtymology: data.detailedEtymology || "N/A",
        funFact: data.funFact || "N/A",
      };

      setAnswer(safeData);

      const newHistoryEntry = { question: currentQuestion, answer: safeData };

      const filteredHistory = history.filter(
        (item) => item.question.toLowerCase() !== currentQuestion.toLowerCase()
      );

      const updatedHistory = [newHistoryEntry, ...filteredHistory];

      setHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    } catch (error) {
      console.log(error);
      setError("Error fetching answer. Please try again.");
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showHistory &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);
  const wordToUpperCase = (word) => {
    if (!word) return "";
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  };

  const displayedItem =
    selectedHistoryItem ||
    (answer ? { question: submittedQuestion, answer } : null);

  const clearHistory = () => {
    setHistory([]);
    setSelectedHistoryItem(null);
    localStorage.removeItem("chatHistory");
  };

  return (
    <>
      <Header />
      {showHistory ? (
        <LuPanelRightOpen
          size={30}
          className="lg:hidden fixed top-4 left-64 z-30  text-black dark:text-white rounded transform "
          onClick={() => setShowHistory(false)}
          title="Close History"
        />
      ) : (
        <LuPanelLeftOpen
          size={30}
          className="lg:hidden fixed top-4 left-3 z-30   text-blue-600 dark:text-white rounded"
          onClick={() => setShowHistory(true)}
          title="Open History"
        />
      )}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
          onClick={() => setShowHistory(false)}
        />
      )}

      <div className="flex">
        <div
          ref={sidebarRef}
          className={`
            fixed top-0 left-0 h-full z-20 bg-white dark:bg-zinc-800 rounded-tr-lg shadow-lg transform transition-transform duration-300
            ${showHistory ? "translate-x-0" : "-translate-x-full"}
            lg:static lg:translate-x-0 lg:h-auto md:w-56 lg:shadow-none
          `}
        >
          <HistoryBar
            historyItems={history}
            onHistorySelect={(item) => {
              setSelectedHistoryItem(item);
              setShowHistory(false);
            }}
            onClearHistory={clearHistory}
            onDeleteItem={(itemToDelete) => {
              const updatedHistory = history.filter(
                (entry) =>
                  entry.question.toLowerCase() !==
                  itemToDelete.question.toLowerCase()
              );
              setHistory(updatedHistory);
              localStorage.setItem(
                "chatHistory",
                JSON.stringify(updatedHistory)
              );
            }}
          />
        </div>

        <div className="flex flex-1 flex-col my-12 mx-2 sm:mx-5 md:mx-10 lg:mx-20">
          <form
            className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
            onSubmit={handleSubmit}
          >
            <input
              className="w-full px-3 py-2 border rounded text-base md:text-lg lg:text-xl dark:bg-zinc-800 dark:text-white"
              id="word"
              placeholder="Insert a word or a sentence..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="button"
              className="w-full mx-auto bg-green-600 hover:bg-green-500 text-white text-xl px-4 py-2 rounded mt-2 dark:bg-green-900 dark:hover:bg-green-800"
              onClick={async () => {
                const word = await randomWord();
                if (word) {
                  setQuestion(word);
                }
              }}
            >
              Surprise Me
            </button>
            <button
              className="w-full mx-auto bg-blue-600 hover:bg-blue-500 text-white text-xl px-4 py-2 rounded mt-2 dark:bg-blue-900 dark:hover:bg-blue-800 flex items-center justify-center gap-2"
              type="submit"
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="11"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Thinking...
                </>
              ) : (
                "Ask"
              )}
            </button>
          </form>
          {loading && (
            <div className="mt-4 w-full text-center text-black dark:text-gray-200">
              <h2 className="font-bold text-lg md:text-2xl text-center mt-2 text-black dark:text-white">
                Finding{" "}
              </h2>
              <p className="font-bold text-2xl md:text-3xl text-center mt-1 text-black dark:text-white">
                {wordToUpperCase(submittedQuestion)}
              </p>

              <div className="flex justify-center mt-5">
                <svg
                  className="animate-spin h-18 w-20 text-gray-700 dark:text-gray-200"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-35"
                    cx="12"
                    cy="12"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <path
                    className="opacity-75"
                    fill="none"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="mt-4 w-full">
            {error ? (
              <p className="text-red-600 font-semibold text-center">{error}</p>
            ) : (
              displayedItem &&
              displayedItem.answer && (
                <div className="bg-white dark:bg-zinc-800 flex-col w-full">
                  <h2 className="font-bold text-lg md:text-2xl text-center mt-2 text-black dark:text-white">
                    Here is your answer:
                  </h2>
                  <p className="font-bold text-2xl md:text-3xl text-center mt-1 text-black dark:text-white">
                    <strong>{wordToUpperCase(displayedItem.question)}</strong>
                  </p>
                  <div className="bg-blue-100 dark:bg-zinc-900 h-fit rounded-2xl p-2 space-y-3 mt-2 text-black lg:text-xl md:text-lg dark:text-white">
                    {typedLines.map((line, index) => {
                      const fieldNames = [
                        "Modern meaning",
                        "Century of origin",
                        "Etymology",
                        "Fun fact",
                      ];
                      return (
                        <p key={index}>
                          <strong>{fieldNames[index]}:</strong> {line}
                        </p>
                      );
                    })}
                  </div>
                  <div className="mx-auto flex">
                    <button
                      className="w-1/3 mx-auto bg-gray-400 dark:bg-gray-600 text-black dark:text-white  text-xl rounded mt-4 py-2 hover:bg-gray-500"
                      onClick={() => {
                        setAnswer(null);
                        setTypedLines([]);
                        setSelectedHistoryItem(null);
                        setSubmittedQuestion("");
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
