import React from 'react';
import { ArrowUpRight, Clock, QrCode, Send, Download, Trash2 } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Select File',
      desc: 'Choose any file up to 2GB from your device. Encrypted locally before transit.',
      icon: <ArrowUpRight className="w-5 h-5 text-indigo-400" />
    },
    {
      num: '02',
      title: 'Set Expiry',
      desc: 'Define how long the file should exist—from ten minutes to a full month.',
      icon: <Clock className="w-5 h-5 text-indigo-400" />
    },
    {
      num: '03',
      title: 'Get Code',
      desc: 'A unique 6-digit transient code and secure link are generated instantly.',
      icon: <QrCode className="w-5 h-5 text-indigo-400" />
    },
    {
      num: '04',
      title: 'Share Code',
      desc: 'Send the code or link to your recipient via any communication channel.',
      icon: <Send className="w-5 h-5 text-indigo-400" />
    },
    {
      num: '05',
      title: 'Recipient Pulls',
      desc: 'They enter the code on CloudPass and download the file immediately.',
      icon: <Download className="w-5 h-5 text-indigo-400" />
    },
    {
      num: '06',
      title: 'Self-Destruct',
      desc: 'Data is wiped permanently from our servers once the timer hits zero.',
      icon: <Trash2 className="w-5 h-5 text-indigo-400" />
    }
  ];

  return (
    <section className="mt-20 max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <span className="font-mono text-xs font-semibold tracking-widest text-orange-400 uppercase">FLUID WORKFLOW</span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 font-display">How It Works</h2>
        <p className="text-slate-400 text-sm md:text-base mt-2 font-sans">Seamless file transit in six simple steps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className="surface-glass border-glass p-7 rounded-[24px] flex flex-col justify-between group hover:border-indigo-500/40 transition-all duration-300"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold group-hover:scale-110 transition-transform duration-300">
                {step.num}
              </div>
              <div className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                {step.icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
