"use client"

import * as React from "react"
import { toast } from "sonner"

import { recordStream, StreamLimitError } from "@/lib/api/stats"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

// The one and only <audio> element. It mirrors the player store: store is the
// single source of truth, this component is the imperative bridge to the DOM.

export function AudioEngine() {
  const t = useT()
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const lastCountedId = React.useRef<string | null>(null)

  const user = useAuthStore((s) => s.user)
  const current = usePlayerStore((s) => s.queue[s.currentIndex] ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const seekRequest = usePlayerStore((s) => s.seekRequest)

  const setPlaying = usePlayerStore((s) => s.setPlaying)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const consumeSeek = usePlayerStore((s) => s.consumeSeek)
  const next = usePlayerStore((s) => s.next)

  // Load a new source when the track changes + count the stream (with the
  // basic-tier daily cap enforced).
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.dataset.trackId === current.id) return
    audio.dataset.trackId = current.id
    audio.src = current.audioUrl
    audio.load()

    if (user && lastCountedId.current !== current.id) {
      lastCountedId.current = current.id
      recordStream(user.id, current.id, user.tier).catch((err) => {
        if (err instanceof StreamLimitError) {
          setPlaying(false)
          toast.error(t("player.limitReached"))
        }
      })
    }
  }, [current, user, setPlaying, t])

  // Play / pause
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, current, setPlaying])

  // Volume
  React.useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = muted ? 0 : volume
  }, [volume, muted])

  // Seek
  React.useEffect(() => {
    const audio = audioRef.current
    if (audio && seekRequest !== null) {
      audio.currentTime = seekRequest
      consumeSeek()
    }
  }, [seekRequest, consumeSeek])

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={() => next(true)}
      preload="metadata"
      hidden
    />
  )
}
