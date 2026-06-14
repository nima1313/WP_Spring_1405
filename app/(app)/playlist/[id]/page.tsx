"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ListMusic, Pencil, Play, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { Input } from "@/components/ui/input"
import { TrackRow } from "@/components/music/track-row"
import {
  usePlaylist,
  usePlaylistMutations,
  useTracksByIds,
} from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { toFaDigits } from "@/lib/format"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

export default function PlaylistDetailPage() {
  const t = useT()
  const { locale } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const { data: playlist, isLoading } = usePlaylist(params.id)
  const { data: tracks = [] } = useTracksByIds(playlist?.trackIds ?? [])
  const { rename, remove, removeTrack } = usePlaylistMutations(user?.id)
  const playQueue = usePlayerStore((s) => s.playQueue)

  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [name, setName] = React.useState("")

  if (!isLoading && !playlist) {
    return <EmptyState icon={ListMusic} title={t("browse.empty")} className="mt-8" />
  }
  if (!playlist) return null

  const count = playlist.trackIds.length

  function onRename() {
    if (!name.trim()) return
    rename.mutate(
      { id: playlist!.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success(t("common.rename"))
          setRenameOpen(false)
        },
      }
    )
  }

  function onDelete() {
    remove.mutate(playlist!.id, {
      onSuccess: () => {
        toast.success(t("common.delete"))
        router.replace("/library/playlists")
      },
    })
  }

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <CoverImage
          seed={playlist.id + playlist.name}
          src={playlist.coverUrl || undefined}
          alt={playlist.name}
          className="size-44 shrink-0 shadow-2xl shadow-primary/20"
          rounded="rounded-3xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("nav.playlists")}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">
            {playlist.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "fa" ? toFaDigits(count) : count}{" "}
            {t("playlists.tracksCount")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={() => playQueue(tracks, 0)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105"
              >
                <Play className="size-4 fill-current" />
                {t("player.play")}
              </button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/browse")}
            >
              <Plus className="size-4" />
              {t("playlists.addSongs")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.rename")}
              onClick={() => {
                setName(playlist.name)
                setRenameOpen(true)
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      {tracks.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title={t("playlists.empty")}
          action={
            <Button onClick={() => router.push("/browse")} className="gap-2">
              <Plus className="size-4" />
              {t("playlists.addSongs")}
            </Button>
          }
        />
      ) : (
        <div className="rounded-3xl glass p-2">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              context={tracks}
              onRemove={() =>
                removeTrack.mutate({
                  playlistId: playlist.id,
                  trackId: track.id,
                })
              }
            />
          ))}
        </div>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("common.rename")}</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onRename()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onRename}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("playlists.deleteConfirm")}</DialogTitle>
            <DialogDescription>{playlist.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
