export interface StickerInfo {
  file_id: string;
  file_unique_id?: string;
  emoji?: string;
  width?: number;
  height?: number;
  is_animated?: boolean;
  is_video?: boolean;
}

export interface StickerPackData {
  name: string;
  title: string;
  is_animated: boolean;
  is_video: boolean;
  stickerCount: number;
  sampleStickers: StickerInfo[];
  error?: string;
}

export interface StreamSession {
  id: string;
  chatId: number | string;
  username: string;
  startedAt: number;
  total: number;
  current: number;
  currentPack: string;
  currentEmoji: string;
  status: 'streaming' | 'completed' | 'failed' | 'stopped';
  error?: string;
}

export interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'sticker';
  message: string;
  details?: Record<string, any>;
}

export interface BotConfig {
  packs: string[];
  delayMs: number;
  doneMessage: string;
  welcomeMessage: string;
  triggerCommand: string;
  allowAnyMessage: boolean;
}

export interface BotStatusResponse {
  isRunning: boolean;
  botInfo: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  } | null;
  tokenMasked: string;
  hasToken: boolean;
  config: BotConfig;
  stats: {
    totalSent: number;
    completedSessions: number;
    failedSessions: number;
    uptimeStart: number | null;
    activeStreamsCount: number;
  };
  activeStreams: StreamSession[];
  recentLogs: LogEntry[];
}
