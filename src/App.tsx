import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BotHeader } from './components/BotHeader';
import { TokenCard } from './components/TokenCard';
import { StickerPacksManager } from './components/StickerPacksManager';
import { StreamMonitor } from './components/StreamMonitor';
import { ChatSimulator } from './components/ChatSimulator';
import { LiveLogs } from './components/LiveLogs';
import { BotFatherGuide } from './components/BotFatherGuide';
import { DeployModal } from './components/DeployModal';
import { BotStatusResponse, StickerPackData, BotConfig, StreamSession, LogEntry } from './types';
import { DirectTelegramEngine } from './services/telegramClient';
import { CloudUpload } from 'lucide-react';

const DEFAULT_CONFIG: BotConfig = {
  packs: ['Pro_Fish_Kingdom_by_fStikBot', 'Flame_HQ_5187_by_fStikBot'],
  delayMs: 1000,
  doneMessage: 'Done! ✅ সব স্টিকার পাঠানো সম্পন্ন হয়েছে।',
  welcomeMessage: '🚀 স্টিকার পাঠানো শুরু হচ্ছে! মোট ২টি প্যাকের সব স্টিকার প্রতি সেকেন্ডে ১টি করে পাঠানো হচ্ছে...',
  triggerCommand: '/start',
  allowAnyMessage: false,
};

export default function App() {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('tg_bot_token') || '';
  });

  const [status, setStatus] = useState<BotStatusResponse>({
    isRunning: false,
    botInfo: null,
    tokenMasked: '',
    hasToken: Boolean(token),
    config: DEFAULT_CONFIG,
    stats: {
      totalSent: 0,
      completedSessions: 0,
      failedSessions: 0,
      uptimeStart: null,
      activeStreamsCount: 0,
    },
    activeStreams: [],
    recentLogs: [
      {
        id: 'init',
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type: 'info',
        message: 'Direct Browser Engine প্রস্তুত (Netlify Drop & Vercel Ready)',
      },
    ],
  });

  const [packsData, setPacksData] = useState<StickerPackData[]>([]);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [guideOpen, setGuideOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Direct Engine reference for persistent browser polling & streaming
  const engineRef = useRef<DirectTelegramEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new DirectTelegramEngine(DEFAULT_CONFIG, {
      onStatus: (newStatus) => {
        setStatus((prev) => ({
          ...prev,
          ...newStatus,
          config: newStatus.config || prev.config,
          stats: newStatus.stats || prev.stats,
          activeStreams: newStatus.activeStreams || prev.activeStreams,
        }));
      },
      onStream: (session) => {
        setStatus((prev) => {
          const existingIdx = prev.activeStreams.findIndex((s) => s.id === session.id);
          let updated = [...prev.activeStreams];
          if (existingIdx >= 0) {
            updated[existingIdx] = session;
          } else {
            updated.unshift(session);
          }
          return {
            ...prev,
            activeStreams: updated,
          };
        });
      },
      onLog: (newLog) => {
        setStatus((prev) => ({
          ...prev,
          recentLogs: [newLog, ...prev.recentLogs.slice(0, 99)],
        }));
      },
    });
  }

  // Token change handler
  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('tg_bot_token', newToken);
  };

  // Fetch sticker packs directly via client engine
  const refreshStickerPacks = useCallback(async () => {
    if (!engineRef.current) return;
    const currentToken = token.trim();
    const packsToLoad = status.config.packs;

    const loadedPacks: StickerPackData[] = [];
    for (const p of packsToLoad) {
      try {
        if (currentToken) {
          const pack = await engineRef.current.fetchStickerPack(p, currentToken);
          loadedPacks.push(pack);
        } else {
          // Placeholder before token entered
          loadedPacks.push({
            name: p,
            title: p.includes('Fish') ? 'Pro Fish Kingdom' : p.includes('Flame') ? 'Flame HQ' : p,
            is_animated: false,
            is_video: true,
            stickerCount: p.includes('Fish') ? 30 : 25,
            sampleStickers: [],
          });
        }
      } catch (e: any) {
        loadedPacks.push({
          name: p,
          title: p,
          is_animated: false,
          is_video: false,
          stickerCount: 0,
          sampleStickers: [],
          error: e.message,
        });
      }
    }
    setPacksData(loadedPacks);
  }, [token, status.config.packs]);

  // Initial load
  useEffect(() => {
    refreshStickerPacks();
  }, [refreshStickerPacks]);

  // Start bot runner (Client-side Direct Engine)
  const handleStartBot = async (botToken: string) => {
    setLoading(true);
    try {
      if (!engineRef.current) throw new Error('Engine not initialized');
      const verified = await engineRef.current.start(botToken, status.config);
      setStatus((prev) => ({
        ...prev,
        isRunning: true,
        botInfo: verified,
        tokenMasked: `${botToken.slice(0, 6)}...${botToken.slice(-4)}`,
        hasToken: true,
      }));
      await refreshStickerPacks();
    } finally {
      setLoading(false);
    }
  };

  // Stop bot runner
  const handleStopBot = async () => {
    setLoading(true);
    try {
      if (engineRef.current) {
        await engineRef.current.stop();
      }
      setStatus((prev) => ({
        ...prev,
        isRunning: false,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Verify token only
  const handleVerifyToken = async (botToken: string) => {
    setLoading(true);
    try {
      if (!engineRef.current) throw new Error('Engine not initialized');
      const verified = await engineRef.current.verifyToken(botToken);
      setStatus((prev) => ({
        ...prev,
        botInfo: verified,
        hasToken: true,
      }));
      await refreshStickerPacks();
    } finally {
      setLoading(false);
    }
  };

  // Update Bot Configuration
  const handleUpdateConfig = async (newConfig: Partial<BotConfig>) => {
    if (engineRef.current) {
      engineRef.current.updateConfig(newConfig);
    }
    setStatus((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
    await refreshStickerPacks();
  };

  // Trigger test send to chat ID
  const handleTriggerTestSend = async (chatId: string, username?: string) => {
    if (!engineRef.current) throw new Error('Engine not ready');
    if (!status.isRunning) {
      throw new Error(
        lang === 'bn' ? 'আগে বটটি চালু (Start) করুন।' : 'Please start the bot first.'
      );
    }
    await engineRef.current.streamStickersToChat(chatId, username || `TestUser (${chatId})`);
  };

  // Clear Logs
  const handleClearLogs = async () => {
    setStatus((prev) => ({ ...prev, recentLogs: [] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <BotHeader
        status={status}
        lang={lang}
        onToggleLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
        onOpenDeployGuide={() => setDeployOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Top Info Banner */}
        <div className="bg-gradient-to-r from-sky-950/50 via-blue-950/40 to-indigo-950/50 border border-sky-800/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/20">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center flex-wrap gap-2">
              <span className="text-xl">🐠</span>
              <span>
                {lang === 'bn'
                  ? 'অটোমেটিক স্টিকার সেন্ডার (Pro Fish Kingdom + Flame HQ)'
                  : 'Automated Sticker Streamer (Pro Fish Kingdom + Flame HQ)'}
              </span>
              <span className="text-xl">🔥</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                Netlify & Vercel Ready
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {lang === 'bn'
                ? 'আপনার বট টোকেন দিয়ে "বট চালু করুন" চাপুন। টেলিগ্রামে যে কেউ /start দিলে দুটি প্যাকের সব স্টিকার প্রতি সেকেন্ডে ১টি করে পাঠানো হবে ও শেষে Done বলবে।'
                : 'Enter your bot token and click Start Bot. When anyone sends /start in Telegram, stickers stream 1 per sec from both packs, followed by Done!.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setDeployOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হোস্টিং গাইড' : 'Deploy Guide'}</span>
            </button>
            <button
              onClick={() => setGuideOpen(true)}
              className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'টোকেন গাইড 📖' : 'Token Guide 📖'}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Token & Packs Config */}
          <div className="lg:col-span-7 space-y-6">
            <TokenCard
              token={token}
              onTokenChange={handleTokenChange}
              status={status}
              onStartBot={handleStartBot}
              onStopBot={handleStopBot}
              onOpenGuide={() => setGuideOpen(true)}
              lang={lang}
              loading={loading}
              onVerifyToken={handleVerifyToken}
            />

            <StickerPacksManager
              packsData={packsData}
              config={status.config}
              onUpdateConfig={handleUpdateConfig}
              onRefreshPacks={refreshStickerPacks}
              loading={loading}
              lang={lang}
              token={token}
            />

            <StreamMonitor
              sessions={status.activeStreams}
              onTriggerTestSend={handleTriggerTestSend}
              isRunning={status.isRunning}
              lang={lang}
            />
          </div>

          {/* Right Column: Chat Simulator & Live Activity Terminal */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <ChatSimulator
              packsData={packsData}
              lang={lang}
              botName={status.botInfo?.first_name || 'Sticker Stream Bot'}
              botUsername={status.botInfo?.username || 'my_sticker_bot'}
            />

            <LiveLogs
              logs={status.recentLogs}
              onClearLogs={handleClearLogs}
              lang={lang}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Client-First Telegram Bot Engine (Netlify Drop / Vercel Static Ready)</span>
          <span className="font-mono text-[11px] text-slate-600">
            Pro_Fish_Kingdom & Flame_HQ • 1 sticker/sec • Done! ✅
          </span>
        </div>
      </footer>

      {/* BotFather Tutorial Modal */}
      <BotFatherGuide
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        lang={lang}
      />

      {/* Netlify / Vercel Deployment Modal */}
      <DeployModal
        isOpen={deployOpen}
        onClose={() => setDeployOpen(false)}
        lang={lang}
      />
    </div>
  );
}
