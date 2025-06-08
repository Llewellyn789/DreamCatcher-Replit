import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDreamSchema, jungianAnalysisSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key"
});

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all dreams
  app.get("/api/dreams", async (req, res) => {
    try {
      const dreams = await storage.getAllDreams();
      res.json(dreams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dreams" });
    }
  });

  // Get single dream
  app.get("/api/dreams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dream = await storage.getDream(id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      res.json(dream);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dream" });
    }
  });

  // Create new dream
  app.post("/api/dreams", async (req, res) => {
    try {
      const validatedData = insertDreamSchema.parse(req.body);
      const dream = await storage.createDream(validatedData);
      res.status(201).json(dream);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid dream data", errors: (error as any).errors });
      }
      res.status(500).json({ message: "Failed to create dream" });
    }
  });

  // Generate 3-word dream title
  app.post("/api/generate-title", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Dream content is required" });
      }

      const prompt = `Analyze this dream and create a 3-word title that captures its essence. Return only the 3 words separated by spaces, nothing else:

${content}`;

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

  // Analyze dream with GPT
  app.post("/api/dreams/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dream = await storage.getDream(id);
      
      if (!dream) {
        return res.status(404).json({ message: "Dream not found" });
      }

      if (dream.analysis) {
        return res.json({ analysis: JSON.parse(dream.analysis) });
      }

      const prompt = `You are a Jungian psychoanalyst. Analyze the following dream using Carl Jung's analytical psychology framework. Provide your analysis in JSON format with exactly these fields:

{
  "archetypes": "Identify the archetypal figures, roles, or patterns present in the dream",
  "symbols": "Analyze the symbolic elements and their potential meanings",
  "unconscious": "Explore personal and collective unconscious elements revealed",
  "insights": "Provide psychological insights about the dreamer's psyche",
  "integration": "Suggest opportunities for psychological integration and growth"
}

Dream content: "${dream.content}"

Provide a thoughtful, professional analysis focusing on Jungian concepts like the collective unconscious, archetypes, individuation, and psychological integration.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const analysisText = response.choices[0].message.content;
      const analysis = JSON.parse(analysisText);
      
      // Validate the analysis structure
      const validatedAnalysis = jungianAnalysisSchema.parse(analysis);
      
      // Update dream with analysis
      await storage.updateDream(id, { analysis: JSON.stringify(validatedAnalysis) });
      
      res.json({ analysis: validatedAnalysis });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze dream" });
    }
  });

  // Transcribe audio using OpenAI Whisper
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioPath = req.file.path;
      let finalAudioPath = audioPath;
      
      try {
        // If the file is webm, rename it to have .webm extension for Whisper
        if (req.file.originalname.endsWith('.webm') || req.file.mimetype.includes('webm')) {
          const webmPath = audioPath + '.webm';
          fs.renameSync(audioPath, webmPath);
          finalAudioPath = webmPath;
        }

        // Use OpenAI Whisper to transcribe the audio with optimizations
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(finalAudioPath),
          model: "whisper-1",
          language: "en",
          response_format: "text", // Faster than JSON format
          temperature: 0.2, // Lower temperature for faster processing
        });

        // Clean up the uploaded file
        fs.unlinkSync(finalAudioPath);

        res.json({ transcript: transcription });
      } catch (whisperError) {
        // Clean up the uploaded file in case of error
        if (fs.existsSync(finalAudioPath)) {
          fs.unlinkSync(finalAudioPath);
        }
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
        throw whisperError;
      }
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Delete dream
  app.delete("/api/dreams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDream(id);
      
      if (!success) {
        return res.status(404).json({ message: "Dream not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete dream" });
    }
  });

  // Get themes for unconscious map
  app.get("/api/themes", async (req, res) => {
    try {
      const dreams = await storage.getAllDreams();
      
      if (dreams.length === 0) {
        return res.json([]);
      }

      // Extract themes from dream analyses
      const themeFrequency = new Map<string, number>();
      const themeConnections = new Map<string, Set<string>>();
      
      dreams.forEach(dream => {
        if (!dream.analysis) return;
        
        try {
          const analysis = JSON.parse(dream.analysis);
          
          // Extract themes from symbols and archetypes
          const themes: string[] = [];
          
          if (analysis.symbols) {
            // Extract key symbolic themes
            const symbolText = analysis.symbols.toLowerCase();
            const commonSymbols = [
              'water', 'fire', 'death', 'birth', 'flying', 'falling', 'animals', 
              'house', 'family', 'shadow', 'light', 'darkness', 'journey', 'chase',
              'transformation', 'fear', 'love', 'power', 'wisdom', 'nature',
              'technology', 'childhood', 'relationships', 'conflict', 'peace'
            ];
            
            commonSymbols.forEach(symbol => {
              if (symbolText.includes(symbol)) {
                themes.push(symbol);
              }
            });
          }
          
          if (analysis.archetypes) {
            // Extract archetypal themes
            const archetypeText = analysis.archetypes.toLowerCase();
            const commonArchetypes = [
              'hero', 'mother', 'father', 'child', 'wise old man', 'wise old woman',
              'trickster', 'shadow', 'anima', 'animus', 'self', 'persona',
              'mentor', 'guardian', 'destroyer', 'creator', 'innocent', 'explorer'
            ];
            
            commonArchetypes.forEach(archetype => {
              if (archetypeText.includes(archetype)) {
                themes.push(archetype);
              }
            });
          }
          
          // Update frequency and connections
          themes.forEach(theme => {
            themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
            
            if (!themeConnections.has(theme)) {
              themeConnections.set(theme, new Set());
            }
            
            // Connect this theme to all other themes in the same dream
            themes.forEach(otherTheme => {
              if (theme !== otherTheme) {
                themeConnections.get(theme)?.add(otherTheme);
              }
            });
          });
          
        } catch (parseError) {
          console.error('Error parsing dream analysis:', parseError);
        }
      });
      
      // Convert to theme objects with minimum frequency threshold
      const themeObjects = Array.from(themeFrequency.entries())
        .filter(([_, count]) => count >= 1) // Include all themes that appear at least once
        .map(([name, count]) => ({
          name,
          count,
          links: Array.from(themeConnections.get(name) || [])
        }))
        .sort((a, b) => b.count - a.count); // Sort by frequency
      
      res.json(themeObjects);
    } catch (error) {
      console.error("Themes extraction error:", error);
      res.status(500).json({ message: "Failed to extract themes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
