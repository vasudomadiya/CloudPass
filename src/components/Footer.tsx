import React from "react";
import { Cloud } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-24 border-t border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center py-8 px-4 md:px-10 gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 mb-1 cursor-pointer">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span className="font-sans font-bold text-sm tracking-tight text-white">
              Cloud<span className="text-orange-400">Pass</span>
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500">
            © 2026 CloudPass. Developed by Vasu Domadiya. Secure. Transient.
            Clear.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
          <span className="hover:text-white transition-colors cursor-pointer">
            Privacy
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Terms
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Status
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            API Docs
          </span>
        </div>
      </div>
    </footer>
  );
}
