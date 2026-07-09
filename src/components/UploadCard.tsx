import React, { useState, useRef } from 'react';
import { UploadCloud, Eye, EyeOff, ShieldAlert, KeyRound, Clock, Flame, FileText, RefreshCw, XCircle, Lock, ShieldCheck, Cpu, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadFile, formatBytes } from '../lib/api';
import { FileMetadata } from '../types';

interface UploadCardProps {
  onUploadSuccess: (file: FileMetadata, deleteToken: string) => void;
}

export default function UploadCard({ onUploadSuccess }: UploadCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [expiry, setExpiry] = useState<string>('1h');
  const [downloadLimit, setDownloadLimit] = useState<string>('unlimited');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [codeType, setCodeType] = useState<'numeric' | 'alphanumeric'>('numeric');
  
  // Drag and Drop states
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploading states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadEta, setUploadEta] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave' || e.type === 'dragend') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const dropped = e.dataTransfer.files;
    if (!dropped || dropped.length === 0) return;
    const selectedList = Array.from(dropped) as File[];
    const oversized = selectedList.find(f => f.size > 5 * 1024 * 1024 * 1024);
    if (oversized) {
      setError('Each file must be less than 5GB.');
      return;
    }
    setFiles(prev => [...prev, ...selectedList]);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedList = Array.from(e.target.files) as File[];
      const oversized = selectedList.find(f => f.size > 5 * 1024 * 1024 * 1024);
      if (oversized) {
        setError('Each file must be less than 5GB.');
        return;
      }
      setFiles(prev => [...prev, ...selectedList]);
      setError('');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFileAt = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setError('');
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0) {
      setError('Please select or drag files first.');
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);
    setError('');

    try {
      const result = await uploadFile(
        files,
        expiry,
        downloadLimit,
        password,
        codeType,
        (percent, speed, eta) => {
          setUploadPercent(percent);
          setUploadSpeed(speed);
          setUploadEta(eta);
        }
      );

      // Trigger success callback
      onUploadSuccess(result.file, result.deleteToken);
    } catch (err: any) {
      setError(err.message || 'An error occurred during file upload.');
      setIsUploading(false);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div id="upload" className="surface-glass border-glass rounded-[32px] p-6 md:p-8 flex flex-col gap-5 relative overflow-hidden h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-indigo-400">Secure Upload</h2>
        <span className="font-mono text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          MAX 5GB
        </span>
      </div>

      {!isUploading ? (
        <>
          {/* Hidden file input - always mounted */}
          <input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange}
            className="hidden" 
            multiple
          />

          {/* File Drag and Drop Zone */}
          {files.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDragEnd={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`group relative h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-orange-400 bg-orange-400/5 shadow-[0_0_30px_rgba(251,146,60,0.15)] scale-[1.02]' 
                  : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/2 hover:scale-[1.01]'
              }`}
            >
              <UploadCloud 
                className={`w-12 h-12 mb-3 transition-all duration-300 ${
                  isDragActive 
                    ? 'text-orange-400 scale-125 animate-bounce' 
                    : 'text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300'
                }`} 
              />
              <p className="text-sm text-slate-300 text-center px-4 transition-all duration-300">
                {isDragActive ? (
                  <span className="text-orange-400 font-bold text-base animate-pulse">Release to drop your secure files! 🚀</span>
                ) : (
                  <>
                    <span className="text-white font-semibold">Drop your files here</span> or click to browse
                  </>
                )}
              </p>
              <p className={`text-[11px] mt-2 transition-colors duration-300 ${isDragActive ? 'text-orange-400/70 font-mono' : 'text-slate-500'}`}>
                {isDragActive ? 'Processing multi-file buffer...' : 'Images, Videos, PDF, ZIP, DOCX, APK up to 5GB'}
              </p>
            </div>
          ) : (
            /* Selected Files List Display */
            <div className="space-y-3">
              <div className="max-h-52 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                {files.map((f, idx) => (
                  <div key={idx} className="bg-white/2 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <FileText className="w-4.5 h-4.5 text-indigo-400" />
                      </div>
                      <div className="overflow-hidden col-span-1">
                        <p className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">{f.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{formatBytes(f.size)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFileAt(idx);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-xl px-4 py-3">
                <div className="text-xs text-slate-400">
                  Total: <span className="text-white font-semibold">{files.length}</span> {files.length === 1 ? 'file' : 'files'} ({formatBytes(totalSize)})
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearFiles}
                    className="text-xs font-mono font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={triggerFileSelect}
                    className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    + Add Files
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expiry select */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5 px-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Expiry Duration
              </label>
              <select 
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="10m">10 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="3d">3 Days</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            {/* Access limit select */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5 px-1">
                <Flame className="w-3.5 h-3.5 text-indigo-400" />
                Access Limit
              </label>
              <select 
                value={downloadLimit}
                onChange={(e) => setDownloadLimit(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="1">1 Download</option>
                <option value="5">5 Downloads</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>

            {/* Password input */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5 px-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Password Protection (Optional)
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create access key for this share..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Code Type selectors */}
            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-mono font-medium text-slate-400 px-1">Download Code Format</span>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setCodeType('numeric')}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    codeType === 'numeric'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                      : 'bg-white/2 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  6-Digit Numeric
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('alphanumeric')}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    codeType === 'alphanumeric'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                      : 'bg-white/2 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  8-Char Alphanumeric
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-mono text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 rounded-xl p-3 mt-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            onClick={handleUploadSubmit}
            disabled={files.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
              files.length > 0
                ? 'bg-gradient-to-r from-indigo-500 to-orange-400 text-white hover:brightness-110 shadow-lg shadow-indigo-500/20 cursor-pointer'
                : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            Generate Secure Link
          </button>
        </>
      ) : (
        /* Uploading State Dashboard with Advanced Process Animations */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col py-2 gap-5 h-full justify-between"
        >
          {/* Header Progress Hub */}
          <div className="text-center space-y-1.5">
            <div className="relative flex items-center justify-center mx-auto w-24 h-24">
              {/* Outer Pulsing Aura */}
              <motion.div 
                animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"
              ></motion.div>
              
              {/* Core Orbit Indicator */}
              <div className="absolute inset-0 rounded-full border-[3px] border-white/5"></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="43"
                  className="stroke-indigo-500 fill-none"
                  strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 43}`}
                  strokeDashoffset={`${2 * Math.PI * 43 * (1 - uploadPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>

              {/* Dynamic Icon Morphing based on progress */}
              <motion.div 
                key={uploadPercent < 15 ? 'prep' : uploadPercent < 50 ? 'crypt' : uploadPercent < 90 ? 'vault' : 'sign'}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 flex items-center justify-center"
              >
                {uploadPercent < 15 ? (
                  <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
                ) : uploadPercent < 50 ? (
                  <Lock className="w-8 h-8 text-amber-400 animate-bounce" />
                ) : uploadPercent < 90 ? (
                  <UploadCloud className="w-8 h-8 text-orange-400 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                )}
              </motion.div>
            </div>

            <h3 className="text-base font-extrabold text-white tracking-tight mt-3">
              {uploadPercent < 15 ? 'Initializing Protocol...' : 
               uploadPercent < 50 ? 'Symmetric AES-256 Crypt...' : 
               uploadPercent < 90 ? 'Streaming Encrypted Sectors...' : 
               'Replicating Node Indexes...'}
            </h3>
            
            <p className="text-xs text-slate-400 truncate max-w-xs mx-auto px-4 font-mono">
              {files.length === 1 ? files[0].name : `${files.length} files (${formatBytes(totalSize)})`}
            </p>
          </div>

          {/* Interactive Flow Diagram/Terminal Pipeline */}
          <div className="space-y-2.5 bg-black/35 border border-white/5 p-4 rounded-2xl">
            <p className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase mb-1.5 flex justify-between">
              <span>Security pipeline execution</span>
              <span className="text-indigo-400 animate-pulse">Running</span>
            </p>

            {/* Stage 1: Protocol Shake */}
            <div className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl transition-all ${
              uploadPercent > 15 ? 'bg-indigo-500/5 text-indigo-300' : 'text-slate-400'
            }`}>
              <div className="flex-shrink-0">
                {uploadPercent > 15 ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                    <Check className="w-3 h-3 text-indigo-400 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[11px]">INTEGRITY VALIDATION</p>
                <p className="text-[9px] text-slate-500 font-normal">SHA-256 pre-flight checks complete</p>
              </div>
            </div>

            {/* Stage 2: AES Crypt */}
            <div className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl transition-all ${
              uploadPercent > 50 ? 'bg-amber-500/5 text-amber-300' : 
              uploadPercent > 15 ? 'bg-white/5 text-white' : 'text-slate-500 opacity-60'
            }`}>
              <div className="flex-shrink-0">
                {uploadPercent > 50 ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                    <Check className="w-3 h-3 text-amber-400 stroke-[3]" />
                  </div>
                ) : uploadPercent > 15 ? (
                  <div className="w-5 h-5 rounded-full border border-amber-400/50 flex items-center justify-center bg-amber-400/5">
                    <Lock className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[9px]">2</div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[11px]">AES-256 E2E ENCRYPTION</p>
                <p className="text-[9px] text-slate-500 font-normal">
                  {uploadPercent > 50 ? 'Symmetric payloads sealed' : uploadPercent > 15 ? 'Encrypting sector chunks...' : 'Awaiting initialization'}
                </p>
              </div>
            </div>

            {/* Stage 3: Streaming blocks */}
            <div className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl transition-all ${
              uploadPercent > 90 ? 'bg-orange-500/5 text-orange-300' : 
              uploadPercent > 50 ? 'bg-white/5 text-white' : 'text-slate-500 opacity-60'
            }`}>
              <div className="flex-shrink-0">
                {uploadPercent > 90 ? (
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
                    <Check className="w-3 h-3 text-orange-400 stroke-[3]" />
                  </div>
                ) : uploadPercent > 50 ? (
                  <div className="w-5 h-5 rounded-full border border-orange-400/50 flex items-center justify-center bg-orange-400/5">
                    <RefreshCw className="w-2.5 h-2.5 text-orange-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[9px]">3</div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[11px]">TRANSMISSION STREAMING</p>
                <p className="text-[9px] text-slate-500 font-normal">
                  {uploadPercent > 90 ? 'Vault data blocks stored' : uploadPercent > 50 ? `Streaming: ${uploadSpeed || 'calculating...'}` : 'Awaiting payloads'}
                </p>
              </div>
            </div>

            {/* Stage 4: Indexing */}
            <div className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl transition-all ${
              uploadPercent === 100 ? 'bg-emerald-500/5 text-emerald-300' : 
              uploadPercent > 90 ? 'bg-white/5 text-white' : 'text-slate-500 opacity-60'
            }`}>
              <div className="flex-shrink-0">
                {uploadPercent === 100 ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  </div>
                ) : uploadPercent > 90 ? (
                  <div className="w-5 h-5 rounded-full border border-emerald-400/50 flex items-center justify-center bg-emerald-400/5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[9px]">4</div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[11px]">REPLICATING ACCESS INDEX</p>
                <p className="text-[9px] text-slate-500 font-normal">
                  {uploadPercent === 100 ? 'Safe-Guard node index synced' : uploadPercent > 90 ? 'Verifying sector hashes...' : 'Awaiting lock registration'}
                </p>
              </div>
            </div>
          </div>

          {/* Core Multi-indicator Progress slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-indigo-400 font-semibold">{uploadSpeed || 'Encrypting blocks...'}</span>
              <span className="text-orange-400 font-extrabold">{uploadPercent}%</span>
            </div>
            
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-amber-400 to-orange-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ width: `${uploadPercent}%` }}
              >
                {/* Flow highlights */}
                <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-2/3 h-full animate-[shimmer_1.5s_infinite]"></span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>ETA: {uploadPercent === 100 ? 'Finalizing link...' : (uploadEta || 'Awaiting speed...')}</span>
              <span>{formatBytes(totalSize * (uploadPercent / 100))} of {formatBytes(totalSize)}</span>
            </div>
          </div>

          {/* Abort button */}
          <button 
            onClick={() => setIsUploading(false)}
            className="w-full py-3 text-xs font-mono text-slate-400 hover:text-white border border-white/5 hover:border-white/15 bg-white/1 hover:bg-white/2 rounded-xl transition-all cursor-pointer select-none font-bold"
          >
            ABORT SECURE TRANSMISSION
          </button>
        </motion.div>
      )}
    </div>
  );
}
