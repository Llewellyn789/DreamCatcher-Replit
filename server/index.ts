import path from "path";
import express from "express";
import OpenAI from "openai";
import multer from "multer";
import { registerShareRoutes } from "./shareRoutes";
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

  const testToken = createShareToken({
    i: "test-dream-id",
    archetype: "The Explorer",
    snippet: "A vivid dream about flying through cosmic landscapes",
    guidance: "This dream suggests a desire for freedom and exploration",
    palette: JSON.stringify({
      bg1: '#0B1426',
      bg2: '#1A2332', 
      bg3: '#2D3748',
      text1: '#FFD700',
      text2: '#FFA500'
    }),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  });

  res.json({ 
    token: testToken,
    testUrls: {
      share: `${req.protocol}://${req.get('host')}/s/${testToken}`,
      og: `${req.protocol}://${req.get('host')}/og/${testToken}`
    }
  });
});

// Configure multer for audio file uploads
const upload = multer({ 
  storage:multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Share Routes
app.get("/s/:token", async (req, res) => {
    const { token } = req.params;

    const verification = verifyShareToken(token);

    if (!verification.valid) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: verification.error || 'Invalid token' 
      });
    }

    const data = verification.data;
    if (!data) {
      return res.status(404).json({ error: 'Not Found' });
    }

    // Parse palette if it exists
    let palette;
    try {
      palette = data.palette ? JSON.parse(data.palette) : {
        bg1: '#0B1426',
        bg2: '#1A2332', 
        bg3: '#2D3748',
        text1: '#FFD700',
        text2: '#FFA500'
      };
    } catch {
      palette = {
        bg1: '#0B1426',
        bg2: '#1A2332',
        bg3: '#2D3748', 
        text1: '#FFD700',
        text2: '#FFA500'
      };
    }

    // Load fonts for inline CSS
    let fontCSS = '';
    try {
      const fs = await import('fs');
      const path = await import('path');

      const interRegular = fs.readFileSync(path.join(process.cwd(), 'client/public/fonts/inter-regular.woff2'));
      const caveat = fs.readFileSync(path.join(process.cwd(), 'client/public/fonts/caveat-regular.woff2'));

      const interRegularBase64 = interRegular.toString('base64');
      const caveatBase64 = caveat.toString('base64');

      fontCSS = `
        @font-face {
          font-family: 'Inter';
          font-weight: 400;
          src: url(data:font/woff2;base64,${interRegularBase64}) format('woff2');
        }
        @font-face {
          font-family: 'Caveat';
          font-weight: 400;
          src: url(data:font/woff2;base64,${caveatBase64}) format('woff2');
        }
      `;
    } catch (error) {
      console.error('Font loading error for share page:', error);
      fontCSS = '/* Fonts not available */';
    }

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Open Graph tags -->
    <meta property="og:title" content="DreamCatcher – ${data.archetype} Dream" />
    <meta property="og:description" content="${data.snippet}..." />
    <meta property="og:image" content="${req.protocol}://${req.get('host')}/og/${token}" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}/s/${token}" />
    <meta property="og:type" content="website" />

    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="DreamCatcher – ${data.archetype} Dream" />
    <meta name="twitter:description" content="${data.snippet}..." />
    <meta name="twitter:image" content="${req.protocol}://${req.get('host')}/og/${token}" />

    <title>DreamCatcher - ${data.archetype} Dream</title>
    <style>
      ${fontCSS}
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, ${palette.bg1} 0%, ${palette.bg2} 50%, ${palette.bg3} 100%);
        color: ${palette.text1};
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
        font-family: 'Caveat', cursive;
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, ${palette.text1} 0%, ${palette.text2} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .archetype {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: ${palette.text2};
      }
      .snippet {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
        opacity: 0.9;
        line-height: 1.5;
      }
      .guidance {
        font-size: 1rem;
        margin-bottom: 2rem;
        opacity: 0.8;
        font-style: italic;
        line-height: 1.4;
      }
      .cta {
        display: inline-block;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, ${palette.text1} 0%, ${palette.text2} 100%);
        color: ${palette.bg1};
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: transform 0.2s;
      }
      .cta:hover {
        transform: translateY(-2px);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="logo">✨ DreamCatcher</h1>
      <div class="archetype">${data.archetype}</div>
      <p class="snippet">"${data.snippet}..."</p>
      <p class="guidance">${data.guidance}</p>
      <a href="/" class="cta">Explore Your Dreams</a>
    </div>
  </body>
</html>`;

    res.send(html);
  });

app.get("/og/:token", async (req, res) => {
  const { token } = req.params;

  console.log('OG route token received:', token);
  const verification = verifyShareToken(token);
  console.log('Token verification result:', verification);

  if (!verification.valid) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: verification.error || 'Invalid token' 
    });
  }

  const payload = verification.payload;
  const width = 1200;
  const height = 630;

  // Use palette if provided, otherwise default colors
  const colors = payload.palette ? JSON.parse(payload.palette) : {
    bg1: '#0B1426',
    bg2: '#1A2332', 
    bg3: '#2D3748',
    text1: '#FFD700',
    text2: '#FFA500'
  };

  // Load fonts for inline SVG
  let fontDefs = '';
  try {
    const fs = await import('fs');
    const path = await import('path');

    const interRegular = fs.readFileSync(path.join(process.cwd(), 'client/public/fonts/inter-regular.woff2'));
    const caveat = fs.readFileSync(path.join(process.cwd(), 'client/public/fonts/caveat-regular.woff2'));

    const interRegularBase64 = interRegular.toString('base64');
    const caveatBase64 = caveat.toString('base64');

    fontDefs = `
      <defs>
        <font-face font-family="Inter" font-weight="400" font-style="normal">
          <font-face-src>
            <font-set type="glyph" mime-type="font/woff2" xlink:href="data:font/woff2;base64,${interRegularBase64}" />
          </font-face-src>
        </font-face>
        <font-face font-family="Caveat" font-weight="400" font-style="normal">
          <font-face-src>
            <font-set type="glyph" mime-type="font/woff2" xlink:href="data:font/woff2;base64,${caveatBase64}" />
          </font-face-src>
        </font-face>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg1};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors.bg2};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.bg3};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${colors.text1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.text2};stop-opacity:1" />
        </linearGradient>
      </defs>`;
  } catch (error) {
    console.error('Font loading error for OG image:', error);
    fontDefs = `<defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.bg1};stop-opacity:1" />
        <stop offset="50%" style="stop-color:${colors.bg2};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.bg3};stop-opacity:1" />
      </linearGradient>
      <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${colors.text1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.text2};stop-opacity:1" />
      </linearGradient>
    </defs>`;
  }

  // Dreamcatcher glyph SVG
  const dreamcatcherGlyph = `
    <g transform="translate(64, 550)">
      <circle cx="20" cy="20" r="18" fill="none" stroke="${colors.text2}" stroke-width="2"/>
      <path d="M8,14 Q20,26 32,14 Q20,18 8,14" fill="none" stroke="${colors.text2}" stroke-width="1"/>
      <path d="M12,26 Q20,18 28,26 Q20,22 12,26" fill="none" stroke="${colors.text2}" stroke-width="1"/>
      <line x1="20" y1="2" x2="20" y2="8" stroke="${colors.text2}" stroke-width="1"/>
      <line x1="38" y1="20" x2="32" y2="20" stroke="${colors.text2}" stroke-width="1"/>
      <line x1="2" y1="20" x2="8" y2="20" stroke="${colors.text2}" stroke-width="1"/>
      <path d="M20,38 L16,46 L24,46 Z" fill="${colors.text2}"/>
    </g>
  `;

  // Truncate snippet to 80 chars max
  const snippet = payload.snippet.length > 80 ? payload.snippet.substring(0, 77) + "..." : payload.snippet;
  
  // Create headline with highlighted archetype and guidance
  const headlineText = `The ${payload.archetype} archetype is telling you to ${payload.guidance}.`;
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    ${fontDefs}
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <!-- Top snippet zone (handwritten style) -->
    <text x="600" y="120" font-family="Caveat, cursive" font-size="28" text-anchor="middle" fill="${colors.text1}" opacity="0.9">"${snippet}"</text>
    
    <!-- Main headline zone -->
    <text x="64" y="240" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="bold" fill="${colors.text1}" text-anchor="start">
      <tspan>The </tspan>
      <tspan fill="${colors.text2}">${payload.archetype}</tspan>
      <tspan> archetype is</tspan>
    </text>
    <text x="64" y="300" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="bold" fill="${colors.text1}" text-anchor="start">
      <tspan>telling you to </tspan>
      <tspan fill="${colors.text2}">${payload.guidance}</tspan>
      <tspan>.</tspan>
    </text>
    
    <!-- Footer zone -->
    ${dreamcatcherGlyph}
    <text x="1136" y="575" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" text-anchor="end" fill="${colors.text2}">Try DreamCatcher →</text>
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