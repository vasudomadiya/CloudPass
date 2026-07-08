import React from 'react';
import { Upload, ArrowRight, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onRetrieveClick: () => void;
}

export default function Hero({ onUploadClick, onRetrieveClick }: HeroProps) {
  return (
    <section className="text-center py-12 md:py-16 max-w-4xl mx-auto px-4 select-none relative z-10">
      {/* Encryption Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 backdrop-blur-md">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-mono tracking-wider text-indigo-400 uppercase">
          <span className="text-indigo-400 mr-1.5 font-sans">●</span> Client-Side Zero Knowledge Ready
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1] font-display">
        Share files <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-orange-300 text-glow">instantly</span> via code.
      </h1>

      {/* Description */}
      <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
        Secure, temporary storage for the modern web. No registration, no tracking. Upload once, share the 6-digit code, and let the file disappear when done.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onUploadClick}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-orange-400 text-white font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/20 group cursor-pointer"
        >
          <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          Upload Secure File
        </button>

        <button
          onClick={onRetrieveClick}
          className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          Retrieve Data Code
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Hero Stats bento blocks from the theme */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-12">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <div className="text-indigo-400 font-bold text-xl mb-1">5GB Limit</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Free Instant Tier</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <div className="text-orange-400 font-bold text-xl mb-1">AES-256</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">End-to-End Encryption</div>
        </div>
      </div>
    </section>
  );
}
