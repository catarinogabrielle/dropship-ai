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
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { CreativeData } from '@/types/autopilot';

interface Module3VideoTikTokProps {
  creatives: CreativeData[];
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: number) => void;
}

const US_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Voz Feminina Americana • Estilo TikTok/Reels)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (Voz Masculina Americana • Jovem e Dinâmica)' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (Voz Masculina Americana • Locutor Sério/Autoridade)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Voz Feminina Americana • Suave e Conversacional)' },
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
              'Erro ao gerar locução. Verifique se sua chave da ElevenLabs está conectada na Aba 0.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: `Áudio em inglês gerado com sucesso! Ouça no player abaixo ou baixe o arquivo .MP3.`,
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
    if (!file) {
      setFeedback((prev) => ({
        ...prev,
        [creative.id]: {
          type: 'error',
          message:
            'Primeiro clique em "Escolher arquivo" na Etapa 2 e selecione um vídeo .mp4 do seu computador.',
        },
      }));
      return;
    }

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
      formData.append('video', file);

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
            message: data.error || 'Falha ao juntar o vídeo com a voz.',
          },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [creative.id]: {
            type: 'success',
            message: `Vídeo comercial pronto! Assista abaixo, baixe o .MP4 para seu computador ou publique no TikTok.`,
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
            message: `Publicado no TikTok US com sucesso! Código da postagem: ${data.publishId}`,
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
    <div className="space-y-6">
      {/* Guia Passo a Passo da Aba 3 para Iniciantes */}
      <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase">
            <HelpCircle className="w-4 h-4" />
            COMO USAR ESTA TELA (PASSO 3 — CRIAR A VOZ AMERICANA E O VÍDEO DO ANÚNCIO)
          </div>
          <a
            href="https://www.pexels.com/pt-br/procurar/videos/vertical/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200"
          >
            Onde baixar vídeos de fundo grátis (Pexels Videos)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-purple-300 block mb-1">
              Etapa 1: Gerar a Voz Americana (.MP3)
            </strong>
            Escolha se quer voz de mulher ou homem americano e clique no botão roxo. A ElevenLabs vai gravar a locução em inglês perfeita falando o roteiro da Aba 2.
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-cyan-300 block mb-1">
              Etapa 2: Juntar Vídeo + Voz (.MP4)
            </strong>
            Pegue qualquer vídeo `.mp4` no seu computador (pode ser um vídeo do produto ou um vídeo vertical gratuito do Pexels) e clique no botão azul. O sistema junta o vídeo com a voz americana!
          </div>
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
            <strong className="text-pink-300 block mb-1">
              Etapa 3: Baixar o Vídeo ou Postar no TikTok
            </strong>
            Depois de pronto, você pode clicar em <strong>&ldquo;Baixar Vídeo Pronto (.MP4)&rdquo;</strong> para subir no Facebook Ads/YouTube ou clicar no botão rosa para postar direto no TikTok!
          </div>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">
            Você ainda não tem roteiros para transformar em vídeo
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Volte na Aba 2 e clique em &ldquo;Gerar 3 Campanhas em Inglês&rdquo; para criar os roteiros primeiro.
          </p>
          <button
            onClick={() => onNavigateTab(2)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition"
          >
            Voltar para Aba 2: Gerar Roteiros em Inglês
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {creatives.map((creative) => {
            const fb = feedback[creative.id];

            return (
              <div
                key={creative.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {creative.angle}
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        Produto: {creative.product?.title || 'Oferta US'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">
                      <strong>Fala em Inglês que será gravada:</strong> &ldquo;{creative.hookEn}{' '}
                      {creative.bodyEn} {creative.ctaEn}&rdquo;
                    </p>
                  </div>

                  {creative.tiktokPublishId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Postado no TikTok ({creative.tiktokPublishId})
                    </span>
                  )}
                </div>

                {/* 3 Colunas do Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Etapa 1: Voz Real ElevenLabs */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-400 font-extrabold text-xs uppercase">
                        <Volume2 className="w-4 h-4" />
                        Etapa 1: Criar a Voz em Inglês (.MP3)
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Escolha o Locutor Americano:
                        </label>
                        <select
                          value={selectedVoice[creative.id] || US_VOICES[0].id}
                          onChange={(e) =>
                            setSelectedVoice((prev) => ({
                              ...prev,
                              [creative.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                        >
                          {US_VOICES.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {creative.audioFilePath && (
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-400 block">
                            ✅ Voz gravada! Escute abaixo:
                          </span>
                          <audio
                            controls
                            src={`${creative.audioFilePath}?t=${Date.now()}`}
                            className="w-full h-9"
                          />
                          <a
                            href={creative.audioFilePath}
                            download={`locucao_${creative.angle}.mp3`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar Áudio .MP3 para meu computador
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateAudio(creative)}
                      disabled={loadingAudioId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2.5 text-xs font-extrabold text-white transition"
                    >
                      {loadingAudioId === creative.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gravando Voz na ElevenLabs...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          1. Gerar Voz Americana (.MP3)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 2: Upload .MP4 Bruto + Merge FFmpeg */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase">
                        <Upload className="w-4 h-4" />
                        Etapa 2: Juntar Vídeo com a Voz (.MP4)
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Escolha um vídeo .MP4 do seu computador:
                        </label>
                        <p className="text-[11px] text-slate-400 mb-2">
                          O sistema vai substituir o som original pela locução americana da Etapa 1.
                        </p>
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
                          className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700"
                        />
                      </div>

                      {creative.videoFilePath && (
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-400 block">
                            ✅ Vídeo pronto com a voz em inglês:
                          </span>
                          <video
                            controls
                            src={`${creative.videoFilePath}?t=${Date.now()}`}
                            className="w-full max-h-44 rounded-lg border border-slate-800 bg-black"
                          />
                          <a
                            href={creative.videoFilePath}
                            download={`video_anuncio_usa_${creative.angle}.mp4`}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 py-2 text-xs font-extrabold text-emerald-300 transition"
                          >
                            <Download className="w-4 h-4" />
                            Baixar Vídeo Pronto (.MP4) para usar nos Anúncios
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRenderVideoWithFfmpeg(creative)}
                      disabled={loadingVideoId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-2.5 text-xs font-extrabold text-white transition"
                    >
                      {loadingVideoId === creative.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Juntando Vídeo + Voz Americana...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          2. Juntar Vídeo com a Voz (.MP4)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Etapa 3: Publicação Oficial no TikTok US */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-pink-400 font-extrabold text-xs uppercase">
                        <Send className="w-4 h-4" />
                        Etapa 3: Postar no TikTok Automaticamente
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Se você conectou sua conta do TikTok na Aba 0, clique no botão rosa abaixo para enviar o vídeo pronto direto para o seu perfil do TikTok.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        💡 <strong>Dica:</strong> Se preferir postar pelo celular ou subir no Gerenciador de Anúncios do Facebook/Google, basta clicar em <strong>&ldquo;Baixar Vídeo Pronto (.MP4)&rdquo;</strong> na Etapa 2 ao lado!
                      </p>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Link Público do Vídeo (Deixe em branco para enviar o vídeo da Etapa 2):
                        </label>
                        <input
                          type="url"
                          value={publicVideoUrls[creative.id] || ''}
                          onChange={(e) =>
                            setPublicVideoUrls((prev) => ({
                              ...prev,
                              [creative.id]: e.target.value,
                            }))
                          }
                          placeholder="Opcional"
                          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handlePublishTikTok(creative)}
                      disabled={publishingId === creative.id}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 px-4 py-2.5 text-xs font-extrabold text-white transition"
                    >
                      {publishingId === creative.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando para o TikTok...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          3. Publicar Direto no TikTok US
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {fb && (
                  <div
                    className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 border ${
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
