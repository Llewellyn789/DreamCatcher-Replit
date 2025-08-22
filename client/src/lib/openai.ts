import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzeDreamWithJung(dreamContent: string): Promise<{
  archetypes: string;
  symbols: string;
  unconscious: string;
  insights: string;
  integration: string;
}> {
  try {
    const prompt = `You are a Jungian psychoanalyst. Analyze the following dream using Carl Jung's analytical psychology framework. Provide your analysis in JSON format with exactly these fields:

{
  "archetypes": "Identify the archetypal figures, roles, or patterns present in the dream",
  "symbols": "Analyze the symbolic elements and their potential meanings",
  "unconscious": "Explore personal and collective unconscious elements revealed",
  "insights": "Provide psychological insights about the dreamer's psyche",
  "integration": "Suggest opportunities for psychological integration and growth"
}

Dream content: "${dreamContent}"

Provide a thoughtful, professional analysis focusing on Jungian concepts like the collective unconscious, archetypes, individuation, and psychological integration.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No analysis content received from OpenAI');
    }
    return JSON.parse(analysisText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error("Failed to analyze dream: " + errorMessage);
  }
}
