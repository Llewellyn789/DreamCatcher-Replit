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
    if (file.mimetype.startsWith('audio/')) {
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
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid dream data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create dream" });
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
      
      try {
        // Use OpenAI Whisper to transcribe the audio
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: "whisper-1",
          language: "en",
        });

        // Clean up the uploaded file
        fs.unlinkSync(audioPath);

        res.json({ transcript: transcription.text });
      } catch (whisperError) {
        // Clean up the uploaded file in case of error
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

  const httpServer = createServer(app);
  return httpServer;
}
