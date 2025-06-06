// PWA Install prompt interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Enhanced PWA registration with update handling
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered');
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - could show update notification
              console.log('New version available');
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

// Install prompt handling
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Show custom install button or banner
    showInstallPrompt();
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    deferredPrompt = null;
    hideInstallPrompt();
  });
};

// Show install prompt
const showInstallPrompt = () => {
  // Create install banner
  const installBanner = document.createElement('div');
  installBanner.id = 'install-banner';
  installBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #000;
    padding: 12px 16px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  `;
  
  installBanner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; max-width: 500px; margin: 0 auto;">
      <span>📱 Install DreamCatcher for the best experience</span>
      <div>
        <button id="install-btn" style="background: #000; color: #FFD700; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer;">Install</button>
        <button id="dismiss-btn" style="background: transparent; border: none; color: #000; cursor: pointer; font-size: 18px;">×</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  // Animate in
  setTimeout(() => {
    installBanner.style.transform = 'translateY(0)';
  }, 100);
  
  // Handle install button click
  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Install prompt ${outcome}`);
      deferredPrompt = null;
      hideInstallPrompt();
    }
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    hideInstallPrompt();
  });
};

// Hide install prompt
const hideInstallPrompt = () => {
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => banner.remove(), 300);
  }
};

// Device detection and responsive handling
const detectDevice = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android.*Tablet|Windows.*Touch/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const isMacChrome = /Mac.*Chrome/i.test(userAgent);
  
  // Force mobile layout for narrow viewports even on desktop
  const isNarrowViewport = window.innerWidth <= 768;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isMacChrome,
    isNarrowViewport,
    shouldUseMobileLayout: isMobile || isNarrowViewport
  };
};

// Advanced mobile optimizations
export const addMobileOptimizations = () => {
  const device = detectDevice();
  
  // Add device classes to body for CSS targeting
  document.body.classList.add(
    device.isMobile ? 'device-mobile' : 'device-desktop',
    device.shouldUseMobileLayout ? 'layout-mobile' : 'layout-desktop'
  );
  
  if (device.isMacChrome) {
    document.body.classList.add('mac-chrome');
  }
  
  // Prevent bounce scrolling on iOS
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';
  
  // Prevent zoom on input focus (iOS and mobile browsers)
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
  
  // Force mobile behavior on narrow desktop windows
  const handleResize = () => {
    const currentDevice = detectDevice();
    document.body.classList.toggle('layout-mobile', currentDevice.shouldUseMobileLayout);
    document.body.classList.toggle('layout-desktop', !currentDevice.shouldUseMobileLayout);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Handle orientation changes with proper viewport adjustment
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      // Trigger resize to fix potential layout issues
      window.dispatchEvent(new Event('resize'));
    }, 100);
  });
  
  // Improve touch responsiveness
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });
  
  // Prevent pull-to-refresh on mobile
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) return;
    
    // Prevent pull-to-refresh when at top of page
    const touch = e.touches[0];
    const target = e.target as Element;
    
    if (window.scrollY === 0 && touch.clientY > touch.clientX) {
      // Only prevent if scrolling down from top
      const scrollable = target.closest('[data-scrollable]') || 
                        target.closest('.overflow-auto') ||
                        target.closest('.overflow-y-auto');
      
      if (!scrollable) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  // Add safe area CSS variables for notched devices
  const addSafeAreaSupport = () => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .safe-area-top {
        padding-top: max(1rem, env(safe-area-inset-top));
      }
      
      .safe-area-bottom {
        padding-bottom: max(1rem, env(safe-area-inset-bottom));
      }
      
      .safe-area-left {
        padding-left: max(1rem, env(safe-area-inset-left));
      }
      
      .safe-area-right {
        padding-right: max(1rem, env(safe-area-inset-right));
      }
    `;
    document.head.appendChild(style);
  };
  
  addSafeAreaSupport();
  
  // Handle keyboard events for better mobile experience
  if ('visualViewport' in window) {
    const viewport = window.visualViewport!;
    
    const handleViewportChange = () => {
      document.documentElement.style.setProperty('--viewport-height', `${viewport.height}px`);
    };
    
    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();
  }
  
  // Add mobile-specific CSS
  const mobileCss = document.createElement('style');
  mobileCss.textContent = `
    /* Mobile optimizations */
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    
    input, textarea, button, select {
      -webkit-appearance: none;
      border-radius: 0;
    }
    
    /* Prevent text selection on touch */
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Full viewport height considering keyboard */
    .full-height {
      height: 100vh;
      height: var(--viewport-height, 100vh);
    }
    
    /* Loading states optimized for mobile */
    .loading-spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(mobileCss);
};

// Network status handling
export const setupNetworkHandling = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    document.body.classList.toggle('offline', !isOnline);
    
    if (!isOnline) {
      showOfflineNotification();
    } else {
      hideOfflineNotification();
    }
  };
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
};

// Offline notification
const showOfflineNotification = () => {
  const notification = document.createElement('div');
  notification.id = 'offline-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateY(100px);
    transition: transform 0.3s ease;
  `;
  notification.textContent = '📡 You are currently offline. Some features may be limited.';
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
  }, 100);
};

const hideOfflineNotification = () => {
  const notification = document.getElementById('offline-notification');
  if (notification) {
    notification.style.transform = 'translateY(100px)';
    setTimeout(() => notification.remove(), 300);
  }
};

// Initialize all PWA features
export const initPWA = () => {
  registerSW();
  setupInstallPrompt();
  addMobileOptimizations();
  setupNetworkHandling();
  
  // Add PWA ready class to body
  document.body.classList.add('pwa-ready');
  
  console.log('PWA initialized with enhanced mobile features');
};