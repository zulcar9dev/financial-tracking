import type { Metadata } from 'next'
import ThemeProvider from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financial Tracking AI | Catat tanpa ribet',
  description:
    'Catat transaksi lewat chat, foto struk, atau formulir manual. Selalu tinjau hasilnya sebelum data disimpan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}