import path from "path";
import express from "express";
import OpenAI from "openai";
import multer from "multer";
import { registerShareRoutes } from "./shareRoutes.js";
import { createShareToken, verifyShareToken } from "./tokenManager";

console.log('Server starting - imports loaded successfully');

const app = express();

// Add JSON parsing for API routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// OpenAI setup for dream analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key"
});

// Register share routes
registerShareRoutes(app);

// Test endpoint to generate a valid token for testing
app.get("/test/create-token", (req, res) => {
  console.log('Test endpoint hit - creating token');

  // Current cosmic color palette
  const cosmicPalette = {
    bg1: '#0B1426', // cosmic-950
    bg2: '#1E1B4B', // cosmic-900
    bg3: '#2D1B69', // cosmic-800
    text1: '#C4A068', // cosmic-200
    text2: '#E8DCC8'  // cosmic-50
  };

  const testToken = createShareToken({
    i: "test-dream-id",
    archetype: "The Explorer",
    snippet: "A vivid dream about flying through cosmic landscapes",
    guidance: "This dream suggests a desire for freedom and exploration",
    palette: JSON.stringify(cosmicPalette),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const cacheBuster = Date.now();

  res.json({
    token: testToken,
    palette: cosmicPalette,
    testUrls: {
      share: `${baseUrl}/s/${testToken}`,
      og: `${baseUrl}/og/${testToken}?v=${cacheBuster}`
    }
  });
});

// Configure multer for audio file uploads
const upload = multer({
  storage:multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Share routes are handled by shareRoutes.ts

app.get("/og/:token", async (req, res) => {
  const { token } = req.params;

  console.log('OG route token received:', token.substring(0, 50) + '...');
  const verification = verifyShareToken(token);
  console.log('Token verification result:', verification.valid ? 'VALID' : 'INVALID');

  if (!verification.valid) {
    return res.status(403).json({
      error: 'Forbidden',
      message: verification.error || 'Invalid token'
    });
  }

  const payload = verification.payload;
  if (!payload) {
    return res.status(404).json({ error: 'Not Found' });
  }

  // Parse palette from token payload or use cosmic theme defaults
  let colors;
  const cosmicDefaults = {
    bg1: '#0B1426', // cosmic-950
    bg2: '#1E1B4B', // cosmic-900
    bg3: '#2D1B69', // cosmic-800
    text1: '#C4A068', // cosmic-200
    text2: '#E8DCC8'  // cosmic-50
  };

  try {
    if (payload.palette) {
      colors = JSON.parse(payload.palette);
      console.log('Using token palette:', colors);
    } else {
      colors = cosmicDefaults;
      console.log('No palette in token, using cosmic defaults');
    }
  } catch (error) {
    console.log('Palette parsing failed, using cosmic defaults:', error);
    colors = cosmicDefaults;
  }

  // Try to import canvas with error handling
  let createCanvas, registerFont;
  try {
    const canvasModule = await import('canvas');
    createCanvas = canvasModule.createCanvas;
    registerFont = canvasModule.registerFont;

    // Pre-register fonts to avoid segfaults
    try {
      const fs = await import('fs');
      const path = await import('path');
      const fontDir = path.join(process.cwd(), 'client/public/fonts');
      const interPath = path.join(fontDir, 'inter-regular.woff2');

      if (fs.existsSync(interPath)) {
        registerFont(interPath, { family: 'Inter' });
      }
    } catch (fontError) {
      console.warn('Font registration failed, using system fonts:', fontError);
    }
  } catch (canvasError) {
    console.error('Canvas import error:', canvasError);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Canvas library not available' 
    });
  }

  const width = 1200;
  const height = 630;

  let canvas, ctx;
  try {
    canvas = createCanvas(width, height);
    ctx = canvas.getContext('2d');

    // Set safe defaults to prevent crashes
    ctx.textBaseline = 'top';
    ctx.imageSmoothingEnabled = true;
  } catch (canvasCreationError) {
    console.error('Canvas creation error:', canvasCreationError);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create canvas' 
    });
  }

  // Helper function to wrap text for canvas
  function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const potentialLine = currentLine === '' ? word : `${currentLine} ${word}`;
      const testLine = context.measureText(potentialLine);
      if (testLine.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = potentialLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.bg1);
  gradient.addColorStop(0.5, colors.bg2);
  gradient.addColorStop(1, colors.bg3);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some decorative stars
  ctx.fillStyle = colors.text1;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;

    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.shadowColor = colors.text1;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Draw title with glow effect
  ctx.fillStyle = colors.text1;
  ctx.font = 'bold 52px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';

  // Add glow effect for title
  ctx.shadowColor = colors.text1;
  ctx.shadowBlur = 20;
  ctx.fillText('✨ DreamCatcher', width / 2, 120);
  ctx.shadowBlur = 0;

  // Draw archetype
  ctx.fillStyle = colors.text2;
  ctx.font = '36px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(payload.archetype, width / 2, 180);

  // Draw snippet (word wrapped)
  ctx.fillStyle = colors.text1;
  ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  const snippetLines = wrapText(ctx, `"${payload.snippet}"`, width - 100);
  let snippetY = 240;
  snippetLines.slice(0, 4).forEach((line) => { // Limit to 4 lines
    ctx.fillText(line, width / 2, snippetY);
    snippetY += 35;
  });

  // Draw guidance
  ctx.fillStyle = colors.text2;
  ctx.font = '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  const guidanceLines = wrapText(ctx, payload.guidance, width - 100);
  let guidanceY = snippetY + 40;
  guidanceLines.slice(0, 3).forEach((line) => { // Limit to 3 lines
    ctx.fillText(line, width / 2, guidanceY);
    guidanceY += 30;
  });

  // Draw footer
  ctx.fillStyle = colors.text1;
  ctx.font = '20px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('AI-powered Jungian Psychology', width / 2, height - 40);

  // Generate the PNG buffer
  let buffer;
  try {
    buffer = canvas.toBuffer('image/png');
  } catch (bufferError) {
    console.error('Canvas buffer generation error:', bufferError);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to generate image' 
    });
  }

  // Set response headers and send PNG buffer
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(buffer);
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