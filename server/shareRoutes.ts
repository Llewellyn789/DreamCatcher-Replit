
import type { Express } from "express";
import { createShareToken, verifyShareToken, revokeToken, isTokenRevoked } from './tokenManager';

export function registerShareRoutes(app: Express) {
  // Share page route
  app.get("/s/:token", async (req, res) => {
    const { token } = req.params;

    const verification = verifyShareToken(token);

    if (!verification.valid) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: verification.error || 'Invalid token' 
      });
    }

    const data = verification.payload;
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
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 1rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .logo {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, ${palette.text1} 0%, ${palette.text2} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .archetype {
        font-family: 'Caveat', cursive;
        font-size: 1.8rem;
        margin-bottom: 1rem;
        color: ${palette.text2};
      }
      .snippet {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        opacity: 0.9;
        font-style: italic;
      }
      .guidance {
        font-size: 1rem;
        margin-bottom: 2rem;
        opacity: 0.8;
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
      .powered {
        margin-top: 2rem;
        font-size: 0.8rem;
        opacity: 0.6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="logo">✨ DreamCatcher</h1>
      <div class="archetype">${data.archetype}</div>
      <div class="snippet">"${data.snippet}..."</div>
      <div class="guidance">${data.guidance}</div>
      <a href="/" class="cta">Open DreamCatcher App</a>
      <div class="powered">AI-powered Jungian Psychology</div>
    </div>
  </body>
</html>`;

    res.send(html);
  });

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
