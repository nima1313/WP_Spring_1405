import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"

export function Section({
  title,
  href,
  hrefLabel,
  children,
  className,
  scroll = true,
}: {
  title: string
  href?: string
  hrefLabel?: string
  children: React.ReactNode
  className?: string
  scroll?: boolean
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            {hrefLabel}
            <ChevronLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        )}
      </div>
      {scroll ? (
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {children}
        </div>
      ) : (
        <div>{children}</div>
      )}
    </section>
  )
}
