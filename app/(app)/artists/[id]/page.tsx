"use client"

import { useParams } from "next/navigation"
import { BadgeCheck, Check, Mic2, Plus } from "lucide-react"

import { AlbumCard } from "@/components/music/album-card"
import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { Section } from "@/components/music/section"
import { TrackCard } from "@/components/music/track-card"
import {
  useAlbumsByArtist,
  useArtist,
  useToggleFollowArtist,
  useTracksByArtist,
} from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatCompact } from "@/lib/format"
import { tierConfig } from "@/lib/subscriptions"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

export default function ArtistProfilePage() {
  const t = useT()
  const { locale } = useI18n()
  const params = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const { data: artist, isLoading } = useArtist(params.id)
  const { data: albums = [] } = useAlbumsByArtist(params.id)
  const { data: tracks = [] } = useTracksByArtist(params.id)
  const toggleFollow = useToggleFollowArtist(user?.id)

  if (!isLoading && !artist) {
    return <EmptyState icon={Mic2} title={t("browse.empty")} className="mt-8" />
  }
  if (!artist) return null

  const singles = tracks.filter((tr) => tr.type === "single")
  const following = user?.followingArtistIds.includes(artist.id) ?? false
  const canViewStats = user ? tierConfig(user.tier).canViewStats : false

  function onFollow() {
    if (!user) return
    toggleFollow.mutate(artist!.id, {
      onSuccess: (updated) => setUser(updated),
    })
  }

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-start">
        <CoverImage
          seed={artist.id}
          src={artist.avatarUrl || undefined}
          alt={artist.name}
          className="size-40 shrink-0 shadow-2xl shadow-primary/20"
          rounded="rounded-full"
        />
        <div className="min-w-0 flex-1">
          {artist.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              <BadgeCheck className="size-3.5" />
              {t("profile.verified")}
            </span>
          )}
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            {artist.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCompact(artist.followerCount, locale)} {t("profile.followers")}
          </p>
          {artist.bio && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:mx-0">
              {artist.bio}
            </p>
          )}
          {user && (
            <button
              type="button"
              onClick={onFollow}
              disabled={toggleFollow.isPending}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition",
                following
                  ? "glass text-foreground hover:bg-white/10"
                  : "bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40 hover:scale-105"
              )}
            >
              {following ? (
                <>
                  <Check className="size-4" />
                  {t("common.following")}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("common.follow")}
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {canViewStats && (
        <div className="grid grid-cols-3 gap-3 sm:max-w-2xl">
          <div className="rounded-2xl glass px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("player.listeners")}</p>
            <p className="mt-1 font-display text-xl font-bold">
              {formatCompact(artist.monthlyListeners, locale)}
            </p>
          </div>
          <div className="rounded-2xl glass px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("profile.followers")}</p>
            <p className="mt-1 font-display text-xl font-bold">
              {formatCompact(artist.followerCount, locale)}
            </p>
          </div>
          <div className="rounded-2xl glass px-4 py-3">
      <p className="text-xs text-muted-foreground">{t("player.streams")}</p>
      <p className="mt-1 font-display text-xl font-bold">
        {formatCompact(
          tracks.reduce((sum, tr) => sum + tr.streams, 0),
          locale
        )}
      </p>
    </div>
        </div>
      )}
      {!canViewStats && (
        <p className="rounded-2xl glass px-4 py-3 text-xs text-muted-foreground">
          {t("profile.statsGoldOnly")}
        </p>
      )}

      {albums.length > 0 && (
        <Section title={t("profile.albums")} scroll={false}>
          <div className="flex flex-wrap gap-3">
            {albums.map((al) => (
              <AlbumCard key={al.id} album={al} />
            ))}
          </div>
        </Section>
      )}

      {singles.length > 0 && (
        <Section title={t("profile.singles")} scroll={false}>
          <div className="flex flex-wrap gap-3">
            {singles.map((tr) => (
              <TrackCard key={tr.id} track={tr} context={singles} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
