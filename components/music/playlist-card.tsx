"use client"

import Link from "next/link"
import { ListMusic } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { useI18n, useT } from "@/lib/i18n"
import { toFaDigits } from "@/lib/format"
import type { Playlist } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PlaylistCard({
  playlist,
  className,
}: {
  playlist: Playlist
  className?: string
}) {
  const t = useT()
  const { locale } = useI18n()
  const count = playlist.trackIds.length
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className={cn(
        "group w-[164px] shrink-0 rounded-3xl glass-card p-3 transition hover:-translate-y-1 hover:bg-white/10",
        className
      )}
    >
      <div className="relative mb-3">
        <CoverImage
          seed={playlist.id + playlist.name}
          src={playlist.coverUrl || undefined}
          alt={playlist.name}
          className="aspect-square w-full"
        />
        <span className="absolute bottom-2 end-2 grid size-9 place-items-center rounded-full bg-black/50 backdrop-blur">
          <ListMusic className="size-4 text-white" />
        </span>
      </div>
      <p className="truncate text-sm font-semibold">{playlist.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {locale === "fa" ? toFaDigits(count) : count} {t("playlists.tracksCount")}
      </p>
    </Link>
  )
}
