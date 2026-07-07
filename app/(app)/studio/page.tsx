"use client"

import * as React from "react"
import { Lock, Music2, Pencil, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useArtist,
  useArtists,
  useStudioMutations,
  useTracksByArtist,
  useAlbumsByArtist ,
} from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatCompact } from "@/lib/format"
import type { ReleaseType, Track,Album } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

// Phase-1 mock: uploaded audio can't be persisted to LocalStorage, so a bundled
// royalty-free track is assigned. Phase 2 uploads the real file to the backend.
const BUNDLED_AUDIO = (n: number) => `/audio/song-${((n - 1) % 8) + 1}.mp3`

export default function StudioPage() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const { data: artist } = useArtist(user?.artistId)
  const { data: artists = [] } = useArtists()
  const { data: works = [] } = useTracksByArtist(user?.artistId)
  const { data: albums = [] } = useAlbumsByArtist(user?.artistId)
  const { publish, update, remove , removeAlbum } = useStudioMutations()

  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState<ReleaseType>("single")
  const [genre, setGenre] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [lyrics, setLyrics] = React.useState("")
  const [featured, setFeatured] = React.useState<string[]>([])
  const [audioName, setAudioName] = React.useState("")
  const [coverUrl, setCoverUrl] = React.useState("")
  const [editing, setEditing] = React.useState<Track | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editLyrics, setEditLyrics] = React.useState("")
  const [audioUrl, setAudioUrl] = React.useState("")

  if (!user || user.role !== "artist" || !user.artistId) {
    return (
      <EmptyState icon={Lock} title={t("studio.notApproved")} className="mt-8" />
    )
  }
  if (artist && artist.status !== "approved") {
    return (
      <EmptyState icon={Lock} title={t("studio.notApproved")} className="mt-8" />
    )
  }

  function toggleFeatured(id: string) {
    setFeatured((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  function onPublish(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !genre.trim()) {
      toast.error(t("studio.trackTitle"))
      return
    }
    publish.mutate(
      {
        title: title.trim(),
        artistId: user!.artistId!,
        type,
        genre: genre.trim(),
        year,
        lyrics: lyrics.trim() || undefined,
        featuredArtistIds: featured,
        audioUrl: audioUrl || BUNDLED_AUDIO(works.length + 1),
        coverUrl: coverUrl || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("studio.publish"))
          setTitle("")
          setGenre("")
          setLyrics("")
          setFeatured([])
          setAudioName("")
          setCoverUrl("")
          setAudioUrl("")
        },
      }
    )
  }

  function saveEdit() {
    if (!editing) return
    update.mutate(
      { id: editing.id, patch: { title: editTitle, lyrics: editLyrics } },
      {
        onSuccess: () => {
          toast.success(t("common.save"))
          setEditing(null)
        },
      }
    )
  }

  return (
    <div className="space-y-8 pt-2">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        {t("studio.title")}
      </h1>

      {/* Upload form */}
      <form
        onSubmit={onPublish}
        className="space-y-4 rounded-3xl glass-strong p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Upload className="size-5 text-primary" />
          {t("studio.upload")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("studio.trackTitle")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("studio.type")}</Label>
            <div className="flex h-9 items-center gap-1 rounded-md glass p-1">
              {(["single", "album"] as ReleaseType[]).map((ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setType(ty)}
                  className={cn(
                    "flex-1 rounded-sm py-1 text-xs transition",
                    type === ty
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ty === "single" ? t("browse.singles") : t("browse.albums")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="genre">{t("studio.genre")}</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">{t("studio.year")}</Label>
            <Input
              id="year"
              type="number"
              dir="ltr"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            {t("studio.featured")}{" "}
            <span className="text-xs text-muted-foreground">
              ({t("common.optional")})
            </span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {artists
              .filter((a) => a.id !== user.artistId)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleFeatured(a.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition",
                    featured.includes(a.id)
                      ? "bg-primary/20 text-primary"
                      : "glass text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a.name}
                </button>
              ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lyrics">
            {t("studio.lyrics")}{" "}
            <span className="text-xs text-muted-foreground">
              ({t("common.optional")})
            </span>
          </Label>
          <Textarea
            id="lyrics"
            rows={3}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover">{t("studio.cover")}</Label>
          <div className="flex items-center gap-3">
            <CoverImage
              seed={title || "cover"}
              src={coverUrl || undefined}
              alt={t("studio.cover")}
              className="size-16 shrink-0"
              rounded="rounded-xl"
            />
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setCoverUrl(String(reader.result))
                reader.readAsDataURL(file)
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audio">{t("studio.audio")}</Label>
          <Input
            id="audio"
            type="file"
            accept=".mp3,.wav,.flac,audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setAudioName(file.name)
              const reader = new FileReader()
              reader.onload = () => setAudioUrl(String(reader.result))
              reader.readAsDataURL(file)
            }
          }
          />
          {audioName && (
            <p className="text-xs text-muted-foreground" dir="ltr">
              {audioName}
            </p>
          )}
        </div>

        <Button type="submit" disabled={publish.isPending} className="gap-2">
          <Upload className="size-4" />
          {t("studio.publish")}
        </Button>
      </form>

      {/* Published works */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">{t("studio.myWorks")}</h2>
        {works.length === 0 ? (
          <EmptyState icon={Music2} title={t("empty.generic")} />
        ) : (
          <div className="space-y-2">
            {works.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-2xl glass px-3 py-3"
              >
                <CoverImage
                  seed={w.id}
                  src={w.coverUrl || undefined}
                  alt={w.title}
                  className="size-14 shrink-0"
                  rounded="rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.genre} ·{" "}
                    {w.type === "single"
                      ? t("browse.singles")
                      : t("browse.albums")}
                  </p>
                </div>
                <div className="hidden gap-5 text-center sm:flex">
                  <div>
                    <p className="text-sm font-bold tabular-nums">
                      {formatCompact(w.listeners, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("player.listeners")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums">
                      {formatCompact(w.streams, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("player.streams")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums">
                      {formatCompact(w.streams * 15, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("studio.revenue")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("common.edit")}
                  onClick={() => {
                    setEditing(w)
                    setEditTitle(w.title)
                    setEditLyrics(w.lyrics ?? "")
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("common.delete")}
                  onClick={() =>
                    remove.mutate(w.id, {
                      onSuccess: () => toast.success(t("common.delete")),
                    })
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
      {albums.length > 0 && (
  <section className="space-y-3">
    <h2 className="font-display text-lg font-bold">{t("browse.albums")}</h2>
    <div className="space-y-2">
      {albums.map((al) => (
        <div
          key={al.id}
          className="flex items-center gap-3 rounded-2xl glass px-3 py-3"
        >
          <CoverImage
            seed={al.id}
            src={al.coverUrl || undefined}
            alt={al.title}
            className="size-14 shrink-0"
            rounded="rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{al.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {al.genre} · {al.trackIds.length} {t("playlists.tracksCount")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.delete")}
            onClick={() =>
              removeAlbum.mutate(al.id, {
                onSuccess: () => toast.success(t("common.delete")),
              })
            }
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  </section>
)}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">{t("studio.trackTitle")}</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lyrics">{t("studio.lyrics")}</Label>
              <Textarea
                id="edit-lyrics"
                rows={4}
                value={editLyrics}
                onChange={(e) => setEditLyrics(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
