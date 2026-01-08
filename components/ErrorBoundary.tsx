import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary to catch and handle React errors gracefully
 * Prevents the app from showing a blank screen on Netlify
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <Icon name="close" size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-serif text-white mb-4">
              Bir Sorun Oluştu
            </h1>
            <p className="text-gray-400 mb-6">
              Uygulamayı yüklerken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-lg font-bold transition-colors"
            >
              Sayfayı Yenile
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  Hata Detayı
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-black/30 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
