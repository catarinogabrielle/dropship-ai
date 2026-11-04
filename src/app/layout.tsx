import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'US Dollar AI Autopilot • Vendas em Dólar Passo a Passo',
  description:
    'Sistema SaaS Full-Stack 100% Real para Operação Internacional em Dólar (Kiwify Global, Shopify US, TikTok Shop US, Meta Ads & Google Ads)',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
