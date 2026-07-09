import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Copy, Share2, MessageSquare, Send, Mail, FileText, Database, Clock, Download, Trash2, ArrowLeft, Check } from 'lucide-react';
import { FileMetadata } from '../types';
import { formatBytes, deleteFileEarly } from '../lib/api';

interface SuccessViewProps {
  file: FileMetadata;
  deleteToken: string;
  onReset: () => void;
}

export default function SuccessView({ file, deleteToken, onReset }: SuccessViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Direct download link computation
  const directLink = `${window.location.origin}/?code=${file.code}`;

  // Countdown timer calculation
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

  // Success confetti animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      color: string;
      size: number;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    const colors = ['#6366f1', '#fb923c', '#3b82f6', '#818cf8', '#ffffff'];

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Generate particles
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 8 + Math.random() * 14;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3, // slightly upward gravity drift
        alpha: 1
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.alpha -= 0.012;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      particles = particles.filter(p => p.alpha > 0);

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(file.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDeleteEarly = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset confirmation after 5 seconds of inactivity
      setTimeout(() => {
        setConfirmDelete(false);
      }, 5000);
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteFileEarly(file.code, deleteToken);
      setDeleteSuccess(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete file.');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
      {/* Background canvas for celebration */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Back button */}
      <button 
        onClick={onReset}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK_TO_TERMINAL
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Code action & Share options */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                File Successfully Encrypted
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Your link is ready.</h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Share this temporary download code or direct secure URL. All file blocks will self-destruct once the countdown timer below hits zero.
            </p>
          </div>

          {/* Access Code Bento Card */}
          <div className="surface-glass border-glass rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">TEMP ACCESS CODE</span>
                <span className="font-mono text-xs text-orange-400 animate-pulse">● LIVE NOW</span>
              </div>

              <div className="flex items-center justify-center py-6">
                <span className="text-5xl md:text-7xl tracking-[0.1em] text-indigo-400 text-glow font-bold font-mono">
                  {file.code}
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={copyCode}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-orange-400 text-white py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      COPIED CODE
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      COPY CODE
                    </>
                  )}
                </button>

                <button
                  onClick={copyDirectLink}
                  className="flex-1 surface-glass hover:bg-white/10 border border-white/10 text-white py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-orange-400" />
                      COPIED DIRECT LINK
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-orange-400" />
                      COPY DIRECT LINK
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Social Quick-share Channels */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Retrieve my file on CloudPass using code: ${file.code} or link: ${directLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[140px] bg-[#25D366]/10 border border-[#25D366]/30 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-all text-center"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>

            <a
              href={`https://telegram.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(`Retrieve my file on CloudPass using code: ${file.code}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[140px] bg-[#0088cc]/10 border border-[#0088cc]/30 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 text-[#0088cc] text-xs font-bold hover:bg-[#0088cc]/20 transition-all text-center"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent("Secure Temporary File Sharing via CloudPass")}&body=${encodeURIComponent(`Hi,\n\nI have shared a file with you on CloudPass.\n\nDownload code: ${file.code}\nSecure link: ${directLink}\n\nThis file will automatically delete after ${file.expiryDuration}.\n\nRegards`)}`}
              className="flex-1 min-w-[140px] bg-white/5 border border-white/10 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 text-white text-xs font-bold hover:bg-white/10 transition-all text-center"
            >
              <Mail className="w-4 h-4 text-slate-300" />
              Email Link
            </a>
          </div>
        </div>

        {/* Right column: Specs, Expire & Destruct */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* QR Code generator */}
          <div className="surface-glass border-glass rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-full aspect-square max-w-[200px] bg-white rounded-xl p-3 flex items-center justify-center relative overflow-hidden border border-white/5">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0c0c0e&data=${encodeURIComponent(directLink)}`}
                alt="CloudPass QR Code Share Link"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Scan to download on mobile</p>
          </div>

          {/* Metadata Specs card */}
          <div className="surface-glass border-glass rounded-[32px] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/2">
              <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest font-bold">TRANSIENT_FILE_METADATA</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Filename */}
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 text-xs flex items-center gap-2 font-sans">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Filename
                </span>
                <span className="text-white text-xs font-semibold font-sans truncate max-w-[180px]" title={file.originalName}>
                  {file.originalName}
                </span>
              </div>

              {/* Size */}
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 text-xs flex items-center gap-2 font-sans">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Size
                </span>
                <span className="text-white text-xs font-mono font-semibold">
                  {formatBytes(file.fileSize)}
                </span>
              </div>

              {/* Expiry Countdown */}
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 text-xs flex items-center gap-2 font-sans">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Expiry Countdown
                </span>
                <span className="text-orange-400 text-xs font-mono font-bold tracking-wider">
                  {timeLeft || 'Calculating...'}
                </span>
              </div>

              {/* Download limit */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400 text-xs flex items-center gap-2 font-sans">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Downloads Allowed
                </span>
                <span className="text-white text-xs font-sans font-semibold">
                  {file.downloadLimit === null ? 'Unlimited' : `${file.downloadLimit} Remaining`}
                </span>
              </div>
            </div>

            {/* Delete Early (Admin action) */}
            <div className="p-4 bg-[#ffb4ab]/5 border-t border-[#ffb4ab]/10">
              {deleteSuccess ? (
                <div className="py-2.5 text-center text-xs font-semibold text-[#ffb4ab] font-mono bg-[#93000a]/20 border border-[#93000a]/30 rounded-xl">
                  File successfully wiped from cloud nodes.
                </div>
              ) : (
                <>
                  <button
                    onClick={handleDeleteEarly}
                    disabled={isDeleting}
                    className={`w-full py-3 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 ${
                      confirmDelete 
                        ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                        : 'border-[#ffb4ab]/20 text-[#ffb4ab] hover:bg-[#ffb4ab] hover:text-[#690005]'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
                    {isDeleting 
                      ? 'SCRUBBING FILES...' 
                      : confirmDelete 
                        ? 'CONFIRM PERMANENT WIPEOUT!' 
                        : 'DELETE EARLY'}
                  </button>
                  <p className="text-center font-mono text-[9px] text-slate-500 mt-2">
                    {confirmDelete 
                      ? 'Click again within 5s to securely shred all blocks.' 
                      : 'Caution: This bypasses timers and deletes the file forever.'}
                  </p>
                </>
              )}

              {deleteError && (
                <p className="text-center font-mono text-xs text-[#ffb4ab] mt-2">{deleteError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
