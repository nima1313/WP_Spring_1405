"use client"

import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  LogOut,
  Mic2,
  Settings,
  User as UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/api/users"
import { canAccessDashboard, canAccessStudio } from "@/lib/auth/permissions"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/store/auth-store"

export function UserMenu() {
  const t = useT()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)

  if (!user) return null

  const initials = user.displayName.slice(0, 2)

  function onLogout() {
    logout()
    clear()
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("nav.profile")}
            className="rounded-full ring-2 ring-white/10 transition hover:ring-primary/50"
          />
        }
      >
        <Avatar className="size-9">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{user.displayName}</span>
              <span className="text-xs text-muted-foreground">
                {user.handle}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/u/${user.handle}`)}>
          <UserIcon className="size-4" />
          {t("nav.profile")}
        </DropdownMenuItem>
        {canAccessStudio(user.role) && (
          <DropdownMenuItem onClick={() => router.push("/studio")}>
            <Mic2 className="size-4" />
            {t("nav.studio")}
          </DropdownMenuItem>
        )}
        {canAccessDashboard(user.role) && (
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="size-4" />
            {t("nav.dashboard")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="size-4" />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
