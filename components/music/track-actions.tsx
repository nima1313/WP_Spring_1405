"use client"

import { Download, ListPlus, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlaylistMutations, usePlaylists } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { tierConfig } from "@/lib/subscriptions"
import type { Track } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

export function TrackActions({
  track,
  className,
}: {
  track: Track
  className?: string
}) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const { data: playlists = [] } = usePlaylists(user?.id)
  const { addTrack, removeTrack } = usePlaylistMutations(user?.id)

  const canDownload = user ? tierConfig(user.tier).canDownload : false

  function toggle(playlistId: string, contains: boolean) {
    if (contains) {
      removeTrack.mutate({ playlistId, trackId: track.id })
    } else {
      addTrack.mutate(
        { playlistId, trackId: track.id },
        { onSuccess: () => toast.success(t("browse.addToPlaylist")) }
      )
    }
  }

  function onDownload() {
    if (!canDownload) {
      toast.error(t("playlists.limitReached"))
      return
    }
    const a = document.createElement("a")
    a.href = track.audioUrl
    a.download = `${track.title}.mp3`
    a.click()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("common.more")}
            className={cn(
              "grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground",
              className
            )}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <ListPlus className="size-4" />
            {t("browse.addToPlaylist")}
          </DropdownMenuLabel>
          {playlists.length === 0 ? (
            <DropdownMenuItem disabled>{t("playlists.empty")}</DropdownMenuItem>
          ) : (
            playlists.map((pl) => {
              const contains = pl.trackIds.includes(track.id)
              return (
                <DropdownMenuCheckboxItem
                  key={pl.id}
                  checked={contains}
                  onCheckedChange={() => toggle(pl.id, contains)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {pl.name}
                </DropdownMenuCheckboxItem>
              )
            })
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDownload} disabled={!canDownload}>
          <Download className="size-4" />
          {t("browse.download")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
