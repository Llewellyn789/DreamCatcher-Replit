import type { Express } from "express";
import { createShareToken, verifyShareToken, revokeToken, isTokenRevoked } from './tokenManager';

// Helper function to wrap text for OG images
function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
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

    // Parse palette if it exists, using app colors as defaults
    let palette;
    try {
      palette = data.palette ? JSON.parse(data.palette) : {
        bg1: '#0a0a0a', // dark background
        bg2: '#1a1a1a', // slightly lighter
        bg3: '#2a2a2a', // card background
        text1: '#FFD700', // gold accent
        text2: '#FFA500'  // warm orange
      };
    } catch {
      palette = {
        bg1: '#0a0a0a', // dark background
        bg2: '#1a1a1a', // slightly lighter
        bg3: '#2a2a2a', // card background
        text1: '#FFD700', // gold accent
        text2: '#FFA500'  // warm orange
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
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
        background: rgba(255, 215, 0, 0.05);
        border-radius: 1rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 215, 0, 0.1);
      }
      .logo {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, ${palette.text1} 0%, ${palette.text2} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
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
        color: ${palette.text1};
      }
      .guidance {
        font-size: 1rem;
        margin-bottom: 2rem;
        opacity: 0.8;
        color: ${palette.text2};
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
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }
      .cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
      }
      .powered {
        margin-top: 2rem;
        font-size: 0.8rem;
        opacity: 0.6;
        color: ${palette.text1};
      }
      .stars {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: ${palette.text1};
          border-radius: 50%;
          animation: twinkle 2s infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
    </style>
  </head>
  <body>
    <div class="stars"></div>
    <div class="container">
      <h1 class="logo">✨ DreamCatcher</h1>
      <div class="archetype">${data.archetype}</div>
      <div class="snippet">"${data.snippet}"</div>
      <div class="guidance">${data.guidance}</div>
      <a href="/" class="cta">Open DreamCatcher App</a>
      <div class="powered">AI-powered Jungian Psychology</div>
    </div>

    <script>
      // Function to generate and place stars
      function createStars() {
        const starsContainer = document.querySelector('.stars');
        const width = window.innerWidth;
        const height = window.innerHeight;

        for (let i = 0; i < 100; i++) { // Increased number of stars for better effect
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * width + 'px';
          star.style.top = Math.random() * height + 'px';
          star.style.opacity = Math.random() * 0.5 + 0.2; // More varied opacity
          star.style.animationDuration = (Math.random() * 2 + 2) + 's'; // More varied twinkle duration
          starsContainer.appendChild(star);
        }
      }
      createStars();
    </script>
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

  // Test endpoint to create a token with app colors
  app.get("/test/create-token", (req, res) => {
    try {
      const appPalette = {
        bg1: '#0a0a0a', // dark background
        bg2: '#1a1a1a', // slightly lighter
        bg3: '#2a2a2a', // card background
        text1: '#FFD700', // gold accent
        text2: '#FFA500'  // warm orange
      };

      const token = createShareToken({
        i: "test-dream-id",
        archetype: "The Explorer",
        snippet: "A vivid dream about flying through cosmic landscapes",
        guidance: "This dream suggests a desire for freedom and exploration",
        palette: JSON.stringify(appPalette),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      res.json({
        token,
        testUrls: {
          share: `${baseUrl}/s/${token}`,
          og: `${baseUrl}/og/${token}`
        }
      });
    } catch (error) {
      console.error("Test token creation error:", error);
      res.status(500).json({ message: "Failed to create test token" });
    }
  });

  // OG Image Generation Route
  app.get("/og/:token", async (req, res) => {
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

    // Use app theme colors as defaults
    const palette = data.palette ? JSON.parse(data.palette) : {
      bg1: '#0a0a0a', // dark background
      bg2: '#1a1a1a', // slightly lighter
      bg3: '#2a2a2a', // card background
      text1: '#FFD700', // gold accent
      text2: '#FFA500'  // warm orange
    };

    const { createCanvas } = await import('canvas');
    const width = 1200;
    const height = 630;
    const ctx = createCanvas(width, height).getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.bg1);
    gradient.addColorStop(0.5, palette.bg2);
    gradient.addColorStop(1, palette.bg3);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add some decorative stars
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;

      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw title with glow effect
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 52px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';

    // Add glow effect for title
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText('DreamCatcher', width / 2, 120);
    ctx.shadowBlur = 0;

    // Draw archetype
    ctx.fillStyle = '#FFA500';
    ctx.font = '36px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(data.archetype, width / 2, 180);

    // Draw snippet (word wrapped)
    ctx.fillStyle = '#FFD700';
    ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    const snippetLines = wrapText(ctx, `"${data.snippet}"`, width - 100);
    let snippetY = 240;
    snippetLines.forEach((line: string) => {
      ctx.fillText(line, width / 2, snippetY);
      snippetY += 35;
    });

    // Draw guidance
    ctx.fillStyle = '#FFA500';
    ctx.font = '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    const guidanceLines = wrapText(ctx, data.guidance, width - 100);
    let guidanceY = snippetY + 40;
    guidanceLines.forEach((line: string) => {
      ctx.fillText(line, width / 2, guidanceY);
      guidanceY += 30;
    });

    // Draw footer
    ctx.fillStyle = '#C4A068';
    ctx.font = '20px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('AI-powered Jungian Psychology', width / 2, height - 40);

    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(ctx.canvas.toBuffer()));
  });
}