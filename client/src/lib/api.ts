interface QueuedRequest {
  path: string;
  options: RequestInit;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
  retryCount: number;
}

class ApiRequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 400; // Base delay for exponential backoff

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      try {
        const response = await this.executeRequest(request);
        request.resolve(response);
      } catch (error) {
        request.reject(error as Error);
      }

      // Rate limit: wait before processing next request
      if (this.queue.length > 0) {
        await this.delay(this.RATE_LIMIT_DELAY);
      }
    }

    this.isProcessing = false;
  }

  private async executeRequest(request: QueuedRequest): Promise<Response> {
    try {
      const response = await fetch(request.path, request.options);

      // Check if we should retry
      if (this.shouldRetry(response.status) && request.retryCount < this.MAX_RETRIES) {
        const retryDelay = this.BASE_RETRY_DELAY * Math.pow(2, request.retryCount);
        await this.delay(retryDelay);
        
        const retryRequest: QueuedRequest = {
          ...request,
          retryCount: request.retryCount + 1
        };

        return this.executeRequest(retryRequest);
      }

      // Handle error responses with friendly messages
      if (!response.ok) {
        throw new Error(this.getErrorMessage(response.status, response.statusText));
      }

      return response;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error("You're offline. Please check your connection and try again.");
      }
      
      // Re-throw API errors as-is, or network errors with friendly message
      if (error instanceof Error && error.message.startsWith("You're offline") || 
          error instanceof Error && (error.message.includes("rate limit") || 
                                   error.message.includes("server error") ||
                                   error.message.includes("timeout"))) {
        throw error;
      }

      // Generic network error
      throw new Error("Connection failed. Please try again in a moment.");
    }
  }

  private shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  private getErrorMessage(status: number, _statusText: string): string {
    switch (status) {
      case 429:
        return "We're receiving a lot of requests right now. Please wait a moment and try again.";
      case 500:
        return "Our servers are having some trouble. Please try again in a few moments.";
      case 502:
      case 503:
      case 504:
        return "Service temporarily unavailable. Please try again shortly.";
      case 401:
        return "Authentication required. Please check your API key.";
      case 403:
        return "Access denied. Please check your permissions.";
      case 404:
        return "Service not found. Please try again later.";
      default:
        return `Server error (${status}). Please try again later.`;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async request(path: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        path,
        options,
        resolve,
        reject,
        retryCount: 0
      };

      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }
}

// Create a singleton instance
const apiQueue = new ApiRequestQueue();

/**
 * Rate-limited API request function with exponential backoff retry logic.
 * Queues requests to process ~1 per second and retries on 429/5xx errors.
 * 
 * @param path - API endpoint path (e.g., '/api/analyze-dream')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response> - The response object
 * @throws Error with user-friendly message for network/server errors
 */
export const request = (path: string, options: RequestInit = {}): Promise<Response> => {
  return apiQueue.request(path, options);
};

/**
 * Convenience function for JSON API requests with automatic parsing.
 * Handles rate limiting, retries, and error messaging automatically.
 * 
 * @param path - API endpoint path
 * @param options - Fetch options
 * @returns Promise<any> - Parsed JSON response
 */
export const requestJson = async (path: string, options: RequestInit = {}): Promise<any> => {
  const response = await request(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
};