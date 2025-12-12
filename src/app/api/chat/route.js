import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.CHIMERA_API_KEY,
});

export async function POST(request) {
  console.log("API POST route called");

  try {
    const { message } = await request.json();
    console.log("Received message:", message);
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
          content: `Provide etymology for: ${message}

Note: If this appears to be a misspelling (like "telephon" for "telephone" or "algorythm" for "algorithm"), automatically correct it and provide etymology for the correct spelling. Mention the correction in the modernMeaning field like: "(Corrected from '${message}') [definition]"`,
        },
      ],
      temperature: 0.2,
    });

    let rawContent = response.choices?.[0]?.message?.content || "{}";

    rawContent = rawContent
      .replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1")
      .trim();

    let replyData;
    try {
      replyData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse model output:", parseError);
      replyData = {
        modernMeaning: null,
        centuryOfOrigin: null,
        detailedEtymology: null,
        funFact: null,
      };
    }

    return new Response(JSON.stringify(replyData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return new Response(
      JSON.stringify({
        error: "OpenRouter API request failed",
        details: error.message || JSON.stringify(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
