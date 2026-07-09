import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Lock, ShieldAlert, FileText, Clock, Hash, CheckCircle2 } from 'lucide-react';
import { FileMetadata } from '../types';
import { downloadFile, formatBytes } from '../lib/api';

interface DownloadViewProps {
  file: FileMetadata;
  onReset: () => void;
}

export default function DownloadView({ file, onReset }: DownloadViewProps) {
  const [password, setPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Time left calculation
  useEffect(() => {
    const updateTimer = () => {
      const diff = +new Date(file.expiry) - +new Date();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      
      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      const formatted = [
        days > 0 ? `${days}d ` : '',
        String(hrs).padStart(2, '0'),
        String(mins).padStart(2, '0'),
        String(secs).padStart(2, '0')
      ].filter(Boolean).join(':');

      setTimeLeft(formatted.replace('d :', 'd '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [file.expiry]);

  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (file.isPasswordProtected && !password.trim()) {
      setError('Password is required for this file.');
      return;
    }

    setIsDownloading(true);
    setError('');

    try {
      await downloadFile(file.code, password);
      setSuccess(true);
      
      // Auto-reset success text after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Download failed. Please verify the password.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleIndividualDownload = async (fileId: string, originalName: string) => {
    if (file.isPasswordProtected && !password.trim()) {
      setError('Password is required to download this file.');
      return;
    }

    setIsDownloading(true);
    setError('');

    try {
      await downloadFile(file.code, password, fileId);
    } catch (err: any) {
      setError(err.message || `Download failed for ${originalName}.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileExtensionLabel = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF') return 'Portable Document Format';
    if (ext === 'ZIP' || ext === 'RAR' || ext === 'TAR' || ext === 'GZ') return 'Compressed Archive';
    if (ext === 'MP4' || ext === 'MKV' || ext === 'AVI' || ext === 'MOV') return 'Video File';
    if (ext === 'MP3' || ext === 'WAV' || ext === 'FLAC') return 'Audio Stream';
    if (ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' || ext === 'GIF' || ext === 'WEBP') return 'Image Graphic';
    if (ext === 'APK') return 'Android Installation Package';
    return `${ext} Document`;
  };

  const isMultiFile = file.files && file.files.length > 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-12 relative z-10">
      {/* Back to main */}
      <button 
        onClick={onReset}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK_TO_TERMINAL
      </button>

      {/* Main Download Card */}
      <div className="surface-glass border-glass p-6 md:p-8 rounded-[32px] relative overflow-hidden">
        
        {/* File Preview Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
            <FileText className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="space-y-1 w-full">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white line-clamp-2 px-2" title={file.originalName}>
              {file.originalName}
            </h1>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              {formatBytes(file.fileSize)} • {isMultiFile ? 'ZIP Collection' : getFileExtensionLabel(file.originalName)}
            </p>
          </div>
        </div>

        {/* Files List for Multi-file Collection */}
        {file.files && file.files.length > 0 && (
          <div className="mb-6 space-y-2">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-1">
              Share Collection ({file.files.length} {file.files.length === 1 ? 'item' : 'items'})
            </span>
            <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
              {file.files.map((sub) => (
                <div key={sub.id} className="bg-white/2 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate max-w-[160px] sm:max-w-[200px]" title={sub.originalName}>
                        {sub.originalName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{formatBytes(sub.fileSize)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleIndividualDownload(sub.id, sub.originalName)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/10 hover:border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>GET</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Chips Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
            <span className="font-mono text-[9px] text-orange-400 uppercase tracking-wider opacity-80">Transient Status</span>
            <div className="flex items-center gap-1.5 text-white">
              <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span className="font-mono text-[11px] font-bold truncate">
                {timeLeft === 'Expired' ? 'Expired' : `Expires in ${timeLeft}`}
              </span>
            </div>
          </div>

          <div className="bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
            <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-wider opacity-80">Availability</span>
            <div className="flex items-center gap-1.5 text-white">
              <Hash className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="font-sans text-xs font-bold truncate">
                {file.downloadLimit === null
                  ? 'Unlimited Downloads'
                  : `${Math.max(0, file.downloadLimit - file.downloadCount)} downloads left`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Download / Password Form */}
        <form onSubmit={handleDownloadSubmit} className="space-y-4">
          
          {/* Conditional Password Fields */}
          {file.isPasswordProtected && (
            <div className="space-y-1.5 relative group">
              <label className="sr-only" htmlFor="password">File Password</label>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter file password..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all-smooth"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-xs font-mono text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 rounded-xl p-3">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs font-mono text-green-300 bg-green-950/20 border border-green-500/30 rounded-xl p-3">
              <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Success! Initializing secure download stream.</span>
            </div>
          )}

          {/* Download Trigger Button */}
          <button
            type="submit"
            disabled={isDownloading}
            className={`w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
              isDownloading
                ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-orange-400 hover:brightness-110 shadow-lg shadow-indigo-500/20 cursor-pointer'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validating Secret Nodes...
              </>
            ) : (
              <>
                <Download className="w-4.5 h-4.5" />
                {isMultiFile ? 'Download All (ZIP)' : 'Download Now'}
              </>
            )}
          </button>

          <p className="text-center font-mono text-[9px] text-slate-500 pt-1">
            By clicking download, you agree to our transient data guidelines.
          </p>
        </form>
      </div>
    </div>
  );
}
