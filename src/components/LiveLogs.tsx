import React, { useState } from 'react';
import { Terminal, Trash2, Copy, Check, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface LiveLogsProps {
  logs: LogEntry[];
  onClearLogs: () => Promise<void>;
  lang: 'bn' | 'en';
}

export const LiveLogs: React.FC<LiveLogsProps> = ({ logs, onClearLogs, lang }) => {
  const isBn = lang === 'bn';
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'sticker':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'error':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'warn':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Terminal className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>{isBn ? 'লাইভ ইভেন্ট ও স্টিকার লগ' : 'Live Activity Logs'}</span>
              <span className="text-[11px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isBn
                ? 'টেলিগ্রাম এপিআই কল, স্টিকার ডেলিভারি এবং রেট-লিমিটের রিয়েল-টাইম তথ্য'
                : 'Real-time Telegram API calls, sticker dispatches, and completions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
          >
            <option value="all">{isBn ? 'সব লগ (All)' : 'All Logs'}</option>
            <option value="sticker">{isBn ? 'শুধু স্টিকার (Sticker)' : 'Stickers Only'}</option>
            <option value="success">{isBn ? 'সফল (Success)' : 'Success'}</option>
            <option value="warn">{isBn ? 'সতর্কতা (Warning)' : 'Warnings'}</option>
            <option value="error">{isBn ? 'ত্রুটি (Errors)' : 'Errors'}</option>
          </select>

          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Terminal Screen */}
      <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 h-64 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600">
            {isBn ? 'কোনো লগ রেকর্ড নেই' : 'No logs recorded yet'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 py-1 hover:bg-slate-900/60 px-1.5 rounded transition-colors group"
            >
              <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold shrink-0 ${getBadgeStyle(
                  log.type
                )}`}
              >
                {log.type}
              </span>
              <span className="text-slate-300 break-all leading-relaxed group-hover:text-slate-100">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
