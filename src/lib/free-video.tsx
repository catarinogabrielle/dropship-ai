import React from 'react';
import { ImageResponse } from 'next/og';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type AiVideoStyle = 'AI_SCENES' | 'KINETIC_CARDS';

export interface GenerateAiVideoParams {
  creative: {
    id: string;
    angle: string;
    hookEn: string;
    bodyEn: string;
    ctaEn: string;
    metaHeadline?: string | null;
    orderBumpCopyEn?: string | null;
    product?: {
      title?: string | null;
      priceUsd?: number | null;
      orderBumpUsd?: number | null;
      uniqueMechanism?: string | null;
      painPointsJson?: string | null;
      rawScrapedText?: string | null;
      segment?: string | null;
    } | null;
  };
  localAudioPath: string;
  outputVideoPath: string;
  videoStyle?: AiVideoStyle;
  ffmpegBin?: string | null;
}

interface SceneSpec {
  index: number;
  badgeText: string;
  kickerText: string;
  spokenText: string;
  subCalloutText: string;
  footerLabel: string;
  accentHex: string;
  accentSoftRgba: string;
  borderRgba: string;
  bgGradient: string;
  bgImageDataUri: string | null;
  durationSec: number;
  isFinalOffer?: boolean;
  priceDisplay?: string;
}

const NICHE_PHOTO_POOLS: Record<string, string[]> = {
  WELLNESS: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=720&q=80',
  ],
  SLEEP_CALM: [
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1520206183501-b80df61043c2?auto=format&fit=crop&w=720&q=80',
  ],
  PETS: [
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=720&q=80',
  ],
  BEAUTY_PAIN_HOME: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=720&q=80',
  ],
};

/**
 * Garante texto 100% ASCII limpo para que o Satori (next/og) renderize em <200ms
 * sem tentar baixar fontes dinâmicas da web e sem gerar caracteres quadrados.
 */
function toAsciiClean(raw: string | null | undefined, maxLen = 220): string {
  const cleaned = String(raw || '')
    .replace(/\[.*?\]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, ' - ')
    .replace(/…/g, '...')
    .replace(/•/g, '|')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 3).replace(/\s+\S*$/, '') + '...';
}

function stripParentheticalPt(text: string | null | undefined): string {
  const raw = String(text || '');
  const idx = raw.indexOf('(');
  if (idx > 12) {
    return raw.slice(0, idx).trim();
  }
  return raw.trim();
}

function splitBodyIntoTwoScenes(bodyEn: string): [string, string] {
  const clean = toAsciiClean(bodyEn, 420);
  if (!clean) {
    return [
      'Most people try temporary fixes that never address the root cause of the problem.',
      'This simple daily protocol works with your body naturally in just minutes a day.',
    ];
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    const mid = Math.ceil(sentences.length / 2);
    const part1 = sentences.slice(0, mid).join(' ');
    const part2 = sentences.slice(mid).join(' ');
    return [part1, part2];
  }

  const words = clean.split(/\s+/);
  if (words.length >= 10) {
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' ') + '...', '...' + words.slice(half).join(' ')];
  }

  return [clean, 'Follow this proven step-by-step American protocol starting tonight at home.'];
}

export function resolveUsableFfmpegBin(preferred?: string | null): string | null {
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const candidates = [
    preferred || '',
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName),
    `/var/task/node_modules/ffmpeg-static/${exeName}`,
    path.join(os.tmpdir(), exeName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        if (process.platform !== 'win32') {
          try {
            fs.accessSync(candidate, fs.constants.X_OK);
            return candidate;
          } catch {
            const tmpBin = path.join(os.tmpdir(), 'ffmpeg');
            if (!fs.existsSync(tmpBin)) {
              fs.copyFileSync(candidate, tmpBin);
            }
            fs.chmodSync(tmpBin, 0o755);
            return tmpBin;
          }
        }
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function detectAudioDurationSec(
  ffmpegBin: string | null,
  audioPath: string
): Promise<number> {
  if (ffmpegBin) {
    try {
      await execFileAsync(ffmpegBin, ['-i', audioPath]);
    } catch (err: any) {
      const stderr = String(err?.stderr || '');
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m) {
        const total = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
        if (total > 3 && total < 120) {
          return total;
        }
      }
    }
  }

  try {
    const bytes = fs.statSync(audioPath).size;
    // Aproximação para MP3 128kbps (~16KB/s)
    const approx = bytes / 16000;
    return Math.max(10, Math.min(45, approx));
  } catch {
    return 18;
  }
}

function pickNicheCategory(contextText: string): string {
  const lower = contextText.toLowerCase();
  if (/dog|pet|bark|puppy|cat|canin|leash/.test(lower)) return 'PETS';
  if (/sleep|insomnia|night sweat|menopaus|anxiet|somatic|vagus|calm|brain|memory/.test(lower)) {
    return 'SLEEP_CALM';
  }
  if (/skin|face|beauty|led|red light|neck|cervical|back pain|sciat|pillow|clean|scrubber|car|slide|ortho/.test(lower)) {
    return 'BEAUTY_PAIN_HOME';
  }
  return 'WELLNESS';
}

async function fetchImageAsDataUri(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 4000) return null;
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

async function loadSceneBackgrounds(
  style: AiVideoStyle,
  contextText: string,
  angle: string,
  productTitle: string
): Promise<Array<string | null>> {
  if (style === 'KINETIC_CARDS') {
    return [null, null, null, null];
  }

  const category = pickNicheCategory(contextText);
  const pool = NICHE_PHOTO_POOLS[category] || NICHE_PHOTO_POOLS.WELLNESS;

  const angleOffset =
    angle === 'UGC_STORYTELLING' ? 1 : angle === 'SHOCK_HOOK' ? 2 : 0;

  const orderedUrls = [0, 1, 2, 3].map((i) => pool[(i + angleOffset) % pool.length]);

  const seed = Math.abs(
    (productTitle.length * 131 + angleOffset * 97 + Date.now()) % 9999
  );
  const aiPrompt = encodeURIComponent(
    `vertical 9:16 commercial lifestyle photography for ${toAsciiClean(
      productTitle,
      70
    )}, modern American home, warm cinematic lighting, photorealistic, no text`
  );
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=540&height=960&nologo=true&seed=${seed}`;

  const [aiHeroImg, img0, img1, img2, img3] = await Promise.all([
    fetchImageAsDataUri(pollinationsUrl, 5200),
    fetchImageAsDataUri(orderedUrls[0], 4000),
    fetchImageAsDataUri(orderedUrls[1], 4000),
    fetchImageAsDataUri(orderedUrls[2], 4000),
    fetchImageAsDataUri(orderedUrls[3], 4000),
  ]);

  return [aiHeroImg || img0, img1, img2, img3];
}

function renderStarRow(label: string) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {[0, 1, 2, 3, 4].map((idx) => (
        <svg
          key={idx}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="#fbbf24"
          style={{ marginRight: '2px' }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <div
        style={{
          display: 'flex',
          fontSize: '20px',
          fontWeight: 800,
          color: '#fde68a',
          marginLeft: '8px',
          letterSpacing: '0.8px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

async function renderScenePngBuffer(
  scene: SceneSpec,
  productTitle: string
): Promise<Buffer> {
  const spokenFontSize =
    scene.spokenText.length > 140
      ? '34px'
      : scene.spokenText.length > 95
      ? '38px'
      : '43px';

  const imgResponse = new ImageResponse(
    (
      <div
        style={{
          width: '720px',
          height: '1280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: scene.bgGradient,
          position: 'relative',
          overflow: 'hidden',
          padding: '42px 36px 92px 36px',
          color: '#ffffff',
        }}
      >
        {/* Imagem de Fundo IA / Lifestyle HD (Cortada 108% para remover qualquer marca d'água nas bordas) */}
        {scene.bgImageDataUri ? (
          <img
            src={scene.bgImageDataUri}
            width={780}
            height={1380}
            style={{
              position: 'absolute',
              top: '-50px',
              left: '-30px',
              width: '780px',
              height: '1380px',
              objectFit: 'cover',
              opacity: 0.76,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-120px',
              width: '520px',
              height: '520px',
              borderRadius: '999px',
              background: scene.accentSoftRgba,
              display: 'flex',
            }}
          />
        )}

        {/* Vinheta Cinematográfica Escura p/ Leitura Perfeita */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '720px',
            height: '1280px',
            background: scene.bgImageDataUri
              ? 'linear-gradient(180deg, rgba(6,10,19,0.90) 0%, rgba(6,10,19,0.22) 30%, rgba(6,10,19,0.64) 68%, rgba(6,10,19,0.96) 100%)'
              : 'linear-gradient(180deg, rgba(6,10,19,0.45) 0%, rgba(6,10,19,0.15) 50%, rgba(6,10,19,0.85) 100%)',
            display: 'flex',
          }}
        />

        {/* Topo: Barra de Progresso Estilo Stories/Reels + Badge da Cena */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: '10px',
            }}
          >
            {[0, 1, 2, 3].map((stepIdx) => (
              <div
                key={stepIdx}
                style={{
                  flex: 1,
                  height: '9px',
                  borderRadius: '99px',
                  backgroundColor:
                    stepIdx <= scene.index ? scene.accentHex : 'rgba(255,255,255,0.24)',
                  display: 'flex',
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignSelf: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(7, 11, 20, 0.84)',
              border: `2px solid ${scene.accentHex}`,
              borderRadius: '999px',
              padding: '10px 28px',
              fontSize: '20px',
              fontWeight: 900,
              color: scene.accentHex,
              letterSpacing: '1.4px',
            }}
          >
            {scene.badgeText}
          </div>
        </div>

        {/* Centro: Card Principal de Legenda Sincronizada + Destaque de Conversão */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(8, 13, 26, 0.88)',
            border: `2px solid ${scene.borderRgba}`,
            borderRadius: '34px',
            padding: '38px 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              backgroundColor: scene.accentSoftRgba,
              border: `1px solid ${scene.borderRgba}`,
              borderRadius: '999px',
              padding: '7px 22px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '1.4px',
            }}
          >
            {scene.kickerText}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: spokenFontSize,
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.24,
            }}
          >
            {`"${scene.spokenText}"`}
          </div>

          {scene.isFinalOffer ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                border: '2px solid #10b981',
                borderRadius: '22px',
                padding: '18px 22px',
                marginTop: '6px',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#6ee7b7',
                }}
              >
                {scene.priceDisplay || 'SPECIAL US OFFER TODAY'}
              </div>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#10b981',
                  color: '#04130d',
                  fontWeight: 900,
                  fontSize: '22px',
                  padding: '10px 28px',
                  borderRadius: '999px',
                }}
              >
                TAP THE LINK BELOW NOW -&gt;
              </div>
            </div>
          ) : (
            scene.subCalloutText && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '18px',
                  padding: '12px 20px',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  textAlign: 'center',
                }}
              >
                {scene.subCalloutText}
              </div>
            )
          )}
        </div>

        {/* Rodapé: Avaliação 5 Estrelas + Nome da Oferta */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(8, 14, 26, 0.92)',
            border: `2px solid ${scene.borderRgba}`,
            borderRadius: '26px',
            padding: '20px 26px',
            gap: '8px',
          }}
        >
          {renderStarRow(scene.footerLabel)}
          <div
            style={{
              display: 'flex',
              fontSize: '25px',
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'center',
            }}
          >
            {productTitle}
          </div>
        </div>
      </div>
    ),
    { width: 720, height: 1280 }
  );

  const arrBuf = await imgResponse.arrayBuffer();
  return Buffer.from(arrBuf);
}

/**
 * Gera um Vídeo Comercial Vertical 9:16 (.MP4) Completo por IA:
 * - Divide o roteiro em 4 cenas sincronizadas com a duração real da locução em inglês
 * - Cria cenas visuais com IA + fotografia lifestyle americana + legendas TikTok/Reels
 * - Aplica movimento de câmera dinâmico (Ken Burns Zoom-In / Zoom-Out), transições suaves e ondas de áudio ao vivo
 */
export async function generateCreativeAiVideoMp4(
  params: GenerateAiVideoParams
): Promise<{
  renderedOnServer: boolean;
  videoEngineUsed: string;
  scenesCount: number;
  durationSec: number;
  clientRenderData?: {
    scenePngDataUris: string[];
    sceneDurationsSec: number[];
  };
}> {
  const usableFfmpegBin = resolveUsableFfmpegBin(params.ffmpegBin);
  const style: AiVideoStyle = params.videoStyle || 'AI_SCENES';
  const { creative } = params;

  const rawTitle = String(creative.product?.title || 'Official US Action Protocol')
    .split(/\s+(?:—|–|-)\s+|[:(]/)[0]
    .trim();
  const productTitle = toAsciiClean(rawTitle || 'Official US Action Protocol', 46);
  const priceNum = Number(creative.product?.priceUsd || 37);
  const priceDisplay =
    priceNum > 0
      ? `SPECIAL US OFFER: ONLY $${priceNum.toFixed(2)} TODAY`
      : 'LIMITED TIME US OFFER TODAY';

  const mechanismClean = toAsciiClean(
    stripParentheticalPt(creative.product?.uniqueMechanism),
    95
  );

  let firstPain = '';
  try {
    const parsedPains = JSON.parse(creative.product?.painPointsJson || '[]');
    if (Array.isArray(parsedPains) && parsedPains.length > 0) {
      const rawPain =
        typeof parsedPains[0] === 'string' ? parsedPains[0] : parsedPains[0]?.painEn;
      firstPain = toAsciiClean(rawPain, 95);
    }
  } catch {
    firstPain = '';
  }

  const hookText =
    toAsciiClean(creative.hookEn, 180) ||
    'Stop scrolling if you have been looking for a real solution that works at home.';
  const [bodyPart1, bodyPart2] = splitBodyIntoTwoScenes(creative.bodyEn);
  const ctaText =
    toAsciiClean(creative.ctaEn, 180) ||
    'Tap the link below right now to claim your risk-free copy before this batch closes!';

  const totalAudioSec = await detectAudioDurationSec(usableFfmpegBin, params.localAudioPath);

  // Calcula a duração proporcional de cada cena pelo tamanho do texto falado
  const texts = [hookText, bodyPart1, bodyPart2, ctaText];
  const weights = texts.map((t) => Math.max(18, t.length));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const targetTotalSec = Math.max(10, totalAudioSec + 0.4);

  const durations = weights.map((w) =>
    Math.max(2.4, Number(((w / totalWeight) * targetTotalSec).toFixed(2)))
  );

  const contextForVisuals = `${productTitle} ${hookText} ${bodyPart1} ${mechanismClean}`;
  const bgImages = await loadSceneBackgrounds(
    style,
    contextForVisuals,
    creative.angle || 'PAS_DIRECT',
    productTitle
  );

  const scenes: SceneSpec[] = [
    {
      index: 0,
      badgeText: 'WATCH BEFORE SCROLLING | PART 1 OF 4',
      kickerText:
        creative.angle === 'UGC_STORYTELLING'
          ? 'HONEST AMERICAN STORY'
          : creative.angle === 'SHOCK_HOOK'
          ? 'BREAKING US DISCOVERY'
          : 'ATTENTION: DO NOT IGNORE THIS',
      spokenText: hookText,
      subCalloutText: 'Why thousands of Americans are switching to this simple routine',
      footerLabel: '4.9/5 VERIFIED US BUYERS',
      accentHex: '#10b981',
      accentSoftRgba: 'rgba(16, 185, 129, 0.22)',
      borderRgba: 'rgba(16, 185, 129, 0.65)',
      bgGradient: 'linear-gradient(160deg, #06101e 0%, #0d2e24 50%, #070b14 100%)',
      bgImageDataUri: bgImages[0],
      durationSec: durations[0],
    },
    {
      index: 1,
      badgeText: 'THE HIDDEN PROBLEM | PART 2 OF 4',
      kickerText: 'WHY MAINSTREAM ADVICE FAILS',
      spokenText: bodyPart1,
      subCalloutText:
        firstPain || 'Addresses the real root cause without complicated schedules',
      footerLabel: 'REAL RESULTS ACROSS THE USA',
      accentHex: '#f59e0b',
      accentSoftRgba: 'rgba(245, 158, 11, 0.22)',
      borderRgba: 'rgba(245, 158, 11, 0.65)',
      bgGradient: 'linear-gradient(160deg, #1a1007 0%, #2b1810 50%, #070b14 100%)',
      bgImageDataUri: bgImages[1],
      durationSec: durations[1],
    },
    {
      index: 2,
      badgeText: 'THE SIMPLE SOLUTION | PART 3 OF 4',
      kickerText: 'PROVEN AT-HOME MECHANISM',
      spokenText: bodyPart2,
      subCalloutText:
        mechanismClean || 'Step-by-step daily system designed for busy American adults',
      footerLabel: 'TOP RATED DAILY PROTOCOL',
      accentHex: '#06b6d4',
      accentSoftRgba: 'rgba(6, 182, 212, 0.22)',
      borderRgba: 'rgba(6, 182, 212, 0.65)',
      bgGradient: 'linear-gradient(160deg, #061826 0%, #0d283a 50%, #070b14 100%)',
      bgImageDataUri: bgImages[2],
      durationSec: durations[2],
    },
    {
      index: 3,
      badgeText: 'SPECIAL US OFFER | PART 4 OF 4',
      kickerText: 'LIMITED AVAILABILITY TODAY',
      spokenText: ctaText,
      subCalloutText: '',
      footerLabel: '30-DAY MONEY-BACK GUARANTEE',
      accentHex: '#10b981',
      accentSoftRgba: 'rgba(16, 185, 129, 0.25)',
      borderRgba: 'rgba(16, 185, 129, 0.80)',
      bgGradient: 'linear-gradient(160deg, #071914 0%, #112a2e 50%, #190a1e 100%)',
      bgImageDataUri: bgImages[3],
      durationSec: durations[3],
      isFinalOffer: true,
      priceDisplay,
    },
  ];

  const tmpDir = os.tmpdir();
  const runId = `${creative.id}_${Date.now()}`;
  const scenePngPaths: string[] = [];

  const buffers = await Promise.all(
    scenes.map((scene) => renderScenePngBuffer(scene, productTitle))
  );

  const usedAiPhoto = bgImages.some(Boolean);
  const baseEngineLabel =
    style === 'AI_SCENES' && usedAiPhoto
      ? 'Estúdio IA Criativo (4 Cenas Visuais + Legendas + Movimento + Soundwave)'
      : 'Estúdio Motion Cards Virais (4 Cenas Dinâmicas + Legendas + Soundwave)';

  if (!usableFfmpegBin) {
    return {
      renderedOnServer: false,
      videoEngineUsed: `${baseEngineLabel} • Web Studio`,
      scenesCount: scenes.length,
      durationSec: Number(totalAudioSec.toFixed(1)),
      clientRenderData: {
        scenePngDataUris: buffers.map((b) => `data:image/png;base64,${b.toString('base64')}`),
        sceneDurationsSec: durations,
      },
    };
  }

  try {
    for (let i = 0; i < buffers.length; i++) {
      const p = path.join(tmpDir, `ai_scene_${runId}_${i}.png`);
      fs.writeFileSync(p, buffers[i]);
      scenePngPaths.push(p);
    }

    const fps = 25;
    const filterParts = scenes.map((s, idx) => {
      const frames = Math.max(50, Math.round(s.durationSec * fps));
      const fadeOutStart = Math.max(0.4, Number((s.durationSec - 0.35).toFixed(2)));
      // Alterna movimento Ken Burns Zoom-In e Zoom-Out entre as cenas
      const zoomExpr =
        idx % 2 === 0
          ? `min(zoom+0.0010,1.07)`
          : `if(eq(on,1),1.07,max(1.00,zoom-0.0010))`;

      return `[${idx}:v]scale=776:1380,zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=720x1280:fps=${fps},fade=t=in:st=0:d=0.30,fade=t=out:st=${fadeOutStart}:d=0.30[v${idx}]`;
    });

    const concatInputs = scenes.map((_, idx) => `[v${idx}]`).join('');
    filterParts.push(`${concatInputs}concat=n=${scenes.length}:v=1:a=0[vconcat]`);
    filterParts.push(
      `[4:a]showwaves=s=720x64:mode=cline:rate=${fps}:colors=0x10b981@0.78[waves]`
    );
    filterParts.push(`[vconcat][waves]overlay=0:H-72:shortest=1[vout]`);

    const filterComplex = filterParts.join(';');

    await execFileAsync(usableFfmpegBin, [
      '-y',
      '-i',
      scenePngPaths[0],
      '-i',
      scenePngPaths[1],
      '-i',
      scenePngPaths[2],
      '-i',
      scenePngPaths[3],
      '-i',
      params.localAudioPath,
      '-filter_complex',
      filterComplex,
      '-map',
      '[vout]',
      '-map',
      '4:a:0',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '28',
      '-maxrate',
      '850k',
      '-bufsize',
      '1700k',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-shortest',
      '-movflags',
      '+faststart',
      params.outputVideoPath,
    ]);

    return {
      renderedOnServer: true,
      videoEngineUsed: baseEngineLabel,
      scenesCount: scenes.length,
      durationSec: Number(totalAudioSec.toFixed(1)),
    };
  } catch (ffmpegErr) {
    console.warn('Server FFmpeg indisponivel; acionando renderizacao client-side:', ffmpegErr);
    return {
      renderedOnServer: false,
      videoEngineUsed: `${baseEngineLabel} • Web Studio`,
      scenesCount: scenes.length,
      durationSec: Number(totalAudioSec.toFixed(1)),
      clientRenderData: {
        scenePngDataUris: buffers.map((b) => `data:image/png;base64,${b.toString('base64')}`),
        sceneDurationsSec: durations,
      },
    };
  } finally {
    for (const p of scenePngPaths) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {
        // Ignora erro de limpeza temporária
      }
    }
  }
}
