import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-900/10 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-2">
              Sistem Çöktü
            </h2>
            <p className="text-slate-600/70 text-sm mb-8 leading-relaxed">
              Uygulamanın çalışmasını engelleyen kritik bir hata oluştu.
              {this.state.error && (
                <span className="block mt-2 text-xs font-mono bg-slate-100 p-2 rounded text-slate-500 overflow-x-auto text-left">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-3 font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-all active:scale-95"
            >
              <RefreshCcw className="w-4 h-4" /> Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
