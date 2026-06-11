"use client"

import { useMemo } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { Album, Artist } from "@/lib/types"

import * as accountingApi from "@/lib/api/accounting"
import * as artistsApi from "@/lib/api/artists"
import * as billingApi from "@/lib/api/billing"
import * as catalogApi from "@/lib/api/catalog"
import * as notificationsApi from "@/lib/api/notifications"
import * as playlistsApi from "@/lib/api/playlists"
import * as statsApi from "@/lib/api/stats"
import * as ticketsApi from "@/lib/api/tickets"
import * as usersApi from "@/lib/api/users"
import * as verificationsApi from "@/lib/api/verifications"
import { qk } from "@/lib/queries/keys"

// ---- Catalog --------------------------------------------------------------

export function useTracks() {
  return useQuery({ queryKey: qk.tracks, queryFn: catalogApi.listTracks })
}
export function useAlbums() {
  return useQuery({ queryKey: qk.albums, queryFn: catalogApi.listAlbums })
}
export function useTrack(id: string | undefined) {
  return useQuery({
    queryKey: qk.track(id ?? ""),
    queryFn: () => catalogApi.getTrack(id!),
    enabled: !!id,
  })
}
export function useTracksByIds(ids: string[]) {
  return useQuery({
    queryKey: ["tracks", "byIds", ids],
    queryFn: () => catalogApi.getTracksByIds(ids),
  })
}
export function useAlbum(id: string | undefined) {
  return useQuery({
    queryKey: qk.album(id ?? ""),
    queryFn: () => catalogApi.getAlbum(id!),
    enabled: !!id,
  })
}

/** id → Album map, for resolving album titles on track cards. */
export function useAlbumMap(): Record<string, Album> {
  const { data } = useAlbums()
  return useMemo(
    () => Object.fromEntries((data ?? []).map((a) => [a.id, a])),
    [data]
  )
}
export function useAlbumsByArtist(id: string | undefined) {
  return useQuery({
    queryKey: qk.artistAlbums(id ?? ""),
    queryFn: () => catalogApi.getAlbumsByArtist(id!),
    enabled: !!id,
  })
}
export function useTracksByArtist(id: string | undefined) {
  return useQuery({
    queryKey: qk.artistTracks(id ?? ""),
    queryFn: () => catalogApi.getTracksByArtist(id!),
    enabled: !!id,
  })
}

export function useStudioMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tracks"] })
    qc.invalidateQueries({ queryKey: ["albums"] })
    qc.invalidateQueries({ queryKey: ["artists"] })
    qc.invalidateQueries({ queryKey: ["browse"] })
  }
  return {
    publish: useMutation({
      mutationFn: (input: catalogApi.PublishInput) =>
        catalogApi.publishWork(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: {
        id: string
        patch: Partial<import("@/lib/types").Track>
      }) => catalogApi.updateTrack(v.id, v.patch),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => catalogApi.deleteTrack(id),
      onSuccess: invalidate,
    }),
  }
}

export function useBrowse(query: { q?: string; sort?: "listeners" | "date" }) {
  return useQuery({
    queryKey: qk.browse(query),
    queryFn: async () => {
      const artists = await artistsApi.listArtists()
      const artistNames = Object.fromEntries(artists.map((a) => [a.id, a.name]))
      return catalogApi.browse({ ...query, artistNames })
    },
  })
}

// ---- Artists --------------------------------------------------------------

export function useArtists() {
  return useQuery({ queryKey: qk.artists, queryFn: artistsApi.listArtists })
}
export function useArtist(id: string | undefined) {
  return useQuery({
    queryKey: qk.artist(id ?? ""),
    queryFn: () => artistsApi.getArtist(id!),
    enabled: !!id,
  })
}

/** id → Artist map, for resolving artist names on tracks/albums/cards. */
export function useArtistMap(): Record<string, Artist> {
  const { data } = useArtists()
  return useMemo(
    () => Object.fromEntries((data ?? []).map((a) => [a.id, a])),
    [data]
  )
}

// ---- Users / social -------------------------------------------------------

export function useUserByHandle(handle: string | undefined) {
  return useQuery({
    queryKey: qk.userByHandle(handle ?? ""),
    queryFn: () => usersApi.getUserByHandle(handle!),
    enabled: !!handle,
  })
}

export function useToggleFollowArtist(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (artistId: string) =>
      usersApi.toggleFollowArtist(userId!, artistId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artists"] })
      qc.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useToggleFollowUser(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetId: string) =>
      usersApi.toggleFollowUser(userId!, targetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<import("@/lib/types").User> }) =>
      usersApi.updateUser(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })
}

// ---- Playlists ------------------------------------------------------------

export function usePlaylists(ownerId: string | undefined) {
  return useQuery({
    queryKey: qk.playlists(ownerId ?? ""),
    queryFn: () => playlistsApi.listPlaylistsByOwner(ownerId!),
    enabled: !!ownerId,
  })
}
export function usePlaylist(id: string | undefined) {
  return useQuery({
    queryKey: qk.playlist(id ?? ""),
    queryFn: () => playlistsApi.getPlaylist(id!),
    enabled: !!id,
  })
}
export function usePlaylistMutations(ownerId: string | undefined) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["playlists"] })
  return {
    create: useMutation({
      mutationFn: (name: string) =>
        playlistsApi.createPlaylist(ownerId!, name),
      onSuccess: invalidate,
    }),
    rename: useMutation({
      mutationFn: (v: { id: string; name: string }) =>
        playlistsApi.renamePlaylist(v.id, v.name),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => playlistsApi.deletePlaylist(id),
      onSuccess: invalidate,
    }),
    addTrack: useMutation({
      mutationFn: (v: { playlistId: string; trackId: string }) =>
        playlistsApi.addTrackToPlaylist(v.playlistId, v.trackId),
      onSuccess: invalidate,
    }),
    removeTrack: useMutation({
      mutationFn: (v: { playlistId: string; trackId: string }) =>
        playlistsApi.removeTrackFromPlaylist(v.playlistId, v.trackId),
      onSuccess: invalidate,
    }),
  }
}

// ---- Notifications --------------------------------------------------------

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications(userId ?? ""),
    queryFn: () => notificationsApi.listNotifications(userId!),
    enabled: !!userId,
  })
}
export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: qk.unread(userId ?? ""),
    queryFn: () => notificationsApi.unreadCount(userId!),
    enabled: !!userId,
  })
}
export function useNotificationMutations(userId: string | undefined) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["notifications"] })
  return {
    markRead: useMutation({
      mutationFn: (id: string) => notificationsApi.markRead(id),
      onSuccess: invalidate,
    }),
    markAll: useMutation({
      mutationFn: () => notificationsApi.markAllRead(userId!),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => notificationsApi.deleteNotification(id),
      onSuccess: invalidate,
    }),
  }
}

// ---- Tickets --------------------------------------------------------------

export function useTickets() {
  return useQuery({ queryKey: qk.tickets, queryFn: ticketsApi.listTickets })
}
export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: qk.ticket(id ?? ""),
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
  })
}
export function useTicketMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tickets"] })
  return {
    reply: useMutation({
      mutationFn: (v: { id: string; body: string }) =>
        ticketsApi.replyToTicket(v.id, v.body),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: (v: { id: string; status: "open" | "answered" | "closed" }) =>
        ticketsApi.setTicketStatus(v.id, v.status),
      onSuccess: invalidate,
    }),
  }
}

// ---- Verifications --------------------------------------------------------

export function useVerifications() {
  return useQuery({
    queryKey: qk.verifications,
    queryFn: verificationsApi.listVerifications,
  })
}
export function useVerification(id: string | undefined) {
  return useQuery({
    queryKey: qk.verification(id ?? ""),
    queryFn: () => verificationsApi.getVerification(id!),
    enabled: !!id,
  })
}
export function useVerificationMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["verifications"] })
    qc.invalidateQueries({ queryKey: ["artists"] })
    qc.invalidateQueries({ queryKey: ["notifications"] })
  }
  return {
    approve: useMutation({
      mutationFn: (id: string) => verificationsApi.approveVerification(id),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: (v: { id: string; reason: string }) =>
        verificationsApi.rejectVerification(v.id, v.reason),
      onSuccess: invalidate,
    }),
  }
}

// ---- Accounting & billing -------------------------------------------------

export function useAccounting() {
  return useQuery({
    queryKey: qk.accounting,
    queryFn: accountingApi.listAccounting,
  })
}
export function useSettlePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountingApi.settlePayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounting"] }),
  })
}
export function usePrices() {
  return useQuery({ queryKey: qk.prices, queryFn: billingApi.getPrices })
}
export function useUpdatePrices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { silver: number; gold: number }) =>
      billingApi.updatePrices(v.silver, v.gold),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prices"] })
      qc.invalidateQueries({ queryKey: ["stats", "revenue"] })
    },
  })
}

// ---- Stats ----------------------------------------------------------------

export function useTodayStreamCount(userId: string | undefined) {
  return useQuery({
    queryKey: qk.todayStreams(userId ?? ""),
    queryFn: () => statsApi.todayStreamCount(userId!),
    enabled: !!userId,
  })
}
export function useRecents(userId: string | undefined) {
  return useQuery({
    queryKey: qk.recents(userId ?? ""),
    queryFn: () => statsApi.listRecents(userId!),
    enabled: !!userId,
  })
}
export function useUserDistribution() {
  return useQuery({
    queryKey: qk.distribution,
    queryFn: statsApi.userDistribution,
  })
}
export function useMonthlyRevenue(prices: { silver: number; gold: number } | undefined) {
  return useQuery({
    queryKey: [...qk.revenue, prices],
    queryFn: () => statsApi.monthlyRevenue(prices!),
    enabled: !!prices,
  })
}
