import React, { useState } from 'react';
import { X, CloudUpload, ExternalLink, Check, Copy, FolderArchive, Terminal, Globe, Sparkles } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose, lang }) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<'netlify' | 'vercel'>('netlify');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>
                {isBn
                  ? 'Netlify Drop বা Vercel-এ হোস্ট করার নির্দেশিকা'
                  : 'Hosting Guide: Netlify Drop & Vercel'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                Static Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'ব্রাউজার ডিরেক্ট ইঞ্জিন থাকায় কোনো ব্যাকএন্ড সার্ভার ছাড়াই সম্পূর্ণ ফ্রিতে হোস্ট করা যাবে'
                : 'Direct browser Telegram engine — zero backend server required!'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('netlify')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'netlify'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Netlify Drop (ড্র্যাগ অ্যান্ড ড্রপ)</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'vercel'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Vercel (GitHub / CLI)</span>
          </button>
        </div>

        {activeTab === 'netlify' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-800/40 text-teal-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>
                {isBn
                  ? 'Netlify Drop-এ কোনো গিটহাব বা সার্ভার লাগে না! শুধু dist ফোল্ডারটি ড্রপ করলেই লাইভ হয়ে যায়।'
                  : 'Netlify Drop requires no GitHub repo or server. Just drop your dist folder!'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs">
                  ১
                </span>
                {isBn ? 'ধাপ ১: বিল্ড তৈরি করুন' : 'Step 1: Build the app'}
              </span>
              <p className="text-slate-400">
                {isBn
                  ? 'টার্মিনালে কমান্ড দিন (যা dist ফোল্ডার বানাবে):'
                  : 'Run this command in terminal to create the dist folder:'}
              </p>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg font-mono text-emerald-400 border border-slate-800">
                <span>npm run build</span>
                <button
                  onClick={() => copyText('npm run build', 'build')}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  {copiedCmd === 'build' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs">
                  ২
                </span>
                {isBn ? 'ধাপ ২: Netlify Drop পেজে যান' : 'Step 2: Visit Netlify Drop'}
              </span>
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  {isBn ? 'ব্রাউজারে লিঙ্কটি খুলুন:' : 'Open this link in browser:'}
                </p>
                <a
                  href="https://app.netlify.com/drop"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-400 hover:underline font-semibold"
                >
                  <span>app.netlify.com/drop</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs">
                  ৩
                </span>
                {isBn ? 'ধাপ ৩: dist ফোল্ডারটি ড্রপ করুন' : 'Step 3: Drop the dist folder'}
              </span>
              <p className="text-slate-400 leading-relaxed">
                {isBn
                  ? 'তৈরি হওয়া `dist` ফোল্ডারটিকে ড্র্যাগ করে Netlify Drop বক্সে ছেড়ে দিন। সাইট সাথে সাথে লাইভ হয়ে যাবে! (আমরা `public/_redirects` এবং `netlify.toml` আগেই রেডি করে রেখেছি)।'
                  : 'Drag and drop your `dist` folder into Netlify Drop. Your site goes live instantly with zero configuration!'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'vercel' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p>
                {isBn
                  ? 'Vercel-এ ডিপ্লয় করার জন্য প্রজেক্টে `vercel.json` প্রস্তুত রাখা হয়েছে।'
                  : 'Pre-configured `vercel.json` included for seamless Vercel hosting.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                {isBn ? 'কমান্ড দিয়ে সরাসরি ডিপ্লয়' : 'Deploy with Vercel CLI'}
              </span>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg font-mono text-sky-300 border border-slate-800">
                <span>npx vercel</span>
                <button
                  onClick={() => copyText('npx vercel', 'vercel-cli')}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  {copiedCmd === 'vercel-cli' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                {isBn ? 'GitHub দিয়ে ইমপোর্ট' : 'Import via GitHub'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>{isBn ? 'GitHub-এ কোড পুশ করুন' : 'Push code to GitHub'}</li>
                <li>{isBn ? 'vercel.com-এ Import Project করুন' : 'Import Project in vercel.com'}</li>
                <li>{isBn ? 'Framework: Vite, Output: dist' : 'Framework: Vite, Output: dist'}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-mono">
            public/_redirects, netlify.toml, vercel.json
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
