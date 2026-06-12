import Link from "next/link"
import { AudioLines } from "lucide-react"

import { cn } from "@/lib/utils"

export function Brand({
  className,
  showName = true,
}: {
  className?: string
  showName?: boolean
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40">
        <AudioLines className="size-5" />
      </span>
      {showName && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          نوا
        </span>
      )}
    </Link>
  )
}
