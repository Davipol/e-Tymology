import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.CHIMERA_API_KEY,
});

async function checkSpelling(word) {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=1`
    );
    const data = await response.json();

    if (data.length > 0 && data[0].word) {
      return {
        corrected: data[0].word,
        wasCorrected: data[0].word.toLowerCase() !== word.toLowerCase(),
      };
    }

    return { corrected: word, wasCorrected: false };
  } catch (error) {
    console.error("Spell-check error:", error);
    return { corrected: word, wasCorrected: false };
  }
}

export async function POST(request) {
  console.log("API POST route called");

  try {
    const { message } = await request.json();
    console.log("Received message:", message);

    const { corrected, wasCorrected } = await checkSpelling(message);
    console.log(
      `Original: "${message}", Corrected: "${corrected}", Changed: ${wasCorrected}`
    );

    const response = await openai.chat.completions.create({
      model: "tngtech/deepseek-r1t-chimera:free",
      messages: [
        {
          role: "system",
          content: `You are a JSON API that provides etymology information. Respond ONLY with valid JSON.

Return etymology data in this exact structure:
{
  "modernMeaning": "current definition of the word",
  "centuryOfOrigin": "century when word originated (e.g., '9th century')",
  "detailedEtymology": "detailed history and origin of the word",
  "funFact": "interesting fact about the word"
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks, no other text.`,
        },
        {
          role: "user",
          content: `Provide etymology for: ${corrected}`,
        },
      ],
      temperature: 0.1,
    });

    let rawContent = response.choices?.[0]?.message?.content || "{}";
    console.log("Raw response:", rawContent);

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawContent = jsonMatch[0];
    } else {
      rawContent = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
    }

    console.log("Cleaned response:", rawContent);

    let replyData;
    try {
      replyData = JSON.parse(rawContent);
      console.log("Parse successful:", replyData);
    } catch (parseError) {
      console.error("Failed to parse model output:", parseError);
      console.error("Content that failed:", rawContent);
      replyData = {
        modernMeaning: "Parse error",
        centuryOfOrigin: "Unknown",
        detailedEtymology: rawContent || "Unable to process response",
        funFact: "Please try again",
      };
    }

    // Add correction note AFTER parsing (whether successful or not)
    if (wasCorrected && replyData.modernMeaning) {
      replyData.modernMeaning = `(Corrected from "${message}") ${replyData.modernMeaning}`;
    }

    // Ensure no null values
    replyData = {
      modernMeaning: replyData.modernMeaning || "Information not available",
      centuryOfOrigin: replyData.centuryOfOrigin || "Unknown",
      detailedEtymology: replyData.detailedEtymology || "Etymology not found",
      funFact: replyData.funFact || "No additional information",
    };

    console.log("Final reply data:", replyData);

    return new Response(JSON.stringify(replyData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return new Response(
      JSON.stringify({
        modernMeaning: "API Error",
        centuryOfOrigin: "Unknown",
        detailedEtymology: error.message || "Unknown error occurred",
        funFact: "Please try again",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
