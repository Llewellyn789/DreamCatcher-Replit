
import type { Express } from "express";
import { createShareToken, revokeToken, isTokenRevoked } from './tokenManager';

export function registerShareRoutes(app: Express) {
  // Create share token from dream data
  app.post("/api/create-share-token", (req, res) => {
    try {
      const { dreamId, archetype, snippet, guidance, palette } = req.body;
      
      if (!dreamId || !archetype || !snippet || !guidance) {
        return res.status(400).json({ 
          message: "Missing required fields: dreamId, archetype, snippet, guidance" 
        });
      }
      
      const token = createShareToken({
        i: dreamId,
        archetype: archetype.substring(0, 50), // Limit archetype length
        snippet: snippet.substring(0, 100),
        guidance: guidance.substring(0, 150),
        palette,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      });
      
      res.json({ token });
    } catch (error) {
      console.error("Token creation error:", error);
      res.status(500).json({ message: "Failed to create share token" });
    }
  });

  // Revoke a share token
  app.post("/api/revoke-share-token", (req, res) => {
    try {
      const { dreamId } = req.body;
      
      if (!dreamId) {
        return res.status(400).json({ message: "dreamId is required" });
      }
      
      revokeToken(dreamId);
      res.json({ success: true, message: "Token revoked" });
    } catch (error) {
      console.error("Token revocation error:", error);
      res.status(500).json({ message: "Failed to revoke token" });
    }
  });

  // Check if token is revoked
  app.get("/api/check-token/:dreamId", (req, res) => {
    try {
      const { dreamId } = req.params;
      const revoked = isTokenRevoked(dreamId);
      res.json({ revoked });
    } catch (error) {
      console.error("Token check error:", error);
      res.status(500).json({ message: "Failed to check token status" });
    }
  });
}
