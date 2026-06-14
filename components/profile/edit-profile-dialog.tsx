"use client"

import * as React from "react"
import { ImagePlus, Lock } from "lucide-react"
import { toast } from "sonner"

import { CoverImage } from "@/components/common/cover-image"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JalaliDateInput } from "@/components/ui/jalali-date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateUser } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { tierConfig } from "@/lib/subscriptions"
import type { Gender } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const GENDERS: Gender[] = ["male", "female", "other"]

export function EditProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const updateUser = useUpdateUser()

  const [displayName, setDisplayName] = React.useState(user?.displayName ?? "")
  const [bio, setBio] = React.useState(user?.bio ?? "")
  const [birthday, setBirthday] = React.useState(user?.birthday ?? "")
  const [gender, setGender] = React.useState<Gender | undefined>(user?.gender)
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl ?? "")
  const fileRef = React.useRef<HTMLInputElement>(null)

  if (!user) return null
  const canUploadAvatar = tierConfig(user.tier).canUploadAvatar

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!canUploadAvatar) {
      toast.error(t("profile.avatarLockedBasic"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  function onSave() {
    updateUser.mutate(
      {
        id: user!.id,
        patch: {
          displayName,
          bio,
          birthday: birthday || undefined,
          gender,
          avatarUrl: avatarUrl || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          setUser(updated)
          toast.success(t("common.save"))
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <CoverImage
              seed={user.handle}
              src={avatarUrl || undefined}
              alt={displayName}
              className="size-20 shrink-0"
              rounded="rounded-full"
            />
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!canUploadAvatar}
                onClick={() => fileRef.current?.click()}
                className="gap-2"
              >
                {canUploadAvatar ? (
                  <ImagePlus className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
                {t("studio.cover")}
              </Button>
              {!canUploadAvatar && (
                <p className="max-w-xs text-xs text-muted-foreground">
                  {t("profile.avatarLockedBasic")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">{t("auth.username")}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">{t("profile.bio")}</Label>
            <Textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("auth.birthday")}</Label>
              <JalaliDateInput value={birthday} onChange={setBirthday} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("auth.gender")}</Label>
              <div className="flex h-9 items-center gap-1 rounded-md glass p-1">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 rounded-sm px-1 py-1 text-xs transition",
                      gender === g
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(`auth.gender.${g}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={updateUser.isPending}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
