"use client"

import Link from "next/link"
import { BadgeCheck } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { useI18n, useT } from "@/lib/i18n"
import { formatCompact } from "@/lib/format"
import type { Artist } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ArtistCard({
  artist,
  className,
}: {
  artist: Artist
  className?: string
}) {
  const t = useT()
  const { locale } = useI18n()
  return (
    <Link
      href={`/artists/${artist.id}`}
      className={cn(
        "group w-[148px] shrink-0 rounded-3xl glass-card p-3 text-center transition hover:-translate-y-1 hover:bg-white/10",
        className
      )}
    >
      <CoverImage
        seed={artist.id}
        src={artist.avatarUrl || undefined}
        alt={artist.name}
        className="mx-auto mb-3 aspect-square w-full"
        rounded="rounded-full"
      />
      <p className="flex items-center justify-center gap-1 truncate text-sm font-semibold">
        {artist.name}
        {artist.verified && (
          <BadgeCheck className="size-4 shrink-0 text-primary" />
        )}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatCompact(artist.followerCount, locale)} {t("profile.followers")}
      </p>
    </Link>
  )
}
