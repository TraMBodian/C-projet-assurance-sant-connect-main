import React from 'react';
import { RefreshCw, AlertTriangle } from '@/components/ui/Icons';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <AlertTriangle size={48} className="text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Une erreur inattendue s'est produite</h1>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || "Veuillez recharger la page ou contacter le support."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={15} />
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
