import type { Metadata, Viewport } from "next"
import { Vazirmatn } from "next/font/google"
// 1. Import localFont instead of Sora
import localFont from "next/font/local"

import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

const shabnam = localFont({
  src: [
    {
      path: "../public/fonts/shabnam/Shabnam-Light.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/shabnam/Shabnam.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/shabnam/Shabnam-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "نوا | Nava",
  description: "سرویس استریم موسیقی نوا — موسیقی، بی‌مرز.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nava",
    statusBarStyle: "black-translucent",
  },
}

export const viewport: Viewport = {
  themeColor: "#0B0712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn(vazirmatn.variable, shabnam.variable, "antialiased")}
    >
      <body>
        <ThemeProvider defaultTheme="dark">
          <Providers>{children}</Providers>
        </ThemeProvider>
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  )
}
