import React from "react";
import { Cloud, Lock, Settings } from "lucide-react";

interface HeaderProps {
  onNavigate: (view: "main" | "download-input") => void;
  currentView: "main" | "success" | "download" | "error";
}

export default function Header({ onNavigate, currentView }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/5">
      <nav className="flex justify-between items-center px-4 md:px-10 h-16 max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <button
          type="button"
          onClick={() => onNavigate("main")}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg"
          aria-label="Return to home"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-orange-400 shadow-lg shadow-indigo-500/20">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white select-none">
            Cloud<span className="text-indigo-400">Pass</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Auto-Heal Active
          </span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("main")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
              currentView === "main"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20"
                : "bg-gradient-to-r from-indigo-500 to-orange-400 text-white hover:brightness-110 shadow-md shadow-indigo-500/10"
            }`}
          >
            {currentView === "main" ? "Upload Hub" : "Share File"}
          </button>
        </div>
      </nav>
    </header>
  );
}
