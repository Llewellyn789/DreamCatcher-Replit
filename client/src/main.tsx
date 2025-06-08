import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force cache refresh - disable PWA temporarily
const cacheVersion = Date.now();
console.log(`App version: ${cacheVersion}`);

// Clear all caches and force reload
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App key={cacheVersion} />);
