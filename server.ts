import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StickerInfo {
  file_id: string;
  file_unique_id: string;
  emoji?: string;
  width: number;
  height: number;
  is_animated?: boolean;
  is_video?: boolean;
  file_size?: number;
}

interface StickerSet {
  name: string;
  title: string;
  is_animated: boolean;
  is_video: boolean;
  stickers: StickerInfo[];
}

interface StreamSession {
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

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'sticker';
  message: string;
  details?: Record<string, any>;
}

interface BotConfig {
  packs: string[];
  delayMs: number;
  doneMessage: string;
  welcomeMessage: string;
  triggerCommand: string;
  allowAnyMessage: boolean;
}

class TelegramBotManager {
  private token: string = '';
  private botInfo: any = null;
  private isRunning: boolean = false;
  private pollAbortController: AbortController | null = null;
  private cachedStickerSets: Map<string, StickerSet> = new Map();
  private fileUrlCache: Map<string, string> = new Map();

  private config: BotConfig = {
    packs: ['Pro_Fish_Kingdom_by_fStikBot', 'Flame_HQ_5187_by_fStikBot'],
    delayMs: 1000,
    doneMessage: 'Done! ✅ সব স্টিকার পাঠানো সম্পন্ন হয়েছে।',
    welcomeMessage: '🚀 স্টিকার পাঠানো শুরু হচ্ছে! মোট ২টি প্যাকের সব স্টিকার প্রতি সেকেন্ডে ১টি করে পাঠানো হচ্ছে...',
    triggerCommand: '/start',
    allowAnyMessage: false,
  };

  private activeStreams: Map<string, StreamSession> = new Map();
  private stats = {
    totalSent: 0,
    completedSessions: 0,
    failedSessions: 0,
    uptimeStart: null as number | null,
  };
  private logs: LogEntry[] = [];
  private sseClients: express.Response[] = [];

  constructor() {
    this.addLog('info', 'Telegram Bot Manager initialized and ready.');
  }

  public addLog(type: LogEntry['type'], message: string, details?: Record<string, any>) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      message,
      details,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 250) {
      this.logs.pop();
    }
    this.broadcastSSE('log', entry);
  }

  public registerSSEClient(res: express.Response) {
    this.sseClients.push(res);
    res.on('close', () => {
      this.sseClients = this.sseClients.filter((client) => client !== res);
    });
  }

  private broadcastSSE(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (e) {
        // Ignored
      }
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      botInfo: this.botInfo,
      tokenMasked: this.token
        ? `${this.token.slice(0, 6)}...${this.token.slice(-4)}`
        : '',
      hasToken: Boolean(this.token),
      config: this.config,
      stats: {
        ...this.stats,
        activeStreamsCount: Array.from(this.activeStreams.values()).filter(
          (s) => s.status === 'streaming'
        ).length,
      },
      activeStreams: Array.from(this.activeStreams.values()).slice(-20),
      recentLogs: this.logs.slice(0, 80),
    };
  }

  public updateConfig(newConfig: Partial<BotConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.broadcastSSE('status_update', this.getStatus());
    this.addLog('info', 'Bot configuration updated', { config: this.config });
    return this.config;
  }

  public clearLogs() {
    this.logs = [];
    this.broadcastSSE('logs_cleared', {});
  }

  public async verifyToken(token: string) {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new Error('Token cannot be empty');
    }
    const res = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`);
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || 'Invalid Telegram Bot Token');
    }
    return data.result;
  }

  public async fetchStickerSet(packIdentifier: string, tokenToUse?: string): Promise<StickerSet> {
    const t = tokenToUse || this.token;
    if (!t) {
      throw new Error('No bot token provided');
    }
    // Clean pack name if user pasted a full URL like https://t.me/addstickers/Pro_Fish_Kingdom_by_fStikBot
    let packName = packIdentifier.trim();
    if (packName.includes('addstickers/')) {
      const parts = packName.split('addstickers/');
      packName = parts[1].split('?')[0].split('/')[0].trim();
    } else if (packName.startsWith('@')) {
      packName = packName.substring(1);
    }

    if (this.cachedStickerSets.has(packName)) {
      return this.cachedStickerSets.get(packName)!;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${t}/getStickerSet?name=${encodeURIComponent(packName)}`
    );
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || `Could not fetch sticker set "${packName}"`);
    }

    const setInfo: StickerSet = {
      name: data.result.name,
      title: data.result.title,
      is_animated: Boolean(data.result.is_animated),
      is_video: Boolean(data.result.is_video),
      stickers: data.result.stickers || [],
    };

    this.cachedStickerSets.set(packName, setInfo);
    return setInfo;
  }

  public async getStickerFileUrl(fileId: string, tokenToUse?: string): Promise<string> {
    const t = tokenToUse || this.token;
    if (!t) throw new Error('Token required');

    if (this.fileUrlCache.has(fileId)) {
      return this.fileUrlCache.get(fileId)!;
    }

    const res = await fetch(`https://api.telegram.org/bot${t}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok || !data.result?.file_path) {
      throw new Error(data.description || 'Failed to fetch sticker file path');
    }

    const fullUrl = `https://api.telegram.org/file/bot${t}/${data.result.file_path}`;
    this.fileUrlCache.set(fileId, fullUrl);
    return fullUrl;
  }

  public async startBot(token: string, initialConfig?: Partial<BotConfig>) {
    if (this.isRunning) {
      await this.stopBot();
    }

    const verified = await this.verifyToken(token);
    this.token = token.trim();
    this.botInfo = verified;
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }

    this.isRunning = true;
    this.stats.uptimeStart = Date.now();
    this.pollAbortController = new AbortController();

    this.addLog(
      'success',
      `Bot started: @${verified.username} (${verified.first_name || 'Bot'})`,
      { username: verified.username, id: verified.id }
    );
    this.broadcastSSE('status_update', this.getStatus());

    // Pre-cache stickers in background
    for (const pack of this.config.packs) {
      this.fetchStickerSet(pack).catch((err) => {
        this.addLog('warn', `Warning: Failed preloading pack ${pack}: ${err.message}`);
      });
    }

    // Start polling loop
    this.runPollingLoop(this.pollAbortController.signal).catch((err) => {
      this.addLog('error', `Polling error: ${err.message}`);
    });

    return { botInfo: this.botInfo, config: this.config };
  }

  public async stopBot() {
    this.isRunning = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }

    // Mark any active streams as stopped
    for (const [key, stream] of this.activeStreams.entries()) {
      if (stream.status === 'streaming') {
        stream.status = 'stopped';
        this.activeStreams.set(key, stream);
      }
    }

    this.addLog('info', 'Bot stopped by user or server request');
    this.broadcastSSE('status_update', this.getStatus());
  }

  private async runPollingLoop(signal: AbortSignal) {
    let offset = 0;
    this.addLog('info', 'Long-polling loop active. Waiting for /start commands in Telegram...');

    while (this.isRunning && !signal.aborted) {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${offset}&timeout=15&allowed_updates=["message"]`;
        const res = await fetch(url, { signal });
        const data = await res.json();

        if (!data.ok) {
          if (data.error_code === 409) {
            this.addLog(
              'error',
              'Conflict: Another instance of this bot is polling Telegram getUpdates or webhook is set. Stopping runner.'
            );
            await this.stopBot();
            break;
          }
          this.addLog('warn', `Telegram getUpdates warning: ${data.description}`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const updates = data.result || [];
        for (const update of updates) {
          offset = Math.max(offset, update.update_id + 1);

          if (update.message) {
            const msg = update.message;
            const text = (msg.text || '').trim();
            const chatId = msg.chat?.id;
            const username =
              msg.from?.username ? `@${msg.from.username}` : msg.from?.first_name || `User ${chatId}`;

            const isStartCommand =
              text.toLowerCase() === '/start' || text.toLowerCase().startsWith('/start ');
            const isTargetTrigger =
              text.toLowerCase() === this.config.triggerCommand.toLowerCase() ||
              (this.config.allowAnyMessage && text.length > 0);

            if (isStartCommand || isTargetTrigger) {
              this.addLog(
                'info',
                `Received ${text || '/start'} from ${username} (Chat ID: ${chatId})`,
                { chatId, username, text }
              );
              // Trigger sticker stream in background for this user
              this.streamStickersToChat(chatId, username).catch((err) => {
                this.addLog('error', `Stream failed for ${username}: ${err.message}`);
              });
            }
          }
        }
      } catch (err: any) {
        if (signal.aborted) break;
        // Ignore abort/network drop during normal polling cycles
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  public async streamStickersToChat(chatId: number | string, username: string) {
    const streamKey = String(chatId);

    // If already streaming to this chat, check if active
    const existing = this.activeStreams.get(streamKey);
    if (existing && existing.status === 'streaming') {
      this.addLog('warn', `Sticker stream already in progress for ${username} (${chatId})`);
      await this.sendTelegramMessage(
        chatId,
        '⏳ ইতিমধ্যে একটি স্টিকার স্ট্রিম চলছে, দয়া করে অপেক্ষা করুন...'
      );
      return;
    }

    // 1. Fetch all stickers from all configured packs
    const allStickers: { sticker: StickerInfo; packName: string; packTitle: string }[] = [];
    try {
      for (const packIdentifier of this.config.packs) {
        try {
          const pack = await this.fetchStickerSet(packIdentifier);
          for (const s of pack.stickers) {
            allStickers.push({
              sticker: s,
              packName: pack.name,
              packTitle: pack.title,
            });
          }
        } catch (e: any) {
          this.addLog('error', `Error loading pack "${packIdentifier}": ${e.message}`);
        }
      }
    } catch (e: any) {
      this.addLog('error', `Failed loading stickers: ${e.message}`);
    }

    if (allStickers.length === 0) {
      this.addLog('error', `No stickers found in configured packs for chat ${chatId}`);
      await this.sendTelegramMessage(
        chatId,
        '⚠️ কোনো স্টিকার পাওয়া যায়নি! স্টিকার প্যাকের নাম সঠিক আছে কিনা যাচাই করুন।'
      );
      return;
    }

    // Initialize session
    const session: StreamSession = {
      id: Math.random().toString(36).substring(2, 9),
      chatId,
      username,
      startedAt: Date.now(),
      total: allStickers.length,
      current: 0,
      currentPack: allStickers[0].packTitle || allStickers[0].packName,
      currentEmoji: allStickers[0].sticker.emoji || '✨',
      status: 'streaming',
    };

    this.activeStreams.set(streamKey, session);
    this.broadcastSSE('stream_update', session);

    // Send Welcome / Initial notification if set
    if (this.config.welcomeMessage) {
      const formattedWelcome = this.config.welcomeMessage.replace(
        '{count}',
        String(allStickers.length)
      );
      await this.sendTelegramMessage(chatId, formattedWelcome);
    }

    this.addLog(
      'info',
      `Starting sticker stream for ${username}: ${allStickers.length} stickers (${this.config.delayMs}ms delay)`
    );

    // Iterate through stickers
    for (let i = 0; i < allStickers.length; i++) {
      // Check if bot was stopped or session cancelled
      if (!this.isRunning) {
        session.status = 'stopped';
        this.activeStreams.set(streamKey, session);
        this.broadcastSSE('stream_update', session);
        return;
      }

      const item = allStickers[i];
      session.current = i + 1;
      session.currentPack = item.packTitle || item.packName;
      session.currentEmoji = item.sticker.emoji || '✨';
      this.activeStreams.set(streamKey, session);
      this.broadcastSSE('stream_update', session);

      try {
        await this.sendTelegramSticker(chatId, item.sticker.file_id);
        this.stats.totalSent += 1;
        this.addLog(
          'sticker',
          `Sent sticker [${item.sticker.emoji || '🌟'}] (${i + 1}/${allStickers.length}) to ${username}`,
          { chatId, emoji: item.sticker.emoji, pack: item.packName }
        );
      } catch (err: any) {
        this.addLog('warn', `Failed sticker ${i + 1}/${allStickers.length} to ${username}: ${err.message}`);
        // If chat was blocked by user, terminate
        if (err.message?.includes('bot was blocked') || err.message?.includes('chat not found')) {
          session.status = 'failed';
          session.error = err.message;
          this.stats.failedSessions += 1;
          this.activeStreams.set(streamKey, session);
          this.broadcastSSE('stream_update', session);
          return;
        }
      }

      // Delay per second (or configured ms)
      const delay = Math.max(300, this.config.delayMs || 1000);
      await new Promise((r) => setTimeout(r, delay));
    }

    // Done! Send final message: "done" / "Done! ✅"
    try {
      await this.sendTelegramMessage(chatId, this.config.doneMessage || 'Done! ✅');
      this.addLog('success', `Sent completion message "Done! ✅" to ${username} (${chatId})`);
    } catch (err: any) {
      this.addLog('error', `Failed sending done message to ${username}: ${err.message}`);
    }

    session.status = 'completed';
    this.stats.completedSessions += 1;
    this.activeStreams.set(streamKey, session);
    this.broadcastSSE('stream_update', session);
    this.broadcastSSE('status_update', this.getStatus());
  }

  public async sendTelegramSticker(chatId: number | string, stickerFileId: string): Promise<any> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/sendSticker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        sticker: stickerFileId,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      // Handle rate limit 429
      if (data.error_code === 429 && data.parameters?.retry_after) {
        const waitSec = data.parameters.retry_after;
        this.addLog('warn', `Telegram rate limit hit! Waiting ${waitSec} seconds...`);
        await new Promise((r) => setTimeout(r, (waitSec + 1) * 1000));
        // Retry once
        return this.sendTelegramSticker(chatId, stickerFileId);
      }
      throw new Error(data.description || 'Failed to send sticker');
    }
    return data.result;
  }

  public async sendTelegramMessage(chatId: number | string, text: string) {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send message');
    }
    return data.result;
  }
}

const botManager = new TelegramBotManager();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // SSE endpoint for live logs & stream progress
  app.get('/api/bot/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial snapshot
    res.write(`event: status_update\ndata: ${JSON.stringify(botManager.getStatus())}\n\n`);
    botManager.registerSSEClient(res);
  });

  // Get status
  app.get('/api/bot/status', (req, res) => {
    res.json(botManager.getStatus());
  });

  // Verify token
  app.post('/api/bot/verify', async (req, res) => {
    try {
      const { token } = req.body;
      const botInfo = await botManager.verifyToken(token);
      res.json({ ok: true, botInfo });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // Start bot runner
  app.post('/api/bot/start', async (req, res) => {
    try {
      const { token, config } = req.body;
      const result = await botManager.startBot(token, config);
      res.json({ ok: true, ...result });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // Stop bot runner
  app.post('/api/bot/stop', async (req, res) => {
    try {
      await botManager.stopBot();
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Update configuration
  app.post('/api/bot/config', (req, res) => {
    try {
      const config = botManager.updateConfig(req.body);
      res.json({ ok: true, config });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // Clear logs
  app.post('/api/bot/clear-logs', (req, res) => {
    botManager.clearLogs();
    res.json({ ok: true });
  });

  // Test trigger stream to a specific chat ID
  app.post('/api/bot/test-send', async (req, res) => {
    try {
      const { chatId, username } = req.body;
      if (!chatId) {
        return res.status(400).json({ ok: false, error: 'Chat ID is required' });
      }
      botManager.streamStickersToChat(chatId, username || `TestUser (${chatId})`);
      res.json({ ok: true, message: `Sticker stream initiated for Chat ID: ${chatId}` });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Fetch sticker packs info (for previewing in UI)
  app.get('/api/bot/sticker-packs', async (req, res) => {
    try {
      const token = (req.query.token as string) || '';
      const packsParam = (req.query.packs as string) || 'Pro_Fish_Kingdom_by_fStikBot,Flame_HQ_5187_by_fStikBot';
      const packNames = packsParam.split(',').map((p) => p.trim()).filter(Boolean);

      const results = [];
      for (const p of packNames) {
        try {
          const pack = await botManager.fetchStickerSet(p, token || undefined);
          results.push({
            name: pack.name,
            title: pack.title,
            is_animated: pack.is_animated,
            is_video: pack.is_video,
            stickerCount: pack.stickers.length,
            sampleStickers: pack.stickers.slice(0, 12).map((s) => ({
              file_id: s.file_id,
              emoji: s.emoji,
              width: s.width,
              height: s.height,
            })),
          });
        } catch (e: any) {
          results.push({
            name: p,
            error: e.message,
            stickerCount: 0,
            sampleStickers: [],
          });
        }
      }

      res.json({ ok: true, packs: results });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Proxy sticker file image so browser can display it
  app.get('/api/bot/sticker-image', async (req, res) => {
    try {
      const fileId = req.query.fileId as string;
      const token = (req.query.token as string) || undefined;
      if (!fileId) return res.status(400).send('Missing fileId');

      const url = await botManager.getStickerFileUrl(fileId, token);
      const imgRes = await fetch(url);
      const contentType = imgRes.headers.get('content-type') || 'image/webp';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await imgRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Frontend integration: Vite middleware in dev, static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Bot Streamer server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
