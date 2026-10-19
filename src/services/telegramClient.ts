import { BotConfig, StickerPackData, StreamSession, LogEntry, StickerInfo } from '../types';

export async function safeTelegramFetch(url: string, options?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error(`নেটওয়ার্ক ত্রুটি (Network Error): ${err.message || 'Failed to connect'}`);
  }

  const rawText = await res.text();
  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    if (rawText.toLowerCase().includes('rate exceeded') || res.status === 429) {
      throw new Error(
        'অনুরোধের সংখ্যা সাময়িক বৃদ্ধি পেয়েছে (Rate limit exceeded)। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।'
      );
    }
    throw new Error(
      rawText || `সার্ভার থেকে ত্রুটিপূর্ণ উত্তর এসেছে (HTTP ${res.status})`
    );
  }

  if (!data.ok) {
    if (data.error_code === 401) {
      throw new Error('টোকেনটি সঠিক নয় (Unauthorized: Invalid Bot Token)');
    }
    if (data.error_code === 409) {
      throw new Error(
        'কনফ্লিক্ট (409 Conflict): এই বটটির আরেকটি ইনস্ট্যান্স ইতিমধ্যে চালু আছে। অনুগ্রহ করে সেটি বন্ধ করুন।'
      );
    }
    throw new Error(data.description || 'টেলিগ্রাম এপিআই থেকে ত্রুটি এসেছে');
  }

  return data.result;
}

export class DirectTelegramEngine {
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private token: string = '';
  private botInfo: any = null;
  private config: BotConfig;
  private cachedPacks: Map<string, StickerPackData> = new Map();
  private fileUrls: Map<string, string> = new Map();

  private activeStreams: Map<string, StreamSession> = new Map();
  private stats = {
    totalSent: 0,
    completedSessions: 0,
    failedSessions: 0,
    uptimeStart: null as number | null,
  };

  private onStatusChange?: (status: any) => void;
  private onStreamChange?: (session: StreamSession) => void;
  private onLog?: (log: LogEntry) => void;

  constructor(
    initialConfig: BotConfig,
    callbacks?: {
      onStatus?: (status: any) => void;
      onStream?: (session: StreamSession) => void;
      onLog?: (log: LogEntry) => void;
    }
  ) {
    this.config = initialConfig;
    if (callbacks) {
      this.onStatusChange = callbacks.onStatus;
      this.onStreamChange = callbacks.onStream;
      this.onLog = callbacks.onLog;
    }
  }

  public setCallbacks(callbacks: {
    onStatus?: (status: any) => void;
    onStream?: (session: StreamSession) => void;
    onLog?: (log: LogEntry) => void;
  }) {
    this.onStatusChange = callbacks.onStatus;
    this.onStreamChange = callbacks.onStream;
    this.onLog = callbacks.onLog;
  }

  public updateConfig(newConfig: Partial<BotConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.emitStatus();
  }

  private addLog(
    type: LogEntry['type'],
    message: string,
    details?: Record<string, any>
  ) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      message,
      details,
    };
    if (this.onLog) {
      this.onLog(entry);
    }
  }

  private emitStatus() {
    if (this.onStatusChange) {
      this.onStatusChange(this.getStatus());
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
      activeStreams: Array.from(this.activeStreams.values()),
    };
  }

  public async verifyToken(tokenToTest: string): Promise<any> {
    const trimmed = tokenToTest.trim();
    if (!trimmed) throw new Error('টোকেন দিন (Token is required)');
    const url = `https://api.telegram.org/bot${trimmed}/getMe`;
    return safeTelegramFetch(url);
  }

  public async fetchStickerPack(
    packIdentifier: string,
    tokenToUse?: string
  ): Promise<StickerPackData> {
    const t = tokenToUse || this.token;
    if (!t) throw new Error('বট টোকেন প্রয়োজন (Token required)');

    let packName = packIdentifier.trim();
    if (packName.includes('addstickers/')) {
      const parts = packName.split('addstickers/');
      packName = parts[1].split('?')[0].split('/')[0].trim();
    } else if (packName.startsWith('@')) {
      packName = packName.substring(1);
    }

    if (this.cachedPacks.has(packName)) {
      return this.cachedPacks.get(packName)!;
    }

    const url = `https://api.telegram.org/bot${t}/getStickerSet?name=${encodeURIComponent(
      packName
    )}`;
    const result = await safeTelegramFetch(url);

    const packData: StickerPackData = {
      name: result.name,
      title: result.title,
      is_animated: Boolean(result.is_animated),
      is_video: Boolean(result.is_video),
      stickerCount: result.stickers?.length || 0,
      sampleStickers: (result.stickers || []).slice(0, 12).map((s: any) => ({
        file_id: s.file_id,
        file_unique_id: s.file_unique_id,
        emoji: s.emoji || '✨',
        width: s.width,
        height: s.height,
        is_animated: s.is_animated,
        is_video: s.is_video,
      })),
    };

    this.cachedPacks.set(packName, packData);
    return packData;
  }

  public async getStickerDirectUrl(fileId: string, tokenToUse?: string): Promise<string> {
    const t = tokenToUse || this.token;
    if (!t) throw new Error('Token required');
    if (this.fileUrls.has(fileId)) {
      return this.fileUrls.get(fileId)!;
    }

    const url = `https://api.telegram.org/bot${t}/getFile?file_id=${fileId}`;
    const fileResult = await safeTelegramFetch(url);
    if (!fileResult.file_path) {
      throw new Error('No file path in Telegram response');
    }

    const fullUrl = `https://api.telegram.org/file/bot${t}/${fileResult.file_path}`;
    this.fileUrls.set(fileId, fullUrl);
    return fullUrl;
  }

  public async start(tokenToUse: string, configOverrides?: Partial<BotConfig>) {
    if (this.isRunning) {
      await this.stop();
    }

    const verified = await this.verifyToken(tokenToUse);
    this.token = tokenToUse.trim();
    this.botInfo = verified;

    if (configOverrides) {
      this.config = { ...this.config, ...configOverrides };
    }

    this.isRunning = true;
    this.stats.uptimeStart = Date.now();
    this.abortController = new AbortController();

    this.addLog(
      'success',
      `বট চালু হয়েছে: @${verified.username} (${verified.first_name || 'Bot'})`,
      { username: verified.username, id: verified.id }
    );
    this.emitStatus();

    // Preload target sticker sets
    for (const pack of this.config.packs) {
      this.fetchStickerPack(pack).catch((err) => {
        this.addLog('warn', `স্টিকার প্যাক প্রি-লোড সতর্কতা (${pack}): ${err.message}`);
      });
    }

    // Launch background browser polling loop
    this.runPolling(this.abortController.signal).catch((err) => {
      this.addLog('error', `লুপ বন্ধ হয়েছে: ${err.message}`);
    });

    return verified;
  }

  public async stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Mark current streams as stopped
    for (const [key, stream] of this.activeStreams.entries()) {
      if (stream.status === 'streaming') {
        stream.status = 'stopped';
        this.activeStreams.set(key, stream);
        if (this.onStreamChange) this.onStreamChange(stream);
      }
    }

    this.addLog('info', 'বট সাময়িকভাবে বন্ধ করা হয়েছে (Stopped)');
    this.emitStatus();
  }

  private async runPolling(signal: AbortSignal) {
    let offset = 0;
    this.addLog(
      'info',
      'টেলিগ্রাম পোলিং সচল। ব্যবহারকারী টেলিগ্রামে /start দিলে স্টিকার পাঠানো শুরু হবে...'
    );

    while (this.isRunning && !signal.aborted) {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${offset}&timeout=10&allowed_updates=["message"]`;
        const res = await fetch(url, { signal });

        if (!res.ok) {
          const raw = await res.text();
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }

          if (parsed.error_code === 409) {
            this.addLog(
              'error',
              'কনফ্লিক্ট (409 Conflict): অন্য কোথাও এই বটের পোলিং চলছে।'
            );
            await this.stop();
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const data = await res.json();
        const updates = data.result || [];

        for (const update of updates) {
          offset = Math.max(offset, update.update_id + 1);

          if (update.message) {
            const msg = update.message;
            const text = (msg.text || '').trim();
            const chatId = msg.chat?.id;
            const username =
              msg.from?.username
                ? `@${msg.from.username}`
                : msg.from?.first_name || `User ${chatId}`;

            const isStart =
              text.toLowerCase() === '/start' ||
              text.toLowerCase().startsWith('/start ');
            const isTrigger =
              text.toLowerCase() === this.config.triggerCommand.toLowerCase() ||
              (this.config.allowAnyMessage && text.length > 0);

            if (isStart || isTrigger) {
              this.addLog(
                'info',
                `টেলিগ্রামে /start পেয়েছে: ${username} (Chat ID: ${chatId})`,
                { chatId, username, text }
              );

              // Spawn sticker stream
              this.streamStickersToChat(chatId, username).catch((err) => {
                this.addLog('error', `${username}-এর জন্য স্ট্রিম ব্যর্থ: ${err.message}`);
              });
            }
          }
        }
      } catch (err: any) {
        if (signal.aborted) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  public async streamStickersToChat(chatId: number | string, username: string) {
    const streamKey = String(chatId);
    const existing = this.activeStreams.get(streamKey);
    if (existing && existing.status === 'streaming') {
      this.addLog('warn', `${username}-এর জন্য ইতিমধ্যে স্ট্রিম চলমান রয়েছে`);
      await this.sendMessage(chatId, '⏳ একটি স্ট্রিম ইতিমধ্যে চলছে, অনুগ্রহ করে অপেক্ষা করুন...');
      return;
    }

    const allStickers: { sticker: StickerInfo; packTitle: string; packName: string }[] = [];

    for (const packIdentifier of this.config.packs) {
      try {
        let cleanName = packIdentifier.trim();
        if (cleanName.includes('addstickers/')) {
          cleanName = cleanName.split('addstickers/')[1].split('?')[0].split('/')[0].trim();
        }
        const url = `https://api.telegram.org/bot${this.token}/getStickerSet?name=${encodeURIComponent(
          cleanName
        )}`;
        const setRes = await safeTelegramFetch(url);
        if (setRes && setRes.stickers) {
          for (const s of setRes.stickers) {
            allStickers.push({
              sticker: s,
              packTitle: setRes.title || cleanName,
              packName: cleanName,
            });
          }
        }
      } catch (err: any) {
        this.addLog('error', `প্যাক "${packIdentifier}" লোড করতে সমস্যা: ${err.message}`);
      }
    }

    if (allStickers.length === 0) {
      this.addLog('error', `কোনো স্টিকার পাওয়া যায়নি (Chat ID: ${chatId})`);
      await this.sendMessage(chatId, '⚠️ কোনো স্টিকার লোড করা যায়নি! প্যাকের নাম ঠিক আছে কিনা দেখুন।');
      return;
    }

    const session: StreamSession = {
      id: Math.random().toString(36).substring(2, 9),
      chatId,
      username,
      startedAt: Date.now(),
      total: allStickers.length,
      current: 0,
      currentPack: allStickers[0].packTitle,
      currentEmoji: allStickers[0].sticker.emoji || '✨',
      status: 'streaming',
    };

    this.activeStreams.set(streamKey, session);
    if (this.onStreamChange) this.onStreamChange(session);
    this.emitStatus();

    if (this.config.welcomeMessage) {
      await this.sendMessage(chatId, this.config.welcomeMessage).catch(() => {});
    }

    this.addLog(
      'info',
      `${username}-কে ${allStickers.length}টি স্টিকার পাঠানো শুরু হয়েছে (প্রতি সেকেন্ডে ১টি)...`
    );

    for (let i = 0; i < allStickers.length; i++) {
      if (!this.isRunning) {
        session.status = 'stopped';
        this.activeStreams.set(streamKey, session);
        if (this.onStreamChange) this.onStreamChange(session);
        return;
      }

      const item = allStickers[i];
      session.current = i + 1;
      session.currentPack = item.packTitle;
      session.currentEmoji = item.sticker.emoji || '✨';
      this.activeStreams.set(streamKey, session);
      if (this.onStreamChange) this.onStreamChange(session);

      try {
        await this.sendSticker(chatId, item.sticker.file_id);
        this.stats.totalSent += 1;
        this.addLog(
          'sticker',
          `স্টিকার পাঠানো হয়েছে [${item.sticker.emoji || '🌟'}] (${i + 1}/${allStickers.length}) -> ${username}`,
          { chatId, emoji: item.sticker.emoji, pack: item.packName }
        );
      } catch (err: any) {
        this.addLog('warn', `স্টিকার ${i + 1} পাঠাতে সমস্যা: ${err.message}`);
        if (
          err.message?.includes('bot was blocked') ||
          err.message?.includes('chat not found')
        ) {
          session.status = 'failed';
          session.error = err.message;
          this.stats.failedSessions += 1;
          this.activeStreams.set(streamKey, session);
          if (this.onStreamChange) this.onStreamChange(session);
          return;
        }
      }

      const delay = Math.max(300, this.config.delayMs || 1000);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      await this.sendMessage(chatId, this.config.doneMessage || 'Done! ✅');
      this.addLog('success', `${username}-কে সমাপ্তি বার্তা "Done! ✅" পাঠানো হয়েছে`);
    } catch (err: any) {
      this.addLog('error', `Done বার্তা পাঠাতে সমস্যা: ${err.message}`);
    }

    session.status = 'completed';
    this.stats.completedSessions += 1;
    this.activeStreams.set(streamKey, session);
    if (this.onStreamChange) this.onStreamChange(session);
    this.emitStatus();
  }

  public async sendSticker(chatId: number | string, stickerFileId: string): Promise<any> {
    const url = `https://api.telegram.org/bot${this.token}/sendSticker`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        sticker: stickerFileId,
      }),
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Telegram sendSticker returned invalid response');
    }

    if (!data.ok) {
      if (data.error_code === 429 && data.parameters?.retry_after) {
        const wait = data.parameters.retry_after;
        this.addLog('warn', `টেলিগ্রাম রেট-লিমিট: ${wait} সেকেন্ড অপেক্ষা করা হচ্ছে...`);
        await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
        return this.sendSticker(chatId, stickerFileId);
      }
      throw new Error(data.description || 'Failed to send sticker');
    }
    return data.result;
  }

  public async sendMessage(chatId: number | string, text: string): Promise<any> {
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Telegram sendMessage returned invalid response');
    }
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send message');
    }
    return data.result;
  }
}
