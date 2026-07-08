import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does CloudPass work?",
      a: "CloudPass is a zero-setup, temporary sharing node. You select a file, configure security options like expiry timers or password protection, and upload it. The server spits back a unique download code. Send that code to anyone—they input it here to download the file directly."
    },
    {
      q: "Is login or registration required?",
      a: "Absolutely not. CloudPass is built for speed and anonymity. There are no registration pages, email prompts, or cookie logins. Anyone with a browser can drop or pull files immediately."
    },
    {
      q: "How long are files stored on the server?",
      a: "That is entirely up to you. During upload, you can choose an expiry duration ranging from 10 minutes up to 30 days. Files can also be configured to self-destruct after exactly one download, or multiple download counts."
    },
    {
      q: "What is the maximum file size?",
      a: "Anonymous files up to 5GB are supported directly. For automated high-frequency storage, logs, or multi-gigabyte enterprise transfers, please contact our dev team."
    },
    {
      q: "Can I password protect files?",
      a: "Yes. When uploading, you can specify an optional file key. When the recipient tries to pull the file using your code, the system securely verifies the key before initializing the stream."
    },
    {
      q: "Can I delete files early?",
      a: "Yes. Every successful upload yields an administrative deletion token. You can use this token on your file dashboard to scrub the file from our storage cluster instantly before the expiration time."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="mt-24 max-w-3xl mx-auto px-4">
      <div className="text-center mb-12">
        <span className="font-mono text-xs font-semibold tracking-widest text-orange-400 uppercase flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-orange-400" />
          Knowledge Base
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 font-display">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div 
              key={idx}
              className="surface-glass rounded-[20px] border-glass overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/3 transition-colors duration-200"
              >
                <span className="font-sans font-semibold text-white text-sm md:text-base pr-4">
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-orange-400' : ''}`} />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-56 border-t border-white/5 opacity-100 py-5' : 'max-h-0 opacity-0'
                } px-6 overflow-hidden`}
              >
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
