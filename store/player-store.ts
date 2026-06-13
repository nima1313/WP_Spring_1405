"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Track } from "@/lib/types"

export type RepeatMode = "off" | "all" | "one"

interface PlayerState {
  queue: Track[]
  /** Snapshot of pre-shuffle order so we can restore it. */
  orderedQueue: Track[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  repeat: RepeatMode
  shuffle: boolean
  /** Set by seek(); the audio engine applies and clears it. */
  seekRequest: number | null

  // selectors
  current: () => Track | null

  // playback
  playTrack: (track: Track, context?: Track[]) => void
  playQueue: (tracks: Track[], startIndex: number) => void
  togglePlay: () => void
  setPlaying: (v: boolean) => void
  next: (auto?: boolean) => void
  prev: () => void

  // transport
  seek: (time: number) => void
  consumeSeek: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void

  // modes
  toggleRepeat: () => void
  toggleShuffle: () => void

  // queue management
  enqueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (from: number, to: number) => void
  clearQueue: () => void
}

function shuffled<T>(arr: T[], keepFirst: T): T[] {
  const rest = arr.filter((x) => x !== keepFirst)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [keepFirst, ...rest]
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      orderedQueue: [],
      currentIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      repeat: "off",
      shuffle: false,
      seekRequest: null,

      current: () => {
        const { queue, currentIndex } = get()
        return queue[currentIndex] ?? null
      },

      playTrack: (track, context) => {
        const base = context && context.length ? context : [track]
        const idx = Math.max(
          0,
          base.findIndex((t) => t.id === track.id)
        )
        const { shuffle } = get()
        const queue = shuffle ? shuffled(base, base[idx]) : base
        set({
          queue,
          orderedQueue: base,
          currentIndex: shuffle ? 0 : idx,
          isPlaying: true,
          currentTime: 0,
          seekRequest: 0,
        })
      },

      playQueue: (tracks, startIndex) => {
        if (!tracks.length) return
        const { shuffle } = get()
        const queue = shuffle ? shuffled(tracks, tracks[startIndex]) : tracks
        set({
          queue,
          orderedQueue: tracks,
          currentIndex: shuffle ? 0 : startIndex,
          isPlaying: true,
          currentTime: 0,
          seekRequest: 0,
        })
      },

      togglePlay: () => {
        if (get().currentIndex === -1) return
        set((s) => ({ isPlaying: !s.isPlaying }))
      },
      setPlaying: (v) => set({ isPlaying: v }),

      next: (auto = false) => {
        const { queue, currentIndex, repeat, shuffle } = get()
        if (!queue.length) return
        if (auto && repeat === "one") {
          set({ seekRequest: 0, currentTime: 0, isPlaying: true })
          return
        }
        let nextIndex = currentIndex + 1
        if (shuffle && !auto) {
          // manual next with shuffle: random different track
          if (queue.length > 1) {
            do {
              nextIndex = Math.floor(Math.random() * queue.length)
            } while (nextIndex === currentIndex)
          } else {
            nextIndex = currentIndex
          }
        }
        if (nextIndex >= queue.length) {
          if (repeat === "all") nextIndex = 0
          else {
            set({ isPlaying: false, currentTime: 0, seekRequest: 0 })
            return
          }
        }
        set({
          currentIndex: nextIndex,
          currentTime: 0,
          seekRequest: 0,
          isPlaying: true,
        })
      },

      prev: () => {
        const { queue, currentIndex, currentTime, repeat } = get()
        if (!queue.length) return
        if (currentTime > 3) {
          set({ seekRequest: 0, currentTime: 0 })
          return
        }
        let prevIndex = currentIndex - 1
        if (prevIndex < 0) prevIndex = repeat === "all" ? queue.length - 1 : 0
        set({
          currentIndex: prevIndex,
          currentTime: 0,
          seekRequest: 0,
          isPlaying: true,
        })
      },

      seek: (time) => set({ seekRequest: time, currentTime: time }),
      consumeSeek: () => set({ seekRequest: null }),
      setCurrentTime: (t) => set({ currentTime: t }),
      setDuration: (d) => set({ duration: d }),
      setVolume: (v) =>
        set({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),

      toggleRepeat: () =>
        set((s) => ({
          repeat:
            s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
        })),

      toggleShuffle: () => {
        const { shuffle, queue, orderedQueue, currentIndex } = get()
        const cur = queue[currentIndex]
        if (!shuffle) {
          // turning on: shuffle keeping current track first
          if (!cur) {
            set({ shuffle: true })
            return
          }
          set({
            shuffle: true,
            queue: shuffled(queue, cur),
            currentIndex: 0,
          })
        } else {
          // turning off: restore ordered queue at current track
          if (!cur) {
            set({ shuffle: false })
            return
          }
          const idx = orderedQueue.findIndex((t) => t.id === cur.id)
          set({
            shuffle: false,
            queue: orderedQueue.length ? orderedQueue : queue,
            currentIndex: idx === -1 ? currentIndex : idx,
          })
        }
      },

      enqueue: (track) =>
        set((s) => ({
          queue: [...s.queue, track],
          orderedQueue: [...s.orderedQueue, track],
        })),

      removeFromQueue: (index) =>
        set((s) => {
          const queue = s.queue.filter((_, i) => i !== index)
          let currentIndex = s.currentIndex
          if (index < s.currentIndex) currentIndex -= 1
          else if (index === s.currentIndex)
            currentIndex = Math.min(currentIndex, queue.length - 1)
          return { queue, currentIndex }
        }),

      reorderQueue: (from, to) =>
        set((s) => {
          const queue = [...s.queue]
          const [moved] = queue.splice(from, 1)
          queue.splice(to, 0, moved)
          let currentIndex = s.currentIndex
          if (from === s.currentIndex) currentIndex = to
          else if (from < s.currentIndex && to >= s.currentIndex)
            currentIndex -= 1
          else if (from > s.currentIndex && to <= s.currentIndex)
            currentIndex += 1
          return { queue, currentIndex }
        }),

      clearQueue: () =>
        set({
          queue: [],
          orderedQueue: [],
          currentIndex: -1,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        }),
    }),
    {
      name: "nava-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        queue: s.queue,
        orderedQueue: s.orderedQueue,
        currentIndex: s.currentIndex,
        volume: s.volume,
        muted: s.muted,
        repeat: s.repeat,
        shuffle: s.shuffle,
      }),
      skipHydration: true,
    }
  )
)
