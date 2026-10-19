import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Check,
  CheckCheck,
  Bot,
  User,
  Sparkles,
} from 'lucide-react';
import { StickerPackData } from '../types';

interface ChatSimulatorProps {
  packsData: StickerPackData[];
  lang: 'bn' | 'en';
  botName?: string;
  botUsername?: string;
}

interface SimMessage {
  id: string;
  sender: 'user' | 'bot';
  type: 'text' | 'sticker';
  text?: string;
  emoji?: string;
  packTitle?: string;
  time: string;
}

const SAMPLE_FISH_EMOJIS = ['🐠', '🐟', '🐡', '🦈', '🐬', '🐳', '🐙', '🦀', '🦞', '🌊'];
const SAMPLE_FLAME_EMOJIS = ['🔥', '⚡', '💥', '✨', '🌟', '☄️', '🧨', '💣', '🎆', '🚀'];

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({
  packsData,
  lang,
  botName = 'Sticker Stream Bot',
  botUsername = 'my_sticker_bot',
}) => {
  const isBn = lang === 'bn';
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [inputVal, setInputVal] = useState('/start');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const currentTime = () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. User sends /start
    const userMsg: SimMessage = {
      id: Math.random().toString(),
      sender: 'user',
      type: 'text',
      text: '/start',
      time: currentTime(),
    };
    setMessages((prev) => [...prev, userMsg]);

    await new Promise((r) => setTimeout(r, 600));

    // 2. Bot sends welcome notice
    const welcomeMsg: SimMessage = {
      id: Math.random().toString(),
      sender: 'bot',
      type: 'text',
      text: isBn
        ? '⚡ স্টিকার পাঠানো শুরু হচ্ছে! (সর্বোচ্চ গতিতে সব স্টিকার পাঠানো হচ্ছে)...'
        : '⚡ Starting sticker stream! Streaming all stickers at MAXIMUM TURBO SPEED...',
      time: currentTime(),
    };
    setMessages((prev) => [...prev, welcomeMsg]);

    // Gather sample stickers from packs or fallbacks
    const stickersToSimulate: { emoji: string; packTitle: string }[] = [];

    // Pack 1: Fish Kingdom
    const fishPack = packsData.find((p) => p.name.includes('Fish'));
    if (fishPack && fishPack.sampleStickers.length > 0) {
      fishPack.sampleStickers.slice(0, 6).forEach((s) => {
        stickersToSimulate.push({
          emoji: s.emoji || '🐟',
          packTitle: fishPack.title || 'Pro Fish Kingdom',
        });
      });
    } else {
      SAMPLE_FISH_EMOJIS.slice(0, 5).forEach((em) => {
        stickersToSimulate.push({ emoji: em, packTitle: 'Pro Fish Kingdom' });
      });
    }

    // Pack 2: Flame HQ
    const flamePack = packsData.find((p) => p.name.includes('Flame'));
    if (flamePack && flamePack.sampleStickers.length > 0) {
      flamePack.sampleStickers.slice(0, 6).forEach((s) => {
        stickersToSimulate.push({
          emoji: s.emoji || '🔥',
          packTitle: flamePack.title || 'Flame HQ',
        });
      });
    } else {
      SAMPLE_FLAME_EMOJIS.slice(0, 5).forEach((em) => {
        stickersToSimulate.push({ emoji: em, packTitle: 'Flame HQ' });
      });
    }

    // 3. Send stickers at rapid fire maximum speed (burst animation)
    for (let i = 0; i < stickersToSimulate.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      const s = stickersToSimulate[i];
      const stickerMsg: SimMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        type: 'sticker',
        emoji: s.emoji,
        packTitle: s.packTitle,
        time: currentTime(),
      };
      setMessages((prev) => [...prev, stickerMsg]);
    }

    // 4. Send final Done message!
    await new Promise((r) => setTimeout(r, 900));
    const doneMsg: SimMessage = {
      id: Math.random().toString(),
      sender: 'bot',
      type: 'text',
      text: isBn
        ? 'Done! ✅ সব স্টিকার পাঠানো সম্পন্ন হয়েছে।'
        : 'Done! ✅ All stickers have been sent.',
      time: currentTime(),
    };
    setMessages((prev) => [...prev, doneMsg]);

    setIsSimulating(false);
  };

  const handleReset = () => {
    setMessages([]);
    setIsSimulating(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>{isBn ? 'টেলিগ্রাম চ্যাট সিমুলেটর' : 'Telegram Chat Preview Simulator'}</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded uppercase font-semibold">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isBn
                ? 'টেলিগ্রামে ব্যবহারকারীর অভিজ্ঞতা কেমন হবে তা দেখতে নিচে /start চাপুন'
                : 'Click /start below to preview the exact 1/sec sticker delivery flow'}
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={isSimulating || messages.length === 0}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30 cursor-pointer"
          title="Reset Chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Telegram Chat Mockup Body */}
      <div className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 flex flex-col justify-between min-h-[380px] max-h-[460px] relative overflow-hidden">
        {/* Telegram Chat Header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800/60 bg-slate-900/60 -mx-3 -mt-3 p-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {botName[0]}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{botName}</span>
              <span className="text-[10px] text-sky-400 font-mono">bot</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isSimulating ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isBn ? 'স্টিকার পাঠাচ্ছে...' : 'sending stickers...'}
                </span>
              ) : (
                `@${botUsername}`
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages List */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Bot className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-medium text-slate-400 text-xs">
                {isBn
                  ? 'সিমুলেশন শুরু করতে নিচের "/start কমান্ড দিন" বাটনে চাপুন'
                  : 'Click "/start Simulator" below to preview'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                {isBn
                  ? 'প্রতি ১ সেকেন্ডে ১টি করে স্টিকার পাঠানো হবে ও শেষে Done বলবে।'
                  : 'Stickers will appear 1 per second followed by Done! ✅ message.'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-sky-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 max-w-[80%] shadow-md">
                      <div className="font-mono">{m.text}</div>
                      <div className="text-[9px] text-sky-200 text-right mt-0.5 flex items-center justify-end gap-1">
                        <span>{m.time}</span>
                        <CheckCheck className="w-3 h-3 text-sky-200" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Bot Message
              if (m.type === 'sticker') {
                return (
                  <div key={m.id} className="flex justify-start items-end gap-1.5">
                    <div className="p-2 rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 shadow-md flex flex-col items-center">
                      <div className="text-4xl py-1 animate-bounce duration-500">{m.emoji}</div>
                      <div className="flex items-center justify-between w-full gap-2 text-[9px] text-slate-400 pt-1 border-t border-slate-800/60 mt-1">
                        <span className="truncate max-w-[100px]">{m.packTitle}</span>
                        <span>{m.time}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Bot Text Message (Welcome / Done)
              return (
                <div key={m.id} className="flex justify-start">
                  <div
                    className={`rounded-2xl rounded-tl-xs px-3.5 py-2 max-w-[85%] shadow-md ${
                      m.text?.includes('Done!')
                        ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className="text-[9px] text-slate-400 text-right mt-0.5">
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Input / Trigger */}
        <div className="pt-2 border-t border-slate-800/80 -mx-3 -mb-3 p-3 bg-slate-900/60 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSimulating}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none font-mono"
          />
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm cursor-pointer"
          >
            {isSimulating ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isSimulating ? (isBn ? 'চলছে...' : 'Streaming...') : '/start'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
