import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

function log(message: string) {
  const formattedTime = new Date().toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  console.log(`${formattedTime} [server] ${message}`);
}

async function setupVite(app: express.Express, server: any) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      clearScreen: false,
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    
    log("Vite middleware setup completed");
  } catch (error) {
    log(`Vite setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Fallback to simple serving if Vite fails
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        return;
      }
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Dream Catcher</title>
</head>
<body>
  <h1>Dream Catcher</h1>
  <p>Vite is currently unavailable. Please check the console for errors.</p>
</body>
</html>
      `);
    });
  }
}

function serveStatic(app: express.Express) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  
  app.use(express.static(distPath));
  
  app.use("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const env = process.env.NODE_ENV || "development";
  log(`Environment: ${env}`);
  
  if (env === "development") {
    log("Setting up Vite middleware");
    // Temporarily use fallback instead of Vite due to compilation issues
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        return;
      }
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dream Catcher - AI Dream Interpretation</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #ffffff;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      text-align: center; 
    }
    h1 { 
      color: #FFD700; 
      margin-bottom: 2rem;
      font-size: 2.5rem;
    }
    .status { 
      background: rgba(255, 215, 0, 0.1); 
      border: 1px solid #FFD700;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .api-test { 
      margin-top: 2rem; 
      padding: 1rem;
      background: rgba(0, 255, 0, 0.1);
      border-radius: 8px;
    }
    button {
      background: #FFD700;
      color: #000;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin: 8px;
    }
    button:hover { background: #FFC700; }
    .error { color: #ff6b6b; }
    .success { color: #4ecdc4; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌙 Dream Catcher</h1>
    
    <div class="status">
      <h3>App Status: ✅ Server Running</h3>
      <p>The Dream Catcher server is running successfully!</p>
      <p>Frontend compilation is temporarily bypassed while we resolve Vite configuration issues.</p>
    </div>

    <div class="api-test">
      <h4>API Test</h4>
      <button onclick="testAPI()">Test Health Endpoint</button>
      <div id="api-result"></div>
    </div>

    <div style="margin-top: 2rem;">
      <h4>Current Features Available:</h4>
      <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
        <li>✅ Express Server</li>
        <li>✅ API Routes (/health, /api/generate-title, /api/analyze-dream, /api/dream-themes)</li>
        <li>✅ OpenAI Integration</li>
        <li>🔄 Frontend (Temporarily Simplified)</li>
        <li>🔄 Vite Development Server (Under Repair)</li>
      </ul>
    </div>
  </div>

  <script>
    async function testAPI() {
      const resultDiv = document.getElementById('api-result');
      try {
        const response = await fetch('/health');
        const data = await response.json();
        resultDiv.innerHTML = '<div class="success">✅ API Working: ' + JSON.stringify(data) + '</div>';
      } catch (error) {
        resultDiv.innerHTML = '<div class="error">❌ API Error: ' + error.message + '</div>';
      }
    }
    
    // Auto-test API on load
    window.onload = () => testAPI();
  </script>
</body>
</html>
      `);
    });
  } else {
    log("Setting up static file serving");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
