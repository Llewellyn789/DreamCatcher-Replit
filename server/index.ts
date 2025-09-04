import path from "path";
import express from "express";
import OpenAI from "openai";
import multer from "multer";

const app = express();

// Add JSON parsing for API routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// OpenAI setup for dream analysis
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key"
});

// Configure multer for audio file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// API Routes
app.post("/api/generate-title", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Dream content is required" });
    }

    const prompt = `Analyze this dream and create a 3-word title that captures its essence. Return only the 3 words separated by spaces, nothing else:\n\n${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.7,
    });

    const title = response.choices[0].message.content?.trim() || "Dream Analysis";
    
    res.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    res.status(500).json({ message: "Failed to generate title" });
  }
});

app.post("/api/analyze-dream", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Dream content is required" });
    }

    const prompt = `You are a Jungian psychoanalyst. Analyze the following dream using Carl Jung's analytical psychology framework. Provide your analysis in JSON format with exactly these fields:

{
  "archetypes": "Identify the archetypal figures, roles, or patterns present in the dream",
  "symbols": "Analyze the symbolic elements and their potential meanings",
  "unconscious": "Explore personal and collective unconscious elements revealed",
  "insights": "Provide psychological insights about the dreamer's psyche",
  "integration": "Suggest opportunities for psychological integration and growth"
}

Dream content: "${content}"

Provide a thoughtful, professional analysis focusing on Jungian concepts like the collective unconscious, archetypes, individuation, and psychological integration.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No analysis content received');
    }
    const analysis = JSON.parse(analysisText);
    
    res.json({ analysis: JSON.stringify(analysis) });
  } catch (error) {
    console.error("Dream analysis error:", error);
    res.status(500).json({ message: "Failed to analyze dream" });
  }
});

app.post("/api/dream-themes", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Dream content is required" });
    }

    const prompt = `Analyze this dream content and extract key psychological themes. Return a JSON array of theme objects, each with a "name" field containing a concise theme name. Focus on Jungian archetypal themes, symbolic elements, and psychological patterns. Return up to 10 most relevant themes:

Dream content: "${content}"

Return format:
[
  {"name": "shadow"},
  {"name": "transformation"},
  {"name": "water"}
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const themesText = response.choices[0].message.content;
    if (!themesText) {
      throw new Error('No themes content received');
    }
    
    const result = JSON.parse(themesText);
    const themes = result.themes || [];
    
    res.json(themes);
  } catch (error) {
    console.error("Theme extraction error:", error);
    res.status(500).json({ message: "Failed to extract themes" });
  }
});

app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    try {
      // Convert buffer to File-like object for OpenAI
      const audioFile = new File([req.file.buffer], 'audio.webm', { 
        type: req.file.mimetype || 'audio/webm' 
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "json"
      });

      res.json({ transcript: transcription.text || "" });
    } catch (transcriptionError) {
      console.error("OpenAI transcription error:", transcriptionError);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  } catch (error) {
    console.error("Transcription endpoint error:", error);
    res.status(500).json({ message: "Transcription service unavailable" });
  }
});

// Static files
const staticRoot = path.join(process.cwd(), "dist", "public");
app.use(express.static(staticRoot));

// Health check
app.get("/health", (_req, res) => res.send("ok"));

// SPA fallback LAST
app.use("*", (_req, res) => {
  res.sendFile(path.join(staticRoot, "index.html"));
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`[server] listening on 0.0.0.0:${port}`);
});