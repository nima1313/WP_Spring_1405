import type { Metadata, Viewport } from "next"
import { Sora, Vazirmatn } from "next/font/google"

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

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "نوا | Nava",
  description: "سرویس استریم موسیقی نوا — موسیقی، بی‌مرز.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Nava", statusBarStyle: "black-translucent" },
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
      className={cn(vazirmatn.variable, sora.variable, "antialiased")}
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
