import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ToastProvider } from '@/components/providers/toast-provider'
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Alabanza IBG",
  description: "Plataforma de gestión para el ministerio de alabanza IBG",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alabanza IBG",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/ibglogo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/ibglogoconletras.png" />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <ToastProvider>
          {children}
        </ToastProvider>
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=f0790135-29e2-4672-869f-fa15f046723e"></script>
{/* impeccable-live-end */}
</body>
    </html>
  )
}