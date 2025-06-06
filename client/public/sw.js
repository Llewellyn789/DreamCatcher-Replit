const CACHE_NAME = 'dreamcatcher-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Basic fetch handler
self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
  return;
});