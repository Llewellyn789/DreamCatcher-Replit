import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./index.css";

const cacheVersion = Date.now();
console.log(`App version: ${cacheVersion}`);

// Track returning users
const hasOpened = localStorage.getItem('dc_has_opened');
if (hasOpened) {
  import('./analytics').then(({ track }) => track('return_open'));
} else {
  localStorage.setItem('dc_has_opened', '1');
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Track PWA installation
window.addEventListener('appinstalled', () => {
  import('./analytics').then(({ track }) => track('pwa_installed'));
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App key={cacheVersion} />
  </AppErrorBoundary>
);
