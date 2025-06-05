// PWA Service Worker Registration and Installation
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Register service worker with better error handling
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateAvailable();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.warn('Service Worker not available, continuing without offline support');
      return null;
    }
  }
  return null;
};

// Handle app install prompt
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallBanner();
    deferredPrompt = null;
  });
};

// Show install banner
const showInstallBanner = () => {
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #000;
    padding: 12px 20px;
    border-radius: 25px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
    z-index: 1000;
    cursor: pointer;
    user-select: none;
    animation: slideUp 0.3s ease-out;
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span>📱 Install DreamCatcher</span>
      <button id="install-close" style="background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Add animation keyframes
  if (!document.getElementById('install-animation')) {
    const style = document.createElement('style');
    style.id = 'install-animation';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  banner.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id !== 'install-close') {
      installApp();
    }
  });
  
  banner.querySelector('#install-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideInstallBanner();
  });
};

// Hide install banner
const hideInstallBanner = () => {
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
};

// Install the app
export const installApp = async () => {
  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      deferredPrompt = null;
      hideInstallBanner();
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  }
};

// Show update available notification
const showUpdateAvailable = () => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a2e;
    color: #FFD700;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    border: 1px solid #FFD700;
    z-index: 1000;
    cursor: pointer;
  `;
  
  notification.textContent = 'New version available! Tap to update.';
  document.body.appendChild(notification);
  
  notification.addEventListener('click', () => {
    window.location.reload();
  });
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
};

// Check for updates periodically
export const checkForUpdates = () => {
  if ('serviceWorker' in navigator) {
    setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }, 60000); // Check every minute
  }
};

// Initialize PWA features
export const initPWA = () => {
  registerSW();
  setupInstallPrompt();
  checkForUpdates();
  
  // Add mobile-specific optimizations
  addMobileOptimizations();
};

// Mobile optimizations
const addMobileOptimizations = () => {
  // Prevent bounce scrolling on iOS
  document.body.style.overscrollBehavior = 'none';
  
  // Prevent zoom on input focus
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  });
  
  // Improve touch responsiveness
  document.addEventListener('touchstart', () => {}, { passive: true });
};