"use client"

import * as React from "react"
import { ListMusic, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlaylistCard } from "@/components/music/playlist-card"
import { usePlaylistMutations, usePlaylists } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatNumber } from "@/lib/format"
import { canCreatePlaylist, isUnlimited, tierConfig } from "@/lib/subscriptions"
import { useAuthStore } from "@/store/auth-store"

export default function PlaylistsPage() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const { data: playlists = [] } = usePlaylists(user?.id)
  const { create } = usePlaylistMutations(user?.id)

  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")

  const limit = user ? tierConfig(user.tier).maxPlaylists : 0
  const allowed = user ? canCreatePlaylist(user.tier, playlists.length) : false

  function openCreate() {
    if (!allowed) {
      toast.error(t("playlists.limitReached"))
      return
    }
    setName("")
    setOpen(true)
  }

  function onCreate() {
    if (!name.trim()) return
    create.mutate(name.trim(), {
      onSuccess: () => {
        toast.success(t("playlists.create"))
        setOpen(false)
      },
    })
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">
            {t("playlists.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(playlists.length, locale)}
            {!isUnlimited(limit) && ` / ${formatNumber(limit, locale)}`}{" "}
            {t("nav.playlists")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          {t("playlists.create")}
        </Button>
      </div>

      {playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title={t("playlists.empty")}
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              {t("playlists.createFirst")}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("playlists.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pl-name">{t("playlists.name")}</Label>
            <Input
              id="pl-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onCreate} disabled={create.isPending}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
