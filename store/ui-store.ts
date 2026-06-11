"use client"

import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  /** Mobile mini-player expanded to fullscreen now-playing. */
  playerExpanded: boolean
  queueOpen: boolean
  lyricsOpen: boolean
  setSidebar: (v: boolean) => void
  toggleSidebar: () => void
  setPlayerExpanded: (v: boolean) => void
  setQueueOpen: (v: boolean) => void
  setLyricsOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  playerExpanded: false,
  queueOpen: false,
  lyricsOpen: false,
  setSidebar: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPlayerExpanded: (v) => set({ playerExpanded: v }),
  setQueueOpen: (v) => set({ queueOpen: v, lyricsOpen: false }),
  setLyricsOpen: (v) => set({ lyricsOpen: v, queueOpen: false }),
}))
