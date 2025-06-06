// Simple PWA registration
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
    } catch (error) {
      console.log('Service Worker registration failed');
    }
  }
};

// Mobile optimizations
export const addMobileOptimizations = () => {
  // Prevent bounce scrolling on iOS
  document.body.style.overscrollBehavior = 'none';
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  });
  
  // Improve touch responsiveness
  document.addEventListener('touchstart', () => {}, { passive: true });
};

// Initialize PWA features
export const initPWA = () => {
  registerSW();
  addMobileOptimizations();
};