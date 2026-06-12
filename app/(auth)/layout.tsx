import { Brand } from "@/components/layout/brand"
import { LanguageToggle } from "@/components/layout/language-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-5 start-5">
        <Brand />
      </div>
      <div className="absolute top-5 end-5">
        <LanguageToggle />
      </div>
      <main className="w-full max-w-md">{children}</main>
    </div>
  )
}
