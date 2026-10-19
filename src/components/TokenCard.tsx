import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Bot,
  ClipboardPaste,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BotStatusResponse } from '../types';

interface TokenCardProps {
  token: string;
  onTokenChange: (token: string) => void;
  status: BotStatusResponse | null;
  onStartBot: (token: string) => Promise<void>;
  onStopBot: () => Promise<void>;
  onOpenGuide: () => void;
  lang: 'bn' | 'en';
  loading: boolean;
  onVerifyToken: (token: string) => Promise<void>;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onTokenChange,
  status,
  onStartBot,
  onStopBot,
  onOpenGuide,
  lang,
  loading,
  onVerifyToken,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isBn = lang === 'bn';
  const isRunning = status?.isRunning || false;
  const botInfo = status?.botInfo;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onTokenChange(text.trim());
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleStart = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!token.trim()) {
      setErrorMsg(
        isBn
          ? 'দয়া করে টেলিগ্রাম বট টোকেন প্রবেশ করান।'
          : 'Please enter your Telegram Bot Token.'
      );
      return;
    }
    try {
      await onStartBot(token.trim());
      setSuccessMsg(
        isBn
          ? 'বট সফলভাবে চালু হয়েছে! এখন টেলিগ্রামে /start কমান্ড দিলে স্টিকার পাঠানো শুরু হবে।'
          : 'Bot started successfully! Sending /start in Telegram will stream stickers.'
      );
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Rate exceeded') || msg.includes('Unexpected token')) {
        setErrorMsg(
          isBn
            ? 'অনুরোধের সংখ্যা সাময়িক বৃদ্ধি পেয়েছে (Rate Limit)। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।'
            : 'Rate limit reached. Please wait a few seconds and try again.'
        );
      } else {
        setErrorMsg(msg || 'Failed to start bot');
      }
    }
  };

  const handleStop = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onStopBot();
      setSuccessMsg(
        isBn ? 'বট সাময়িকভাবে বন্ধ করা হয়েছে।' : 'Bot stopped successfully.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to stop bot');
    }
  };

  const handleVerify = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!token.trim()) {
      setErrorMsg(
        isBn ? 'যাচাই করার জন্য টোকেন দিন।' : 'Enter a token to verify.'
      );
      return;
    }
    try {
      await onVerifyToken(token.trim());
      setSuccessMsg(
        isBn
          ? 'টোকেনটি সঠিক! বট তথ্য পাওয়া গেছে।'
          : 'Token verified successfully!'
      );
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Rate exceeded') || msg.includes('Unexpected token')) {
        setErrorMsg(
          isBn
            ? 'অনুরোধের সংখ্যা সাময়িক বৃদ্ধি পেয়েছে (Rate Limit)। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।'
            : 'Rate limit reached. Please wait a few seconds and try again.'
        );
      } else {
        setErrorMsg(msg || 'Verification failed');
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background glow when active */}
      {isRunning && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isBn ? 'টেলিগ্রাম বট টোকেন (Bot Token)' : 'Telegram Bot Token'}
            </h2>
            <p className="text-xs text-slate-400">
              {isBn
                ? '@BotFather থেকে পাওয়া API Token এখানে পেস্ট করুন'
                : 'Paste the HTTP API Token from @BotFather'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenGuide}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline cursor-pointer self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {isBn ? 'কীভাবে টোকেন পাবেন? (গাইড)' : 'How to get a token? (Guide)'}
        </button>
      </div>

      {/* Token Input Bar */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            disabled={isRunning}
            placeholder={
              isBn
                ? 'উদাহরণ: 7183928192:AAH9f_exampleToken...'
                : 'e.g. 7183928192:AAH9f_exampleToken...'
            }
            className={`w-full bg-slate-950/80 border text-slate-100 text-sm rounded-xl pl-4 pr-24 py-3.5 transition-all outline-none font-mono focus:ring-2 focus:ring-sky-500/30 ${
              isRunning
                ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                : 'border-slate-700/80 hover:border-slate-600 focus:border-sky-500'
            }`}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={handlePaste}
              disabled={isRunning}
              title="Paste token from clipboard"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              title={showToken ? 'Hide token' : 'Show token'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              {isBn ? 'বট চালু করুন (Start Bot)' : 'Start Bot Runner'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              {isBn ? 'বট বন্ধ করুন (Stop Bot)' : 'Stop Bot Runner'}
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || isRunning}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all disabled:opacity-40 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            {isBn ? 'টোকেন যাচাই' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Connected Bot Card if active or verified */}
      {botInfo && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
              {botInfo.first_name?.[0] || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">
                  {botInfo.first_name}
                </span>
                <span className="text-xs bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full font-mono">
                  ID: {botInfo.id}
                </span>
              </div>
              <span className="text-xs text-sky-400 font-mono">
                @{botInfo.username}
              </span>
            </div>
          </div>

          <a
            href={`https://t.me/${botInfo.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <span>{isBn ? 'টেলিগ্রামে খুলুন ও /start চাপুন' : 'Open in Telegram & /start'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
