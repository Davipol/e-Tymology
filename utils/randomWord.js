"use client";
export const randomWord = async () => {
  try {
    const result = await fetch("https://random-word-api.herokuapp.com/word");
    if (!result.ok) {
      throw new Error("API request failed");
    }
    const data = await result.json();
    const word = data[0];
    console.log("Random word", word);
    return word;
  } catch (error) {
    console.error("Failed to fetch random word", error);
    const fallbackWords = [
      "serendipity",
      "ephemeral",
      "eloquent",
      "nostalgia",
      "wanderlust",
      "mellifluous",
      "ethereal",
      "quintessential",
      "luminous",
      "resplendent",
      "sonder",
      "petrichor",
      "aurora",
      "cascade",
      "whisper",
    ];
    const randomWord =
      fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    console.log("Using fallback word:", randomWord);
    return randomWord;
  }
};
