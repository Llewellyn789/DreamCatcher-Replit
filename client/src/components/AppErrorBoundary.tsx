import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(): State {
    // Generate a simple error ID for user reference
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (no sensitive dream content)
    console.error('App Error Boundary caught an error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(this.state.errorId);
    } catch {
      // Fallback if clipboard API fails
      console.log('Error ID:', this.state.errorId);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen cosmic-bg-950 flex items-center justify-center p-6">
          <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 cosmic-text-200">
              <AlertTriangle className="w-full h-full" />
            </div>
            
            <h1 className="text-2xl font-bold cosmic-text-50 mb-4">
              Something went wrong
            </h1>
            
            <p className="cosmic-text-300 mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry - your dreams are safe. 
              Try reloading the app to get back on track.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={this.handleReload}
                className="gradient-gold cosmic-text-950 text-base px-6 py-3 h-12 w-full font-medium"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reload App
              </Button>
              
              <Button
                onClick={this.handleCopyErrorId}
                variant="ghost"
                className="cosmic-text-300 hover:cosmic-text-50 text-sm px-4 py-2 h-10 w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Error ID: {this.state.errorId}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}