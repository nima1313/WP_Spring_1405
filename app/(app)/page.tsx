"use client"

import * as React from "react"
import { Play, Sparkles } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { AlbumCard } from "@/components/music/album-card"
import { PlaylistCard } from "@/components/music/playlist-card"
import { Section } from "@/components/music/section"
import { TrackCard } from "@/components/music/track-card"
import {
  useAlbums,
  usePlaylists,
  useRecents,
  useTracks,
} from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { tierConfig } from "@/lib/subscriptions"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

export default function HomePage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const { data: albums = [] } = useAlbums()
  const { data: tracks = [] } = useTracks()
  const { data: playlists = [] } = usePlaylists(user?.id)
  const { data: recents = [] } = useRecents(user?.id)
  const playQueue = usePlayerStore((s) => s.playQueue)

  const latestAlbums = React.useMemo(
    () =>
      [...albums]
        .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate))
        .slice(0, 12),
    [albums]
  )
  const singles = React.useMemo(
    () =>
      tracks
        .filter((tr) => tr.type === "single")
        .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)),
    [tracks]
  )
  const earlyAccess = React.useMemo(
    () =>
      tracks
        .filter((tr) => tr.earlyAccess)
        .sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)),
    [tracks]
  )

  const trackById = React.useMemo(
    () => Object.fromEntries(tracks.map((tr) => [tr.id, tr])),
    [tracks]
  )
  const playlistById = React.useMemo(
    () => Object.fromEntries(playlists.map((p) => [p.id, p])),
    [playlists]
  )

  const canEarly = user ? tierConfig(user.tier).earlyAccess : false
  const recentTracks = recents
    .filter((r) => r.kind === "track" && trackById[r.refId])
    .map((r) => trackById[r.refId])
  const recentPlaylists = recents
    .filter((r) => r.kind === "playlist" && playlistById[r.refId])
    .map((r) => playlistById[r.refId])

  return (
    <div className="space-y-8 pt-2">
      {/* Greeting + hero */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/30 via-fuchsia-500/15 to-transparent p-6 md:p-8">
        <div className="flex items-center gap-4">
          {user && (
            <CoverImage
              seed={user.handle}
              src={user.avatarUrl || undefined}
              alt={user.displayName}
              className="size-14 shrink-0"
              rounded="rounded-full"
            />
          )}
          <div>
            <p className="text-sm text-muted-foreground">{t("home.forYou")}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold md:text-3xl">
              {t("home.greeting")}
              {user ? `، ${user.displayName}` : ""} 👋
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          {t("home.earlyAccessHint")}
        </p>
        {singles.length > 0 && (
          <button
            type="button"
            onClick={() => playQueue(singles, 0)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105"
          >
            <Play className="size-4 fill-current" />
            {t("home.startListening")}
          </button>
        )}
      </div>

      {recentTracks.length + recentPlaylists.length > 0 && (
        <Section title={t("home.recent")}>
          {recentPlaylists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
          {recentTracks.map((tr) => (
            <TrackCard key={tr.id} track={tr} context={recentTracks} />
          ))}
        </Section>
      )}

      {canEarly && earlyAccess.length > 0 && (
        <Section
          title={t("home.earlyAccess")}
          href="/browse"
          hrefLabel={t("common.more")}
        >
          {earlyAccess.map((tr) => (
            <div key={tr.id} className="relative">
              <TrackCard track={tr} context={earlyAccess} />
            </div>
          ))}
        </Section>
      )}

      <Section
        title={t("home.latestAlbums")}
        href="/browse"
        hrefLabel={t("common.more")}
      >
        {latestAlbums.map((al) => (
          <AlbumCard key={al.id} album={al} />
        ))}
      </Section>

      <Section
        title={t("home.latestSingles")}
        href="/browse"
        hrefLabel={t("common.more")}
      >
        {singles.slice(0, 12).map((tr) => (
          <TrackCard key={tr.id} track={tr} context={singles} />
        ))}
      </Section>

      {!canEarly && (
        <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4 text-sm text-muted-foreground">
          <Sparkles className="size-5 shrink-0 text-amber-300" />
          {t("home.earlyAccessHint")} — {t("settings.upgrade")}.
        </div>
      )}
    </div>
  )
}
