
// Development-only testing utilities
export const isDevelopment = import.meta.env.MODE === 'development';

export class TestingUtils {
  static mockAudioRecording(): Promise<Blob> {
    if (!isDevelopment) throw new Error('Mock functions only available in development');
    
    // Create a simple audio blob for testing
    const duration = 5000; // 5 seconds
    const sampleRate = 44100;
    const channels = 1;
    const frameCount = sampleRate * (duration / 1000);
    
    const arrayBuffer = new ArrayBuffer(frameCount * 2);
    const dataView = new DataView(arrayBuffer);
    
    // Generate simple sine wave for testing
    for (let i = 0; i < frameCount; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
      dataView.setInt16(i * 2, sample * 32767, true);
    }
    
    return Promise.resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  }

  static mockDreamContent(): string {
    if (!isDevelopment) throw new Error('Mock functions only available in development');
    
    const dreams = [
      "I was flying over a vast ocean, feeling completely free and weightless.",
      "I found myself in my childhood home, but everything was slightly different.",
      "I was speaking to my grandmother who passed away years ago.",
      "I was running through a forest, being chased by something I couldn't see.",
      "I discovered a hidden room in my house filled with golden light."
    ];
    
    return dreams[Math.floor(Math.random() * dreams.length)];
  }

  static validateComponentProps(component: string, props: Record<string, any>) {
    if (!isDevelopment) return;
    
    console.log(`[Props Validation] ${component}:`, props);
    
    // Check for common issues
    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined) {
        console.warn(`[Props Warning] ${component}.${key} is undefined`);
      }
      if (typeof value === 'function' && !value.name) {
        console.warn(`[Props Warning] ${component}.${key} is an anonymous function`);
      }
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static start(label: string) {
    if (!isDevelopment) return;
    this.marks.set(label, performance.now());
  }

  static end(label: string) {
    if (!isDevelopment) return;
    const start = this.marks.get(label);
    if (start) {
      const duration = performance.now() - start;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      this.marks.delete(label);
    }
  }

  static measure<T>(label: string, fn: () => T): T {
    if (!isDevelopment) return fn();
    
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label);
    }
  }
}
