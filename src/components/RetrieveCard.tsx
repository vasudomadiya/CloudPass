import React, { useState } from 'react';
import { KeyRound, ArrowRight, CircleAlert } from 'lucide-react';
import { fetchFileInfo } from '../lib/api';
import { FileMetadata } from '../types';

interface RetrieveCardProps {
  onRetrieveSuccess: (file: FileMetadata) => void;
  initialCode?: string;
}

export default function RetrieveCard({ onRetrieveSuccess, initialCode = '' }: RetrieveCardProps) {
  const [code, setCode] = useState<string>(initialCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFetchFile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a valid download code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Look up file metadata from server
      const fileData = await fetchFileInfo(code.trim().toUpperCase());
      onRetrieveSuccess(fileData);
    } catch (err: any) {
      setError(err.message || 'Invalid download code or file has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="retrieve" className="surface-glass border-glass rounded-[32px] p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden min-h-[340px]">
      <div className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-indigo-400">Retrieve File</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Enter the unique 6-digit numeric or 8-character alphanumeric code provided by the sender.
        </p>
      </div>

      <form onSubmit={handleFetchFile} className="my-6 space-y-4">
        {/* Monospace Code Input Grid */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
            <KeyRound className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12));
              setError('');
            }}
            placeholder="E.G. 846251 OR A8KD7XQ2"
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-center text-lg font-mono font-bold tracking-[0.15em] text-orange-400 uppercase placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all-smooth"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 text-xs font-mono text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 rounded-xl p-3">
            <CircleAlert className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className="space-y-4">
        <button
          onClick={() => handleFetchFile()}
          disabled={isLoading || !code.trim()}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
            code.trim() && !isLoading
              ? 'bg-gradient-to-r from-indigo-500 to-orange-400 text-white hover:brightness-110 shadow-lg shadow-indigo-500/20 cursor-pointer'
              : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCwSpinner className="w-4 h-4 animate-spin" />
              Locating Secure Node...
            </>
          ) : (
            <>
              Fetch Download
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2 justify-center text-slate-500">
          <ShieldSecureIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[10px] tracking-wider uppercase">Secure, Encrypted Transfer</span>
        </div>
      </div>
    </div>
  );
}

// Micro icons inline for maximum speed and dependency insulation
function RefreshCwSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function ShieldSecureIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
