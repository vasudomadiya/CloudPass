import { StrictMode, Component, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-[#93000a]/10 border border-[#93000a]/30 rounded-2xl p-8 space-y-4 text-center">
            <h1 className="text-xl font-bold text-[#ffb4ab]">Something went wrong</h1>
            <p className="text-sm text-slate-400 font-mono break-all">
              {(this.state.error as Error).message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono uppercase transition-all"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
