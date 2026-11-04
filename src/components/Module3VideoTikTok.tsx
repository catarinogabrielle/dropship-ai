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
} from 'lucide-react';
import { CreativeData } from '@/types/autopilot';

interface Module3VideoTikTokProps {
  creatives: CreativeData[];
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
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
}: Module3VideoTikTokProps) {
  const [selectedVoice, setSelectedVoice] = useState<Record<string, string>>({});
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
              'Erro ao gerar locução. Verifique sua chave da ElevenLabs na Aba 0.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: 'Locução em inglês gerada com sucesso!',
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

  const handleRenderVideoWithFfmpeg = async (creative: CreativeData) => {
    const file = selectedVideoFiles[creative.id];

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
            message: data.error || 'Falha ao unir vídeo e locução.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: 'Vídeo comercial renderizado! Baixe o .MP4 ou envie ao TikTok.',
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
      const res = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeId: creative.id,
          publicVideoUrl: publicVideoUrls[creative.id] || undefined,
          caption: `${creative.hookEn} ${creative.ctaEn} #tiktokshop #usa`,
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
            Estúdio de Locução Nativa (ElevenLabs) & Vídeo Comercial (.MP4)
          </h2>
          <p className="text-xs text-slate-400">
            1. Gere a voz americana → 2. Suba um vídeo de fundo para unir automaticamente → 3. Baixe o .MP4 ou poste no TikTok.
          </p>
        </div>

        <a
          href="https://www.pexels.com/pt-br/procurar/videos/vertical/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 px-3.5 py-2 text-xs font-bold text-cyan-300 transition shrink-0"
        >
          Bancos de Vídeos Verticais Grátis (Pexels)
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
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
                  {/* Etapa 1: Locução ElevenLabs */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        1. Locução Nativa (.MP3)
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
                          Gerando Voz...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          Gerar Voz Americana
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 2: Renderização de Vídeo FFmpeg */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        2. Unir Vídeo de Fundo + Voz (.MP4)
                      </span>

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

                      {creative.videoFilePath && (
                        <div className="space-y-1.5 pt-1">
                          <video
                            controls
                            src={resolveMediaSrc(creative.videoFilePath)}
                            className="w-full max-h-36 rounded-lg border border-slate-800 bg-black"
                          />
                          <a
                            href={creative.videoFilePath}
                            download={`anuncio_usa_${creative.angle}.mp4`}
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
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-3.5 py-2 text-xs font-extrabold text-white transition"
                    >
                      {loadingVideoId === creative.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Renderizando Vídeo...
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5" />
                          Unir Vídeo + Locução
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 3: Publicar no TikTok */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        3. Publicar no TikTok US (Opcional)
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Envia o vídeo renderizado direto para sua conta TikTok conectada na Aba 0, ou baixe o .MP4 na Etapa 2 para subir no Meta/Google Ads.
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
                    <AlertTriangle className="w-4 h-4 shrink-0" />
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
