import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolveProviderCredential, VaultCredentialInput } from '@/lib/server-vault';

const execFileAsync = promisify(execFile);

const FREE_TIKTOK_VOICE_MAP: Record<string, string> = {
  cgSgspJ2msm6clMCkdW9: 'en_us_001', // Jessica -> Female TikTok US
  iP95p4xoKVk53GoZ742B: 'en_us_006', // Chris -> Male Casual US
  nPczCjzI2devNBz1zQrb: 'en_us_009', // Brian -> Male Narrator US
  '21m00Tcm4TlvDq8ikWAM': 'en_us_002', // Rachel -> Clear Female US
  TxGEqnHWrfWFTfGW9XjX: 'en_us_007', // Josh -> Energetic Male US
  EXAVITQu4vr4xnSDxMaL: 'en_us_010', // Bella -> Warm Female US
};

export function sanitizeSpokenScript(rawScript: string): string {
  return (rawScript || '')
    .replace(/\[.*?\]/g, '')
    .replace(/\((?:scene|hook|body|cta|pause|visual|music|sfx).*?\)/gi, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\.{3,}/g, '.')
    .replace(/[—–]+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIntoSpeechChunks(text: string, maxChars: number): string[] {
  const normalized = sanitizeSpokenScript(text);
  if (!normalized) return ['Check out the link below right now.'];

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!s) continue;
    if (s.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      const words = s.split(/\s+/);
      let part = '';
      for (const w of words) {
        if ((part + ' ' + w).trim().length > maxChars) {
          if (part) chunks.push(part.trim());
          part = w;
        } else {
          part = (part + ' ' + w).trim();
        }
      }
      if (part) chunks.push(part.trim());
    } else if ((current + ' ' + s).trim().length > maxChars) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = (current + ' ' + s).trim();
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChars)];
}

async function mergeMp3Buffers(buffers: Buffer[], ffmpegBin?: string | null): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error('Nenhum bloco de áudio gerado.');
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const bin = ffmpegBin || 'ffmpeg';
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tmpDir = os.tmpdir();
  const tempFiles: string[] = [];

  try {
    const partPaths: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const partPath = path.join(tmpDir, `tts_${id}_part_${i}.mp3`);
      fs.writeFileSync(partPath, buffers[i]);
      partPaths.push(partPath);
      tempFiles.push(partPath);
    }

    const listPath = path.join(tmpDir, `tts_${id}_list.txt`);
    fs.writeFileSync(
      listPath,
      partPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    );
    tempFiles.push(listPath);

    const outPath = path.join(tmpDir, `tts_${id}_merged.mp3`);
    tempFiles.push(outPath);

    await execFileAsync(bin, [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '128k',
      outPath,
    ]);

    return fs.readFileSync(outPath);
  } catch (err) {
    console.warn('FFmpeg MP3 concat fallback para concat direto de buffers:', err);
    return Buffer.concat(buffers);
  } finally {
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {
        // ignore cleanup
      }
    }
  }
}

export async function generateEnglishVoiceoverMp3(params: {
  scriptText: string;
  voiceId?: string;
  vaultCredentials?: Record<string, VaultCredentialInput> | VaultCredentialInput[] | null;
  ffmpegBin?: string | null;
}): Promise<{
  audioBuffer: Buffer;
  ttsEngineUsed: string;
  httpStatus: number;
  fallbackNotice?: string;
}> {
  const cleanSpokenText = sanitizeSpokenScript(params.scriptText);
  const voiceKey = params.voiceId || 'cgSgspJ2msm6clMCkdW9';
  let elevenSkippedReason = '';

  // 1. ElevenLabs (Pago / Cota Própria — usa apenas se configurado e com créditos)
  const { apiKey } = await resolveProviderCredential(
    'ELEVENLABS',
    params.vaultCredentials,
    'ELEVENLABS_API_KEY'
  );

  if (apiKey) {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceKey}`,
        {
          text: cleanSpokenText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            'xi-api-key': apiKey.trim(),
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      const audioBuffer = Buffer.from(response.data);
      if (audioBuffer.byteLength > 500) {
        return {
          audioBuffer,
          ttsEngineUsed: 'ElevenLabs (Voz Neural Premium)',
          httpStatus: response.status,
        };
      }
    } catch (err: any) {
      const status = err?.response?.status;
      elevenSkippedReason =
        status === 401 || status === 402 || status === 429
          ? 'Sua ElevenLabs está sem cota/créditos, então geramos a Voz Americana 100% Grátis automaticamente!'
          : 'ElevenLabs indisponível no momento — gerando com Voz Americana Gratuita ($0.00).';
    }
  }

  // 2. Voz Neural Americana TikTok Gratuita ($0.00 Sem Chave)
  try {
    const tikTokVoice = FREE_TIKTOK_VOICE_MAP[voiceKey] || 'en_us_001';
    const chunks = splitIntoSpeechChunks(cleanSpokenText, 190);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const r = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chunk,
          voice: tikTokVoice,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!r.ok) {
        throw new Error(`TikTok Free TTS HTTP ${r.status}`);
      }
      const json = await r.json();
      if (!json?.success || !json?.data) {
        throw new Error(json?.error || 'Falha ao gerar bloco na voz neural gratuita.');
      }
      buffers.push(Buffer.from(json.data, 'base64'));
    }

    const merged = await mergeMp3Buffers(buffers, params.ffmpegBin);
    return {
      audioBuffer: merged,
      ttsEngineUsed: `Voz Neural Americana Grátis (${tikTokVoice})`,
      httpStatus: 200,
      fallbackNotice: elevenSkippedReason || undefined,
    };
  } catch (err) {
    console.warn('TikTok free neural TTS fallback para Google En-US TTS:', err);
  }

  // 3. Fallback Final: Google Translate En-US TTS Grátis ($0.00 Sem Chave)
  const googleChunks = splitIntoSpeechChunks(cleanSpokenText, 165);
  const googleBuffers: Buffer[] = [];

  for (const chunk of googleChunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      chunk
    )}&tl=en-US&client=tw-ob`;
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) {
      throw new Error(`Google Free TTS falhou com HTTP ${r.status}`);
    }
    const arrBuf = await r.arrayBuffer();
    googleBuffers.push(Buffer.from(arrBuf));
  }

  const mergedGoogle = await mergeMp3Buffers(googleBuffers, params.ffmpegBin);
  return {
    audioBuffer: mergedGoogle,
    ttsEngineUsed: 'Google En-US Voz Gratuita ($0.00)',
    httpStatus: 200,
    fallbackNotice: elevenSkippedReason || undefined,
  };
}
