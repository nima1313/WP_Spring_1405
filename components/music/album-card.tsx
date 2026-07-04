"use client"

import Link from "next/link"
import { Disc3 } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { useArtistMap } from "@/lib/queries"
import { useI18n } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"
import type { Album } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AlbumCard({
  album,
  className,
}: {
  album: Album
  className?: string
}) {
  const artists = useArtistMap()
  const { locale } = useI18n()
  const artist = artists[album.artistId]

  return (
    <div
      className={cn(
        "group w-[164px] shrink-0 rounded-3xl glass-card p-3 transition hover:-translate-y-1 hover:bg-white/10",
        className
      )}
    >
      <Link href={`/album/${album.id}`} className="relative mb-3 block">
        <CoverImage
          seed={album.id}
          src={album.coverUrl || undefined}
          alt={album.title}
          className="aspect-square w-full"
        />
        <span className="absolute bottom-2 end-2 grid size-9 place-items-center rounded-full bg-black/50 text-foreground opacity-0 backdrop-blur transition group-hover:opacity-100">
          <Disc3 className="size-4 text-white" />
        </span>
      </Link>
      <Link
        href={`/album/${album.id}`}
        className="block truncate text-sm font-semibold hover:text-primary"
      >
        {album.title}
      </Link>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {artist && (
          <Link href={`/artists/${artist.id}`} className="hover:text-foreground">
            {artist.name}
          </Link>
        )}
        <span className="mx-1" aria-hidden>
          ·
        </span>
        {locale === "fa"
          ? toJalali(album.releaseDate).slice(0, 4)
          : new Date(album.releaseDate).getFullYear()}
      </div>
    </div>
  )
}
