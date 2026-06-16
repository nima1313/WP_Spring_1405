import { beforeEach, describe, expect, it } from "vitest"

import type { Track } from "@/lib/types"
import { usePlayerStore } from "@/store/player-store"

function track(id: string): Track {
  return {
    id,
    title: id,
    artistId: "ar",
    featuredArtistIds: [],
    coverUrl: "",
    audioUrl: `/audio/${id}.mp3`,
    duration: 200,
    genre: "pop",
    releaseDate: "2024-01-01",
    type: "single",
    listeners: 0,
    streams: 0,
    earlyAccess: false,
  }
}

const tracks = [track("a"), track("b"), track("c")]

beforeEach(() => {
  usePlayerStore.setState({
    queue: [],
    orderedQueue: [],
    currentIndex: -1,
    isPlaying: false,
    repeat: "off",
    shuffle: false,
    currentTime: 0,
  })
})

describe("player store", () => {
  it("plays a track within its context queue", () => {
    usePlayerStore.getState().playTrack(tracks[1], tracks)
    const s = usePlayerStore.getState()
    expect(s.current()?.id).toBe("b")
    expect(s.queue).toHaveLength(3)
    expect(s.isPlaying).toBe(true)
  })

  it("advances to the next track", () => {
    usePlayerStore.getState().playQueue(tracks, 0)
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().current()?.id).toBe("b")
  })

  it("stops at the end when repeat is off (auto)", () => {
    usePlayerStore.getState().playQueue(tracks, 2)
    usePlayerStore.getState().next(true)
    expect(usePlayerStore.getState().isPlaying).toBe(false)
  })

  it("wraps to the start when repeat is 'all'", () => {
    usePlayerStore.getState().playQueue(tracks, 2)
    usePlayerStore.getState().toggleRepeat() // off -> all
    expect(usePlayerStore.getState().repeat).toBe("all")
    usePlayerStore.getState().next(true)
    expect(usePlayerStore.getState().current()?.id).toBe("a")
  })

  it("cycles repeat modes off -> all -> one -> off", () => {
    const { toggleRepeat } = usePlayerStore.getState()
    toggleRepeat()
    expect(usePlayerStore.getState().repeat).toBe("all")
    toggleRepeat()
    expect(usePlayerStore.getState().repeat).toBe("one")
    toggleRepeat()
    expect(usePlayerStore.getState().repeat).toBe("off")
  })

  it("prev restarts the track when past 3s", () => {
    usePlayerStore.getState().playQueue(tracks, 1)
    usePlayerStore.setState({ currentTime: 10 })
    usePlayerStore.getState().prev()
    expect(usePlayerStore.getState().current()?.id).toBe("b")
    expect(usePlayerStore.getState().currentTime).toBe(0)
  })

  it("enqueues and removes from the queue", () => {
    usePlayerStore.getState().playQueue([tracks[0]], 0)
    usePlayerStore.getState().enqueue(tracks[1])
    expect(usePlayerStore.getState().queue).toHaveLength(2)
    usePlayerStore.getState().removeFromQueue(1)
    expect(usePlayerStore.getState().queue).toHaveLength(1)
  })

  it("keeps the current track first when shuffle turns on", () => {
    usePlayerStore.getState().playQueue(tracks, 1)
    usePlayerStore.getState().toggleShuffle()
    const s = usePlayerStore.getState()
    expect(s.shuffle).toBe(true)
    expect(s.queue[s.currentIndex]?.id).toBe("b")
  })
})
