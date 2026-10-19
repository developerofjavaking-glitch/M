import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Check,
  RefreshCw,
  Flame,
  Fish,
  Settings2,
} from 'lucide-react';
import { StickerPackData, BotConfig } from '../types';

interface StickerPacksManagerProps {
  packsData: StickerPackData[];
  config: BotConfig;
  onUpdateConfig: (config: Partial<BotConfig>) => Promise<void>;
  onRefreshPacks: () => Promise<void>;
  loading: boolean;
  lang: 'bn' | 'en';
  token: string;
}

export const StickerPacksManager: React.FC<StickerPacksManagerProps> = ({
  packsData,
  config,
  onUpdateConfig,
  onRefreshPacks,
  loading,
  lang,
  token,
}) => {
  const isBn = lang === 'bn';
  const [newPackInput, setNewPackInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [doneMsg, setDoneMsg] = useState(config.doneMessage);
  const [delay, setDelay] = useState(config.delayMs);
  const [customWelcome, setCustomWelcome] = useState(config.welcomeMessage);
  const [showConfigSettings, setShowConfigSettings] = useState(false);

  const handleAddPack = async () => {
    let clean = newPackInput.trim();
    if (!clean) return;
    if (clean.includes('addstickers/')) {
      clean = clean.split('addstickers/')[1].split('?')[0].split('/')[0];
    }
    if (config.packs.includes(clean)) return;

    const updated = [...config.packs, clean];
    await onUpdateConfig({ packs: updated });
    setNewPackInput('');
  };

  const handleRemovePack = async (packName: string) => {
    if (config.packs.length <= 1) return;
    const updated = config.packs.filter((p) => p !== packName);
    await onUpdateConfig({ packs: updated });
  };

  const handleSaveSettings = async () => {
    setSavingConfig(true);
    try {
      await onUpdateConfig({
        delayMs: Number(delay),
        doneMessage: doneMsg,
        welcomeMessage: customWelcome,
      });
      setShowConfigSettings(false);
    } finally {
      setSavingConfig(false);
    }
  };

  const getPackIcon = (name: string) => {
    if (name.toLowerCase().includes('fish')) {
      return <Fish className="w-4 h-4 text-cyan-400" />;
    }
    if (name.toLowerCase().includes('flame')) {
      return <Flame className="w-4 h-4 text-amber-400" />;
    }
    return <Sparkles className="w-4 h-4 text-indigo-400" />;
  };

  const totalStickersCombined = packsData.reduce(
    (acc, curr) => acc + (curr.stickerCount || 0),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isBn ? 'কনফিগার করা স্টিকার প্যাকসমূহ' : 'Configured Sticker Packs'}
              </h2>
              <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                {totalStickersCombined > 0
                  ? `${totalStickersCombined} ${isBn ? 'টি স্টিকার' : 'stickers'}`
                  : `${config.packs.length} ${isBn ? 'টি প্যাক' : 'packs'}`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'বট start দিলে এই দুটি প্যাকের প্রতি সেকেন্ডে ১টি করে সব স্টিকার ক্রমানুসারে পাঠানো হবে'
                : 'Bot will stream all stickers from these packs at 1 sticker/sec, then send Done'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigSettings(!showConfigSettings)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              showConfigSettings
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'স্পিড ও মেসেজ সেটিংস' : 'Speed & Settings'}</span>
          </button>

          <button
            onClick={onRefreshPacks}
            disabled={loading}
            title="Refresh sticker pack metadata"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showConfigSettings && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              {isBn ? 'গতি ও টেক্সট কনফিগারেশন' : 'Delivery & Text Configuration'}
            </span>
            <span className="text-xs text-slate-400">
              {isBn ? 'ডিফল্ট: ১ সেকেন্ডে ১ স্টিকার' : 'Default: 1 sticker/sec'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Speed Delay */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {isBn ? 'স্টিকার পাঠানোর ব্যবধান (Delay)' : 'Delay between stickers'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="250"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="flex-1 accent-sky-500"
                />
                <span className="font-mono bg-slate-800 px-2 py-1 rounded text-slate-200 min-w-[70px] text-center">
                  {(delay / 1000).toFixed(1)} sec
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 1500, 2000].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setDelay(ms)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      delay === ms
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {ms === 1000 ? '1.0s (ডিফল্ট)' : `${ms / 1000}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Done Announcement Message */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isBn ? 'শেষ হওয়ার মেসেজ (Done Message)' : 'Completion Message'}
              </label>
              <input
                type="text"
                value={doneMsg}
                onChange={(e) => setDoneMsg(e.target.value)}
                placeholder="Done! ✅ সব স্টিকার পাঠানো সম্পন্ন হয়েছে।"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-sky-500 text-xs"
              />
            </div>

            {/* Welcome message */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-medium mb-1.5">
                {isBn
                  ? 'শুরুর মেসেজ (Start Welcome Notice - অপশনাল)'
                  : 'Starting Welcome Notice (Optional)'}
              </label>
              <input
                type="text"
                value={customWelcome}
                onChange={(e) => setCustomWelcome(e.target.value)}
                placeholder="🚀 স্টিকার পাঠানো শুরু হচ্ছে!..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-sky-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowConfigSettings(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={savingConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {savingConfig
                ? isBn
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'Saving...'
                : isBn
                ? 'সেভ করুন'
                : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Sticker Packs Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.packs.map((packName) => {
          const packDetail = packsData.find((p) => p.name === packName);
          const hasFish = packName.toLowerCase().includes('fish');
          const hasFlame = packName.toLowerCase().includes('flame');

          return (
            <div
              key={packName}
              className={`p-4 rounded-xl border relative transition-all group overflow-hidden ${
                hasFish
                  ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900 border-cyan-800/40 hover:border-cyan-500/60'
                  : hasFlame
                  ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-800/40 hover:border-amber-500/60'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    {getPackIcon(packName)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{packDetail?.title || packName}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{packName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={`https://t.me/addstickers/${packName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title={isBn ? 'টেলিগ্রামে প্যাকটি দেখুন' : 'View pack in Telegram'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {config.packs.length > 2 && (
                    <button
                      onClick={() => handleRemovePack(packName)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isBn ? 'প্যাকটি মুছুন' : 'Remove pack'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status and Sticker Count */}
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-950/60 rounded-lg border border-slate-800/70 mb-3">
                <span className="text-slate-400">
                  {isBn ? 'স্টিকার সংখ্যা:' : 'Sticker Count:'}
                </span>
                <span className="font-bold text-sky-400">
                  {packDetail ? `${packDetail.stickerCount} টি` : 'যাচাই হচ্ছে...'}
                </span>
              </div>

              {/* Sample Stickers preview list */}
              {packDetail && packDetail.sampleStickers && packDetail.sampleStickers.length > 0 ? (
                <div>
                  <span className="text-[11px] font-medium text-slate-400 mb-1.5 block">
                    {isBn ? 'স্টিকার প্রিভিউ (নমুনা):' : 'Sample Stickers Preview:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {packDetail.sampleStickers.map((s, idx) => (
                      <div
                        key={idx}
                        className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer relative group/item"
                        title={s.emoji || 'Sticker'}
                      >
                        {token ? (
                          <img
                            src={`/api/bot/sticker-image?fileId=${s.file_id}&token=${token}`}
                            alt={s.emoji || 'sticker'}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              // If image proxy fails, fallback to emoji
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center select-none text-base">
                          {s.emoji || '✨'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic py-2">
                  {isBn
                    ? 'টোকেন দিলে স্টিকারগুলোর সরাসরি প্রিভিউ দেখা যাবে।'
                    : 'Provide token to preview stickers directly.'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Pack input bar */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={newPackInput}
          onChange={(e) => setNewPackInput(e.target.value)}
          placeholder={
            isBn
              ? 'অন্য কোনো স্টিকার প্যাক লিঙ্ক বা নাম যোগ করুন (যেমন: https://t.me/addstickers/...)'
              : 'Add another sticker pack link or name (e.g. https://t.me/addstickers/...)'
          }
          className="flex-1 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-sky-500"
        />
        <button
          onClick={handleAddPack}
          className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isBn ? 'প্যাক যোগ করুন' : 'Add Pack'}</span>
        </button>
      </div>
    </div>
  );
};
