import React from 'react';
import { Bolt, Shield, Timer, EyeOff, Terminal, KeyRound } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Bolt className="w-5 h-5 text-indigo-400" />,
      title: 'Instant Transfer',
      desc: 'Proprietary node-routing ensures your files move at the speed of your connection. No artificial throttling or limits.'
    },
    {
      icon: <Shield className="w-5 h-5 text-orange-400" />,
      title: 'Military Grade Encryption',
      desc: 'End-to-end client-side encryption option safeguards your files. Keys never touch our database servers directly.'
    },
    {
      icon: <Timer className="w-5 h-5 text-indigo-400" />,
      title: 'Auto-Destruct Protocol',
      desc: 'Set custom expiry timers or download thresholds. Once met, files are completely scrubbed from disk instantly.'
    }
  ];

  return (
    <section className="mt-20 max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <span className="font-mono text-xs font-semibold tracking-widest text-orange-400 uppercase">SYSTEM CAPABILITIES</span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 font-display">Ephemeral Sharing Redefined</h2>
        <p className="text-slate-400 text-sm md:text-base mt-2 font-sans">The future of temporary transit. No accounts, no cookies, pure privacy.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feat, idx) => (
          <div 
            key={idx}
            className="surface-glass p-6 md:p-8 rounded-[24px] border-glass hover:border-indigo-500/40 transition-all duration-300 flex flex-col gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
              {feat.icon}
            </div>
            <h3 className="text-lg font-bold text-white">{feat.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
          </div>
        ))}

        {/* Zero Identity Barrier (Wide Card) */}
        <div className="md:col-span-2 surface-glass p-6 md:p-8 rounded-[24px] border-glass flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
          <div className="flex-1 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Zero Identity Barrier</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No sign-up, no email confirmation, no tracking. Simply drag, drop, and share. Privacy is not a feature—it is our absolute architecture.
            </p>
          </div>
          <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full qr-placeholder"></div>
            </div>
            <KeyRound className="w-12 h-12 text-indigo-400/35 animate-pulse" />
          </div>
        </div>

        {/* API Card */}
        <div className="surface-glass p-6 md:p-8 rounded-[24px] border-glass flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-orange-400/10 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Developer Friendly</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Utilize our straightforward, developer-friendly REST API for automated uploads, CI/CD pipeline storage, and log dumps.
            </p>
          </div>
          <div className="pt-4">
            <span className="font-mono text-xs text-orange-400 hover:underline cursor-pointer flex items-center gap-1">
              READ_DOCS_API <span className="text-[10px]">→</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
