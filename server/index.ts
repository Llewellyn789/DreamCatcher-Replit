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

// Share Routes
app.get("/s/:token", (req, res) => {
  const { token } = req.params;
  
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="DreamCatcher – Shared Dream" />
    <meta property="og:description" content="Explore this dream analysis with AI-powered Jungian psychology insights." />
    <meta property="og:image" content="${req.protocol}://${req.get('host')}/og/${token}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}/s/${token}" />
    <meta property="og:type" content="website" />

    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="DreamCatcher – Shared Dream" />
    <meta name="twitter:description" content="Explore this dream analysis with AI-powered Jungian psychology insights." />
    <meta name="twitter:image" content="${req.protocol}://${req.get('host')}/og/${token}" />
    
    <title>DreamCatcher - Shared Dream</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #0B1426 0%, #1A2332 50%, #2D3748 100%);
        color: #FFD700;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .container {
        max-width: 600px;
        padding: 2rem;
      }
      .logo {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .subtitle {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.8;
      }
      .cta {
        display: inline-block;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #0B1426;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: transform 0.2s;
      }
      .cta:hover {
        transform: translateY(-2px);
      }
      .token {
        margin-top: 2rem;
        font-size: 0.8rem;
        opacity: 0.6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="logo">✨ DreamCatcher</h1>
      <p class="subtitle">AI-powered dream interpretation with Jungian psychology</p>
      <a href="/" class="cta">Open DreamCatcher App</a>
      <div class="token">Share ID: ${token}</div>
    </div>
  </body>
</html>`;
  
  res.send(html);
});

app.get("/og/:token", (req, res) => {
  const { token } = req.params;
  
  // Create a simple 1200x630 canvas with placeholder content
  const width = 1200;
  const height = 630;
  
  // For now, return a simple SVG that browsers can render as an image
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0B1426;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#1A2332;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2D3748;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <text x="600" y="250" font-family="system-ui, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="url(#text)">✨ DreamCatcher</text>
    <text x="600" y="320" font-family="system-ui, sans-serif" font-size="28" text-anchor="middle" fill="#FFD700" opacity="0.8">Shared Dream Analysis</text>
    <text x="600" y="380" font-family="system-ui, sans-serif" font-size="24" text-anchor="middle" fill="#FFD700" opacity="0.6">AI-powered Jungian Psychology</text>
    <text x="600" y="500" font-family="system-ui, sans-serif" font-size="18" text-anchor="middle" fill="#FFD700" opacity="0.4">Share ID: ${token}</text>
  </svg>`;
  
  res.set({
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=3600'
  });
  res.send(svg);
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