import React, { useState } from 'react';
import {
  Radio,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StreamSession } from '../types';

interface StreamMonitorProps {
  sessions: StreamSession[];
  onTriggerTestSend: (chatId: string, username?: string) => Promise<void>;
  isRunning: boolean;
  lang: 'bn' | 'en';
}

export const StreamMonitor: React.FC<StreamMonitorProps> = ({
  sessions,
  onTriggerTestSend,
  isRunning,
  lang,
}) => {
  const isBn = lang === 'bn';
  const [testChatId, setTestChatId] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showIdHelp, setShowIdHelp] = useState(false);

  const handleTestSend = async () => {
    if (!testChatId.trim()) return;
    if (!isRunning) {
      setFeedback({
        type: 'error',
        text: isBn
          ? 'টেস্ট পাঠানোর আগে দয়া করে বটটি চালু (Start) করুন।'
          : 'Please start the bot before testing.',
      });
      return;
    }
    setSendingTest(true);
    setFeedback(null);
    try {
      await onTriggerTestSend(testChatId.trim(), 'Web Test User');
      setFeedback({
        type: 'success',
        text: isBn
          ? `Chat ID ${testChatId}-এ সফলভাবে স্টিকার স্ট্রিম পাঠানো শুরু হয়েছে!`
          : `Sticker stream initiated for Chat ID ${testChatId}!`,
      });
      setTestChatId('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to start stream',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{isBn ? 'লাইভ স্ট্রিম মনিটর' : 'Live Sticker Stream Monitor'}</span>
              {sessions.filter((s) => s.status === 'streaming').length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'টেলিগ্রামে যে কেউ /start দিলে এখানে রিয়েল-টাইম প্রগ্রেস দেখা যাবে'
                : 'Real-time delivery progress when anyone triggers /start in Telegram'}
            </p>
          </div>
        </div>

        {/* Quick Test Trigger Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
              placeholder={isBn ? 'Chat ID দিয়ে টেস্ট করুন' : 'Test with your Chat ID'}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-500 font-mono w-44"
            />
          </div>
          <button
            onClick={handleTestSend}
            disabled={sendingTest || !testChatId.trim()}
            className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isBn ? 'পাঠান' : 'Test'}</span>
          </button>
          <button
            onClick={() => setShowIdHelp(!showIdHelp)}
            className="p-2 text-slate-400 hover:text-sky-300 rounded-xl hover:bg-slate-800 transition-colors"
            title="Where to find Telegram Chat ID?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIdHelp && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1 animate-in fade-in">
          <p className="font-semibold text-sky-400">
            {isBn ? 'আপনার টেলিগ্রাম Chat ID কীভাবে পাবেন?' : 'How to find your Telegram Chat ID?'}
          </p>
          <p className="text-slate-400">
            {isBn
              ? 'টেলিগ্রামে @userinfobot অথবা @raw_data_bot এ /start লিখলে আপনার নিউমেরিক Chat ID (যেমন: 123456789) পাবেন।'
              : 'Message @userinfobot or @raw_data_bot on Telegram with /start to get your numeric Chat ID (e.g. 123456789).'}
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Active and Recent Stream Queues */}
      {sessions.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">
            {isBn ? 'কোনো সক্রিয় স্ট্রিম নেই' : 'No Active Streams'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {isBn
              ? 'টেলিগ্রামে বটে গিয়ে /start চাপুন অথবা উপরের টেস্ট ফিল্ডে Chat ID দিয়ে টেস্ট শুরু করুন।'
              : 'Go to Telegram and send /start to your bot, or enter a Chat ID above to trigger.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const percent = s.total > 0 ? Math.round((s.current / s.total) * 100) : 0;
            const isDone = s.status === 'completed';
            const isStreaming = s.status === 'streaming';
            const isFailed = s.status === 'failed';

            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all ${
                  isStreaming
                    ? 'bg-slate-950/70 border-sky-500/40 shadow-lg shadow-sky-500/10'
                    : isDone
                    ? 'bg-slate-950/40 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        isStreaming
                          ? 'bg-sky-500/20 text-sky-300 ring-2 ring-sky-500/30'
                          : isDone
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-200">
                          {s.username}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Chat ID: {s.chatId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{s.currentPack}</span>
                        {isStreaming && (
                          <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                            <Clock className="w-3 h-3" />
                            1 sticker/sec
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Live Emoji Display */}
                    {isStreaming && (
                      <span className="text-xl animate-bounce" title="Current Sticker Emoji">
                        {s.currentEmoji || '🐟'}
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                        isStreaming
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : isDone
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isFailed
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isStreaming && <Zap className="w-3 h-3 fill-current" />}
                      {isDone && <CheckCircle2 className="w-3 h-3" />}
                      {isStreaming
                        ? isBn
                          ? 'পাঠানো হচ্ছে...'
                          : 'Streaming...'
                        : isDone
                        ? isBn
                          ? 'Done! সম্পন্ন হয়েছে'
                          : 'Done! ✅'
                        : isFailed
                        ? isBn
                          ? 'ব্যর্থ'
                          : 'Failed'
                        : 'Stopped'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                      {s.current} / {s.total} {isBn ? 'স্টিকার' : 'stickers'}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isDone ? 'text-emerald-400' : 'text-sky-400'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isDone
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'bg-gradient-to-r from-sky-500 to-blue-500 shadow-sm shadow-sky-500/50'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
