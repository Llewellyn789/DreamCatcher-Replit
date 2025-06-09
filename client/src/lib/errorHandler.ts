
import { toast } from "@/hooks/use-toast";

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUDIO = 'AUDIO',
  API = 'API',
  PERMISSION = 'PERMISSION'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
}

export class ErrorHandler {
  static log(error: AppError) {
    console.error(`[${error.type}] ${error.message}`, {
      originalError: error.originalError,
      context: error.context,
      timestamp: new Date().toISOString()
    });
  }

  static handle(error: AppError, showToast = true) {
    this.log(error);
    
    if (showToast) {
      toast({
        title: "Error",
        description: this.getUserFriendlyMessage(error),
        variant: "destructive"
      });
    }
  }

  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return "Network connection issue. Please check your internet connection.";
      case ErrorType.AUDIO:
        return "Audio recording issue. Please check your microphone permissions.";
      case ErrorType.PERMISSION:
        return "Permission denied. Please allow microphone access.";
      case ErrorType.VALIDATION:
        return error.message;
      case ErrorType.API:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  static createError(type: ErrorType, message: string, originalError?: Error, context?: Record<string, any>): AppError {
    return { type, message, originalError, context };
  }
}

// Utility function for API calls
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    const appError = ErrorHandler.createError(
      ErrorType.API,
      error instanceof Error ? error.message : 'Unknown API error',
      error instanceof Error ? error : undefined,
      context
    );
    return { success: false, error: appError };
  }
}
