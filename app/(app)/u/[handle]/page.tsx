"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Check, Pencil, Plus, UserRound } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { TierBadge } from "@/components/common/tier-badge"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import {
  useTodayStreamCount,
  useToggleFollowUser,
  useUserByHandle,
} from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

export default function UserProfilePage() {
  const t = useT()
  const { locale } = useI18n()
  const params = useParams<{ handle: string }>()
  const me = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [editOpen, setEditOpen] = React.useState(false)

  const { data: profile, isLoading } = useUserByHandle(params.handle)
  const isSelf = !!me && !!profile && me.id === profile.id
  const shown = isSelf ? me : profile

  const { data: dailyStreams = 0 } = useTodayStreamCount(shown?.id)
  const toggleFollow = useToggleFollowUser(me?.id)

  if (!isLoading && !profile) {
    return <EmptyState icon={UserRound} title={t("browse.empty")} className="mt-8" />
  }
  if (!shown) return null

  const following = me?.followingUserIds.includes(shown.id) ?? false

  function onFollow() {
    if (!me || !shown) return
    toggleFollow.mutate(shown.id, { onSuccess: (updated) => setUser(updated) })
  }

  const stats: Array<{ label: string; value: number }> = [
    { label: t("profile.followers"), value: shown.followerCount },
    {
      label: t("profile.followingCount"),
      value: shown.followingArtistIds.length + shown.followingUserIds.length,
    },
    { label: t("profile.dailyStreams"), value: dailyStreams },
  ]

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-start">
        <CoverImage
          seed={shown.handle}
          src={shown.avatarUrl || undefined}
          alt={shown.displayName}
          className="size-36 shrink-0 shadow-2xl shadow-primary/20"
          rounded="rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-3xl font-extrabold md:text-4xl">
              {shown.displayName}
            </h1>
            <TierBadge tier={shown.tier} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {shown.handle}
          </p>

          {isSelf ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              <Pencil className="size-4" />
              {t("profile.editProfile")}
            </button>
          ) : (
            me && (
              <button
                type="button"
                onClick={onFollow}
                disabled={toggleFollow.isPending}
                className={cn(
                  "mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition",
                  following
                    ? "glass text-foreground hover:bg-white/10"
                    : "bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40 hover:scale-105"
                )}
              >
                {following ? (
                  <>
                    <Check className="size-4" />
                    {t("common.following")}
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    {t("common.follow")}
                  </>
                )}
              </button>
            )
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl glass px-4 py-3 text-center">
            <p className="font-display text-2xl font-bold">
              {formatNumber(s.value, locale)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {shown.bio && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">{t("profile.bio")}</h2>
          <p className="rounded-3xl glass p-5 text-sm leading-7 text-muted-foreground">
            {shown.bio}
          </p>
        </section>
      )}

      {isSelf && (
        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  )
}
