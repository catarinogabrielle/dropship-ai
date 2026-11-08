'use client';

import React, { useState } from 'react';
import {
  Volume2,
  Video,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Film,
  Download,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CreativeData } from '@/types/autopilot';
import {
  getClientCredentialsPayload,
  saveCreativesToVault,
} from '@/lib/storage-persistence';

interface Module3VideoTikTokProps {
  creatives: CreativeData[];
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
  onCreativesUpdated?: (creatives: CreativeData[]) => void;
}

const US_VOICES = [
  { id: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica (Mulher Jovem EUA • TikTok, Beleza & Keto)' },
  { id: 'iP95p4xoKVk53GoZ742B', label: 'Chris (Homem Casual EUA • Depoimento UGC & Gadgets)' },
  { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian (Locutor Sério EUA • Saúde, Dores & Finanças)' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Mulher Clássica EUA • E-books e Protocolos)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (Homem Dinâmico EUA • Anúncios Rápidos)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Mulher Suave EUA • Pets, Sono & Bem-Estar)' },
];

export default function Module3VideoTikTok({
  creatives,
  onRefresh,
  onNavigateTab,
  onCreativesUpdated,
}: Module3VideoTikTokProps) {
  const [selectedVoice, setSelectedVoice] = useState<Record<string, string>>({});
  const [selectedVideoStyle, setSelectedVideoStyle] = useState<
    Record<string, 'AI_SCENES' | 'KINETIC_CARDS' | 'CUSTOM_UPLOAD'>
  >({});
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<Record<string, File | null>>({});
  const [publicVideoUrls, setPublicVideoUrls] = useState<Record<string, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  const resolveMediaSrc = (pathStr?: string | null) => {
    if (!pathStr) return '';
    if (pathStr.startsWith('data:') || pathStr.startsWith('http')) return pathStr;
    return `${pathStr}?t=${Date.now()}`;
  };

  const handleGenerateAudio = async (creative: CreativeData) => {
    setLoadingAudioId(creative.id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[creative.id];
      return next;
    });

    try {
      const voiceId = selectedVoice[creative.id] || US_VOICES[0].id;
      const res = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeId: creative.id,
          voiceId,
          _vaultCredentials: getClientCredentialsPayload(),
          _vaultCreative: { ...creative, videoFilePath: null, audioFilePath: null },
          _vaultProduct: creative.product,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'error',
            message:
              data.error ||
              'Erro ao gerar locução em inglês. Tente novamente em alguns segundos.',
          },
        }));
      } else {
        if (data.creative) {
          saveCreativesToVault([data.creative]);
          onCreativesUpdated?.([data.creative]);
        }
        const ttsLabel = data.ttsEngineUsed || 'Voz Neural Grátis ($0.00)';
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: data.fallbackNotice
              ? `Locução em inglês gerada via ${ttsLabel}! (${data.fallbackNotice})`
              : `Locução em inglês gerada a R$ 0,00 via ${ttsLabel}!`,
          },
        }));
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [creative.id]: {
          type: 'error',
          message: err.message || 'Falha ao chamar /api/video/render',
        },
      }));
    } finally {
      setLoadingAudioId(null);
    }
  };

  const synthesizeAiVideoInBrowser = async (params: {
    scenePngDataUris: string[];
    audioDataUri: string;
  }): Promise<string> => {
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Falha ao carregar cena visual IA'));
        img.src = src;
      });

    const images = await Promise.all(params.scenePngDataUris.map(loadImg));
    const audioRes = await fetch(params.audioDataUri);
    const audioArrayBuf = await audioRes.arrayBuffer();

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx: AudioContext = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuf.slice(0));
    const totalDurationSec = Math.max(6, audioBuffer.duration);

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    const dest = audioCtx.createMediaStreamDestination();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(dest);

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const mimeCandidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const chosenMime =
      mimeCandidates.find(
        (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
      ) || '';

    const recorder = new MediaRecorder(
      combinedStream,
      chosenMime
        ? { mimeType: chosenMime, videoBitsPerSecond: 1_800_000 }
        : { videoBitsPerSecond: 1_800_000 }
    );

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    const drawSceneWithZoom = (
      img: HTMLImageElement,
      sceneIdx: number,
      progress: number,
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const scale =
        sceneIdx % 2 === 0
          ? 1.0 + 0.065 * Math.min(1, Math.max(0, progress))
          : 1.065 - 0.065 * Math.min(1, Math.max(0, progress));
      const drawW = 720 * scale;
      const drawH = 1280 * scale;
      const dx = (720 - drawW) / 2;
      const dy = (1280 - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    };

    const sceneCount = images.length;
    const sceneLen = totalDurationSec / sceneCount;

    return await new Promise<string>((resolve, reject) => {
      const startTime = performance.now();

      const drawTick = () => {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const rawIdx = Math.min(sceneCount - 1, Math.floor(elapsedSec / sceneLen));
        const withinSceneSec = elapsedSec - rawIdx * sceneLen;
        const progress = Math.min(1, Math.max(0, withinSceneSec / sceneLen));

        ctx.fillStyle = '#060a13';
        ctx.fillRect(0, 0, 720, 1280);

        drawSceneWithZoom(images[rawIdx], rawIdx, progress, 1);

        // Crossfade suave nos últimos 0.35s da cena
        const fadeWindow = 0.35;
        if (rawIdx < sceneCount - 1 && sceneLen - withinSceneSec < fadeWindow) {
          const nextAlpha = 1 - (sceneLen - withinSceneSec) / fadeWindow;
          drawSceneWithZoom(images[rawIdx + 1], rawIdx + 1, 0, nextAlpha);
        }

        // Ondas de áudio verdes ao vivo no rodapé (y = 1218..1262)
        analyser.getByteFrequencyData(freqData);
        const barCount = 36;
        const barWidth = 10;
        const gap = 6;
        const totalBarsW = barCount * barWidth + (barCount - 1) * gap;
        const startX = (720 - totalBarsW) / 2;
        const centerY = 1244;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        for (let b = 0; b < barCount; b++) {
          const val = freqData[b % freqData.length] || 18;
          const barH = Math.max(6, (val / 255) * 42);
          const x = startX + b * (barWidth + gap);
          ctx.beginPath();
          ctx.roundRect(x, centerY - barH / 2, barWidth, barH, 4);
          ctx.fill();
        }
      };

      const intervalId = window.setInterval(drawTick, 33);
      drawTick();

      recorder.onstop = () => {
        window.clearInterval(intervalId);
        audioCtx.close().catch(() => {});
        const blob = new Blob(chunks, { type: chosenMime || 'video/mp4' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Erro ao converter vídeo renderizado'));
        reader.readAsDataURL(blob);
      };

      recorder.onerror = () => {
        window.clearInterval(intervalId);
        audioCtx.close().catch(() => {});
        reject(new Error('Erro no gravador de vídeo do navegador'));
      };

      recorder.start(200);
      source.start(0);

      source.onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };
    });
  };

  const handleRenderVideoWithFfmpeg = async (creative: CreativeData) => {
    const modeStyle = selectedVideoStyle[creative.id] || 'AI_SCENES';
    const file = modeStyle === 'CUSTOM_UPLOAD' ? selectedVideoFiles[creative.id] : null;

    setLoadingVideoId(creative.id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[creative.id];
      return next;
    });

    try {
      const formData = new FormData();
      formData.append('creativeId', creative.id);
      formData.append('voiceId', selectedVoice[creative.id] || US_VOICES[0].id);
      formData.append(
        'videoStyle',
        modeStyle === 'KINETIC_CARDS' ? 'KINETIC_CARDS' : 'AI_SCENES'
      );
      formData.append('_vaultCredentials', JSON.stringify(getClientCredentialsPayload()));
      const compactAudio =
        creative.audioFilePath && creative.audioFilePath.length < 1_500_000
          ? creative.audioFilePath
          : null;
      formData.append(
        '_vaultCreative',
        JSON.stringify({ ...creative, audioFilePath: compactAudio, videoFilePath: null })
      );
      if (creative.product) {
        formData.append('_vaultProduct', JSON.stringify(creative.product));
      }
      if (file) {
        formData.append('video', file);
      }

      const res = await fetch('/api/video/render', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'error',
            message: data.error || 'Falha ao gerar vídeo comercial.',
          },
        }));
      } else if (
        data.requiresClientRender &&
        data.clientRenderData?.scenePngDataUris?.length &&
        data.clientRenderData?.audioDataUri
      ) {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message:
              'Cenas IA prontas! Finalizando gravação das 4 cenas com locução e ondas de áudio...',
          },
        }));

        const renderedVideoDataUrl = await synthesizeAiVideoInBrowser({
          scenePngDataUris: data.clientRenderData.scenePngDataUris,
          audioDataUri: data.clientRenderData.audioDataUri,
        });

        const updatedWithVideo: CreativeData = {
          ...(data.creative || creative),
          audioFilePath: data.clientRenderData.audioDataUri,
          videoFilePath: renderedVideoDataUrl,
          status: 'VIDEO_RENDERED',
        };
        saveCreativesToVault([updatedWithVideo]);
        onCreativesUpdated?.([updatedWithVideo]);

        const engineLabel =
          data.videoEngineUsed || 'Estúdio IA Criativo (4 Cenas + Legendas + Soundwave)';
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: `Vídeo .MP4 gerado com sucesso via ${engineLabel}! Assista no player ou baixe para postar no TikTok, Reels e Shorts.`,
          },
        }));
      } else {
        if (data.creative) {
          saveCreativesToVault([data.creative]);
          onCreativesUpdated?.([data.creative]);
        }
        const engineLabel =
          data.videoEngineUsed || 'Estúdio IA Criativo (4 Cenas + Legendas + Soundwave)';
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: `Vídeo .MP4 gerado com sucesso via ${engineLabel}! Assista no player ou baixe para postar no TikTok, Reels e Shorts.`,
          },
        }));
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [creative.id]: {
          type: 'error',
          message: err.message || 'Erro ao enviar vídeo para /api/video/render',
        },
      }));
    } finally {
      setLoadingVideoId(null);
    }
  };

  const handlePublishTikTok = async (creative: CreativeData) => {
    setPublishingId(creative.id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[creative.id];
      return next;
    });

    try {
      const safeVideoPath =
        creative.videoFilePath && creative.videoFilePath.length < 3_500_000
          ? creative.videoFilePath
          : null;
      const res = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeId: creative.id,
          publicVideoUrl: publicVideoUrls[creative.id] || undefined,
          caption: `${creative.hookEn} ${creative.ctaEn} #tiktokshop #usa`,
          _vaultCredentials: getClientCredentialsPayload(),
          _vaultCreative: { ...creative, videoFilePath: safeVideoPath, audioFilePath: null },
          _vaultProduct: creative.product,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'error',
            message: data.error || 'Erro ao publicar na API Oficial do TikTok.',
          },
        }));
      } else {
        if (data.creative) {
          saveCreativesToVault([data.creative]);
          onCreativesUpdated?.([data.creative]);
        }
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: `Publicado no TikTok US! ID: ${data.publishId}`,
          },
        }));
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [creative.id]: {
          type: 'error',
          message: err.message || 'Erro de conexão com /api/tiktok/publish',
        },
      }));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* BARRA SUPERIOR COMPACTA */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            Estúdio de Voz Americana & Vídeo (.MP4) — 100% Grátis
          </h2>
          <p className="text-xs text-slate-400">
            1. Gere a voz americana a R$ 0,00 &rarr; 2. Suba um vídeo grátis do Pexels (ou gere direto) &rarr; 3. Baixe o .MP4 e poste no orgânico!
          </p>
        </div>

        <a
          href="https://www.pexels.com/pt-br/procurar/videos/vertical/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 px-3.5 py-2 text-xs font-bold text-cyan-300 transition shrink-0"
        >
          Vídeos de Fundo Grátis (Pexels)
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* PLANO ORGÂNICO R$ 0,00 */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/25 px-4 py-3 text-xs text-slate-200 leading-relaxed">
        <strong className="text-purple-300 font-extrabold">
          💰 Estratégia R$ 0,00 para fazer suas primeiras vendas em Dólar:
        </strong>{' '}
        Você não precisa pagar ElevenLabs nem Meta Ads agora. Gere a voz americana grátis aqui, baixe o vídeo <strong className="text-white">.MP4</strong> pronto e poste 1 a 2 vídeos por dia de graça no <strong className="text-white">TikTok (conta EUA), Instagram Reels e YouTube Shorts</strong> com seu link de afiliado ou checkout na bio!
      </div>

      {creatives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
          <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">Nenhum roteiro disponível para gravar</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Gere primeiro as 3 campanhas em inglês na Aba 2 para liberar a gravação de voz e vídeo.
          </p>
          <button
            onClick={() => onNavigateTab(2)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition"
          >
            Ir para Aba 2 (Roteiros)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {creatives.map((creative) => {
            const fb = feedback[creative.id];

            return (
              <div
                key={creative.id}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 space-y-4"
              >
                {/* Cabeçalho do Criativo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {creative.angle}
                      </span>
                      <span className="text-sm font-extrabold text-white truncate">
                        {creative.product?.title || 'Oferta US'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      <strong className="text-slate-300">Roteiro:</strong> &ldquo;{creative.hookEn}{' '}
                      {creative.bodyEn} {creative.ctaEn}&rdquo;
                    </p>
                  </div>

                  {creative.tiktokPublishId && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      TikTok: {creative.tiktokPublishId}
                    </span>
                  )}
                </div>

                {/* 3 Etapas Lado a Lado */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Etapa 1: Locução Gratuita / ElevenLabs */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        1. Locução Nativa (.MP3) • Grátis
                      </span>

                      <select
                        value={selectedVoice[creative.id] || US_VOICES[0].id}
                        onChange={(e) =>
                          setSelectedVoice((prev) => ({
                            ...prev,
                            [creative.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-2 text-xs text-white"
                      >
                        {US_VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Funciona a R$ 0,00 sem precisar de chave paga (Voz Neural TikTok EUA / Google US).
                      </p>

                      {creative.audioFilePath && (
                        <div className="space-y-1.5 pt-1">
                          <audio
                            controls
                            src={resolveMediaSrc(creative.audioFilePath)}
                            className="w-full h-8"
                          />
                          <a
                            href={creative.audioFilePath}
                            download={`locucao_${creative.angle}.mp3`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white"
                          >
                            <Download className="w-3 h-3" />
                            Baixar Áudio (.MP3)
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateAudio(creative)}
                      disabled={loadingAudioId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-3.5 py-2 text-xs font-extrabold text-white transition"
                    >
                      {loadingAudioId === creative.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Gerando Voz Grátis...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          Gerar Voz Americana (Grátis)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 2: Gerador de Vídeo Criativo IA + FFmpeg */}
                  <div className="rounded-xl bg-slate-950/90 border border-cyan-500/30 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        2. Gerar Vídeo Criativo c/ IA (.MP4) • Grátis
                      </span>

                      <select
                        value={selectedVideoStyle[creative.id] || 'AI_SCENES'}
                        onChange={(e) =>
                          setSelectedVideoStyle((prev) => ({
                            ...prev,
                            [creative.id]: e.target.value as
                              | 'AI_SCENES'
                              | 'KINETIC_CARDS'
                              | 'CUSTOM_UPLOAD',
                          }))
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-2 text-xs text-white"
                      >
                        <option value="AI_SCENES">
                          ✨ IA Criativa: 4 Cenas Visuais + Legendas + Movimento (Padrão)
                        </option>
                        <option value="KINETIC_CARDS">
                          ⚡ Motion Cards Virais (Estilo VSL / TikTok Neon)
                        </option>
                        <option value="CUSTOM_UPLOAD">
                          📤 Subir Meu Próprio Vídeo (.MP4 do Pexels)
                        </option>
                      </select>

                      {(selectedVideoStyle[creative.id] || 'AI_SCENES') === 'CUSTOM_UPLOAD' ? (
                        <div className="space-y-1.5">
                          <input
                            type="file"
                            accept="video/mp4,video/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setSelectedVideoFiles((prev) => ({
                                ...prev,
                                [creative.id]: f,
                              }));
                            }}
                            className="w-full text-xs text-slate-300 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700"
                          />
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Escolha um vídeo vertical .MP4 do seu PC/celular para unir com a locução.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          A IA cria <strong className="text-slate-200">4 cenas animadas (9:16)</strong> com fotos do nicho, legendas em inglês sincronizadas com a voz, estrelas, preço em US$ e ondas de áudio!
                        </p>
                      )}

                      {creative.videoFilePath && (
                        <div className="space-y-1.5 pt-1">
                          <video
                            controls
                            src={resolveMediaSrc(creative.videoFilePath)}
                            className="w-full max-h-48 rounded-lg border border-slate-800 bg-black"
                          />
                          <a
                            href={creative.videoFilePath}
                            download={`video_ia_usa_${creative.angle}.mp4`}
                            className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 py-1.5 text-[11px] font-extrabold text-emerald-300 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar Vídeo Pronto (.MP4)
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRenderVideoWithFfmpeg(creative)}
                      disabled={loadingVideoId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 px-3.5 py-2.5 text-xs font-extrabold text-white transition shadow-lg shadow-cyan-950/50"
                    >
                      {loadingVideoId === creative.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Criando Vídeo c/ IA (~8s)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Gerar Vídeo Criativo c/ IA (.MP4)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 3: Publicar no TikTok */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        3. Publicar no TikTok (Grátis / Orgânico)
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Baixe o <strong className="text-white">.MP4</strong> na Etapa 2 para postar grátis pelo celular no TikTok EUA, Reels e Shorts — ou envie pela API oficial abaixo se conectou na Aba 0.
                      </p>
                      <input
                        type="url"
                        value={publicVideoUrls[creative.id] || ''}
                        onChange={(e) =>
                          setPublicVideoUrls((prev) => ({
                            ...prev,
                            [creative.id]: e.target.value,
                          }))
                        }
                        placeholder="URL pública do vídeo (opcional)"
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                      />
                    </div>

                    <button
                      onClick={() => handlePublishTikTok(creative)}
                      disabled={publishingId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 px-3.5 py-2 text-xs font-extrabold text-white transition"
                    >
                      {publishingId === creative.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Publicar no TikTok US
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {fb && (
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 border ${
                      fb.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/60 border-red-500/40 text-red-200'
                    }`}
                  >
                    {fb.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{fb.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
