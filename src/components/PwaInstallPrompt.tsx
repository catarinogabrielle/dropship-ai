'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Registra o Service Worker para habilitar instalacao PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 2. Verifica se ja esta rodando instalado em modo Standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detecta iOS (iPhone / iPad)
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    // Exibe o banner de convite para instalar caso o usuario nao tenha fechado nesta sessao
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowManualModal(false);
      setDeferredPrompt(null);
    };

    const handleCustomOpen = async () => {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowBanner(false);
        }
      } else {
        setShowManualModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-install', handleCustomOpen);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleCustomOpen);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else {
      setShowBanner(false);
      setShowManualModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', '1');
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* BANNER FLUTUANTE DE INSTALAÇÃO PWA */}
      {showBanner && (
        <div className="fixed bottom-16 lg:bottom-5 right-3 left-3 sm:left-auto sm:right-5 sm:max-w-sm z-40 rounded-2xl border border-emerald-500/50 bg-[#0B101B]/95 backdrop-blur-md p-4 shadow-2xl shadow-emerald-950/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <img
                src="/favicon.svg"
                alt="App Icon"
                className="w-10 h-10 rounded-xl shrink-0 shadow-md"
              />
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                  APLICATIVO OFICIAL (PWA)
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Instalar US Dollar Autopilot
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Instale no seu celular ou computador para abrir direto da sua tela inicial sem depender do navegador.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              aria-label="Fechar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleDismissBanner}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition shadow-lg shadow-emerald-950/50"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar Aplicativo
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE INSTRUÇÃO RÁPIDA (PARA iOS OU QUANDO O NAVEGADOR EXIGE CLIQUE NA BARRA) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img src="/favicon.svg" alt="Icon" className="w-7 h-7 rounded-lg" />
                <h3 className="text-sm font-extrabold text-white">
                  Como Instalar o Aplicativo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {isIos ? (
                <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                    No iPhone / iPad (Safari):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>
                      Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima ⬆️) na barra do Safari.
                    </li>
                    <li>
                      Role para baixo e toque em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
                    </li>
                    <li>
                      Toque em <strong>Adicionar</strong> no canto superior direito!
                    </li>
                  </ol>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-emerald-400">
                      <Monitor className="w-4 h-4" />
                      No Computador (Chrome ou Edge):
                    </div>
                    <p className="leading-relaxed">
                      Olhe para o canto direito da <strong>barra de endereço</strong> (ao lado da estrela de favoritos) e clique no ícone <strong>📲 Instalar US Dollar AI Autopilot</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-cyan-400">
                      <Smartphone className="w-4 h-4" />
                      No Celular Android (Chrome):
                    </div>
                    <p className="leading-relaxed">
                      Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
