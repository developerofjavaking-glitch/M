import React from 'react';
import { X, ExternalLink, Bot, Check, Copy, ArrowRight, Lightbulb } from 'lucide-react';

interface BotFatherGuideProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const BotFatherGuide: React.FC<BotFatherGuideProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isBn = lang === 'bn';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isBn
                ? 'কীভাবে টেলিগ্রাম বট টোকেন তৈরি করবেন?'
                : 'How to Get a Telegram Bot Token'}
            </h2>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'মাত্র ১ মিনিটে অফিসিয়াল @BotFather থেকে সম্পূর্ণ ফ্রিতে টোকেন নিন'
                : 'Free and instant setup via Telegram official @BotFather'}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs">
                  ১
                </span>
                {isBn ? 'ধাপ ১: @BotFather খুলুন' : 'Step 1: Open @BotFather'}
              </span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-semibold"
              >
                <span>t.me/BotFather</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {isBn
                ? 'টেলিগ্রামে সার্চ করুন @BotFather অথবা উপরের লিঙ্কে ক্লিক করে চ্যাট শুরু করুন এবং /start চাপুন।'
                : 'Open Telegram, search for @BotFather or click the link above, then click Start.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs">
                ২
              </span>
              {isBn ? 'ধাপ ২: নতুন বট তৈরি করুন' : 'Step 2: Create a New Bot'}
            </span>
            <p className="text-slate-400 leading-relaxed">
              {isBn
                ? 'বটফাদারকে নিচের কমান্ডটি পাঠান:'
                : 'Send the following command to BotFather:'}
            </p>
            <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-emerald-400 border border-slate-800">
              /newbot
            </div>
            <p className="text-slate-400">
              {isBn
                ? 'এরপর আপনার বটের একটি নাম দিন (যেমন: "My Sticker Bot") এবং একটি অনন্য ইউজারনেম দিন যার শেষে bot থাকতে হবে (যেমন: "FlameFishStream_bot")।'
                : 'Then choose a display name (e.g. "My Sticker Bot") and a unique username ending in "bot" (e.g. "FlameFishStream_bot").'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs">
                ৩
              </span>
              {isBn ? 'ধাপ ৩: টোকেন কপি করুন ও এই অ্যাপে পেস্ট করুন' : 'Step 3: Copy HTTP API Token'}
            </span>
            <p className="text-slate-400 leading-relaxed">
              {isBn
                ? 'BotFather আপনাকে এমন একটি টোকেন মেসেজ করবে:'
                : 'BotFather will reply with an API token like this:'}
            </p>
            <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-slate-300 border border-slate-800 select-all">
              7239103910:AAH_dksjflsdf9302_sdlfkj3
            </div>
            <p className="text-slate-400">
              {isBn
                ? 'এই সম্পূর্ণ টোকেনটি কপি করে আমাদের ড্যাশবোর্ডের Bot Token ইনপুট বক্সে পেস্ট করে "বট চালু করুন" চাপুন!'
                : 'Copy that entire token, paste it into our dashboard, and click "Start Bot Runner"!'}
            </p>
          </div>

          {/* How it works banner */}
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-200 flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-100">
                {isBn ? 'বট চালু হওয়ার পর কী ঘটবে?' : 'What happens once started?'}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {isBn
                  ? 'যে কোনো ব্যবহারকারী টেলিগ্রামে আপনার বটকে /start দিলেই স্বয়ংক্রিয়ভাবে Pro_Fish_Kingdom এবং Flame_HQ এর সব স্টিকার প্রতি সেকেন্ডে ১টি করে পাঠানো শুরু হবে। সব স্টিকার পাঠানো শেষ হলে বট তাকে Done! ✅ বলবে।'
                  : 'Whenever someone types /start to your bot, it automatically streams all stickers from Pro_Fish_Kingdom and Flame_HQ at 1 sticker per second, then finishes with Done! ✅.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer"
          >
            {isBn ? 'বুঝেছি, বন্ধ করুন' : 'Got it! Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
