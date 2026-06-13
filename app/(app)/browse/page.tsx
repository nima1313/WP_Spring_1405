"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { AlbumCard } from "@/components/music/album-card"
import { EmptyState } from "@/components/common/empty-state"
import { Section } from "@/components/music/section"
import { TrackCard } from "@/components/music/track-card"
import { useBrowse } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Sort = "listeners" | "date"

export default function BrowsePage() {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()
  const qParam = params.get("q") ?? ""

  const [q, setQ] = React.useState(qParam)
  const [prevQParam, setPrevQParam] = React.useState(qParam)
  const [sort, setSort] = React.useState<Sort>("date")

  // Keep the input in sync when arriving via the topbar search (render-phase
  // derived state — the recommended alternative to a syncing effect).
  if (qParam !== prevQParam) {
    setPrevQParam(qParam)
    setQ(qParam)
  }

  const { data, isLoading } = useBrowse({ q, sort })
  const albums = data?.albums ?? []
  const singles = data?.singles ?? []
  const empty = !isLoading && albums.length === 0 && singles.length === 0

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    router.replace(`/browse${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
  }

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">
          {t("browse.title")}
        </h1>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={onSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("browse.searchPlaceholder")}
              className="h-11 w-full rounded-2xl glass ps-10 pe-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </form>

          <div className="flex items-center gap-1 rounded-2xl glass p-1">
            <span className="px-2 text-xs text-muted-foreground">
              {t("browse.sort")}:
            </span>
            {(["date", "listeners"] as Sort[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                  sort === s
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`browse.sort.${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {empty ? (
        <EmptyState icon={Search} title={t("browse.empty")} />
      ) : (
        <>
          {albums.length > 0 && (
            <Section title={t("browse.albums")} scroll={false}>
              <div className="flex flex-wrap gap-3">
                {albums.map((al) => (
                  <AlbumCard key={al.id} album={al} />
                ))}
              </div>
            </Section>
          )}
          {singles.length > 0 && (
            <Section title={t("browse.singles")} scroll={false}>
              <div className="flex flex-wrap gap-3">
                {singles.map((tr) => (
                  <TrackCard key={tr.id} track={tr} context={singles} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
