import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10B981',
};

export const metadata: Metadata = {
  title: 'US Dollar AI Autopilot • Vendas em Dólar Passo a Passo',
  description:
    'Sistema SaaS Full-Stack 100% Real para Operação Internacional em Dólar (Kiwify Global, Shopify US, TikTok Shop US, Meta Ads & Google Ads)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'USD Autopilot',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#070B12] text-slate-100">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
