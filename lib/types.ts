// ---------------------------------------------------------------------------
// Domain types — shared across the LocalStorage repositories (phase 1) and the
// future Django/ky repositories (phase 2). Repository signatures are written
// against these types so swapping the data source never touches components.
// ---------------------------------------------------------------------------

export type Role = "listener" | "artist" | "support" | "admin"

export type Tier = "basic" | "silver" | "gold"

export type Gender = "male" | "female" | "other"

export type VerificationStatus = "pending" | "approved" | "rejected"

export type TicketStatus = "open" | "answered" | "closed"

export type PaymentStatus = "pending" | "settled"

export type ReleaseType = "single" | "album"

export interface User {
  id: string
  /** System-assigned handle shown on the profile, e.g. "@nava_4f2a" (§3.2). */
  handle: string
  /** Username chosen at sign-up (§1.2). */
  displayName: string
  email: string
  role: Role
  tier: Tier
  /** ISO date — drives the §6.2 subscription-expiry notification. */
  subscriptionExpiresAt: string
  avatarUrl?: string
  /** Gregorian ISO birthday (stored gregorian, shown Jalali). */
  birthday?: string
  gender?: Gender
  bio?: string
  followingUserIds: string[]
  followingArtistIds: string[]
  followerCount: number
  /** Linked artist profile when role === "artist". */
  artistId?: string
  createdAt: string
}

export interface Artist {
  id: string
  /** Stage name — نام هنری. */
  name: string
  /** Professional unique id shown in accounting — شناسه تخصصی. */
  proId: string
  bio: string
  avatarUrl?: string
  verified: boolean
  status: VerificationStatus
  rejectionReason?: string
  /** Free-text / links to sample works submitted at sign-up. */
  sampleWorks: string
  email: string
  /** Owning user account. */
  userId?: string
  followerCount: number
  monthlyListeners: number
  createdAt: string
}

export interface Album {
  id: string
  title: string
  artistId: string
  coverUrl: string
  releaseDate: string
  genre: string
  trackIds: string[]
}

export interface Track {
  id: string
  title: string
  artistId: string
  /** Featured / collaborating artists — نام هنرمندان همکار. */
  featuredArtistIds: string[]
  albumId?: string
  coverUrl: string
  audioUrl: string
  /** Seconds. */
  duration: number
  lyrics?: string
  genre: string
  releaseDate: string
  type: ReleaseType
  /** Unique listeners + total streams (gold-only display in the player). */
  listeners: number
  streams: number
  /** New release reserved for early-access tiers. */
  earlyAccess: boolean
}

export interface Playlist {
  id: string
  name: string
  ownerId: string
  trackIds: string[]
  coverUrl?: string
  createdAt: string
  updatedAt: string
}

export type NotificationKind =
  | "subscription_expiry"
  | "new_follower"
  | "new_release"
  | "verification_result"
  | "monthly_finance"
  | "new_ticket"
  | "verification_request"

export interface AppNotification {
  id: string
  userId: string
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  createdAt: string
  /** Deep link to the related work / page (§6.2). */
  href?: string
}

export interface TicketMessage {
  id: string
  authorRole: "user" | "support"
  body: string
  createdAt: string
}

export interface Ticket {
  id: string
  userId: string
  userName: string
  subject: string
  status: TicketStatus
  createdAt: string
  messages: TicketMessage[]
}

export interface Verification {
  id: string
  artistId: string
  artistName: string
  email: string
  sampleWorks: string
  status: VerificationStatus
  reason?: string
  createdAt: string
}

export interface AccountingRow {
  id: string
  artistId: string
  artistName: string
  artistProId: string
  /** YYYY-MM. */
  month: string
  uniqueListeners: number
  streams: number
  /** Reward amount — assigned by the real formula in phase 2. */
  reward: number
  status: PaymentStatus
}

export interface Prices {
  silver: number
  gold: number
  currency: string
  updatedAt: string
}

/** One play event, used to enforce the basic-tier 60/day stream cap (§9.2). */
export interface StreamEvent {
  id: string
  userId: string
  trackId: string
  at: string
}

export interface RecentItem {
  userId: string
  kind: "track" | "playlist"
  refId: string
  at: string
}
