import React from 'react';
import { Send, Zap, CheckCircle2, Bot, Globe, CloudUpload } from 'lucide-react';
import { BotStatusResponse } from '../types';

interface BotHeaderProps {
  status: BotStatusResponse | null;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  onOpenDeployGuide: () => void;
}

export const BotHeader: React.FC<BotHeaderProps> = ({
  status,
  lang,
  onToggleLang,
  onOpenDeployGuide,
}) => {
  const isRunning = status?.isRunning || false;
  const isBn = lang === 'bn';

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-sky-400/30 shrink-0">
            <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="font-bold text-base sm:text-xl text-white tracking-tight leading-snug">
                {isBn ? 'টেলিগ্রাম স্টিকার স্ট্রিমার বট' : 'Telegram Sticker Streamer Bot'}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                  isRunning
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {isRunning
                  ? isBn
                    ? 'বট সচল আছে (Running)'
                    : 'Active'
                  : isBn
                  ? 'বট বন্ধ আছে (Stopped)'
                  : 'Stopped'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'টেলিগ্রামে /start দিলে ২টি প্যাকের সব স্টিকার প্রতি সেকেন্ডে ১টি করে পাঠাবে'
                : 'Streams sticker packs at 1 sticker/sec on /start, announces Done'}
            </p>
          </div>
        </div>

        {/* Right: Actions & Metrics */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 self-end sm:self-auto">
          {status && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-1.5 text-sky-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-200">{status.stats.totalSent}</span>
                <span className="text-slate-400">{isBn ? 'পাঠানো' : 'Sent'}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-200">{status.stats.completedSessions}</span>
                <span className="text-slate-400">{isBn ? 'সম্পন্ন' : 'Done'}</span>
              </div>
            </div>
          )}

          {status?.botInfo && (
            <a
              href={`https://t.me/${status.botInfo.username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all group"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="max-w-[100px] sm:max-w-[130px] truncate">
                @{status.botInfo.username}
              </span>
            </a>
          )}

          {/* Vercel / Netlify Deploy Guide Button */}
          <button
            onClick={onOpenDeployGuide}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 text-teal-300 border border-teal-500/30 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
            title="Deploy to Vercel or Netlify Drop"
          >
            <CloudUpload className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden xs:inline">Netlify / Vercel</span>
            <span className="xs:hidden">Deploy</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Switch Language / ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{isBn ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
