import { KEYS, read, write, writeList } from "@/lib/db/storage"
import type {
  AccountingRow,
  Album,
  AppNotification,
  Artist,
  Playlist,
  Prices,
  RecentItem,
  StreamEvent,
  Ticket,
  Track,
  User,
  Verification,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// One-time idempotent seed. Runs on first app load (SeedBootstrap) and writes a
// coherent demo dataset to LocalStorage. Bump SEED_VERSION to force a reseed.
// ---------------------------------------------------------------------------

const SEED_VERSION = 3
const AUDIO = (n: number) => `/audio/song-${((n - 1) % 8) + 1}.mp3`
const DEMO_PASSWORD = "nava1234"

function iso(daysAgo: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function monthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// ---- Artists --------------------------------------------------------------

const artists: Artist[] = [
  {
    id: "ar_navid",
    name: "نوید زند",
    proId: "NAV-0012",
    bio: "آهنگساز و خواننده پاپ الکترونیک، ساکن تهران. ترکیبی از ملودی‌های شرقی و سینث‌های مدرن.",
    verified: true,
    status: "approved",
    sampleWorks: "https://example.com/navid/demo",
    email: "navid@nava.app",
    userId: "u_artist",
    followerCount: 18420,
    monthlyListeners: 90240,
    createdAt: iso(320),
  },
  {
    id: "ar_mahtab",
    name: "مهتاب",
    proId: "MAH-0048",
    bio: "صدای آرام شب‌های شهر. سبک: پاپ ملو و آکوستیک.",
    verified: true,
    status: "approved",
    sampleWorks: "https://example.com/mahtab",
    email: "mahtab@nava.app",
    followerCount: 24310,
    monthlyListeners: 132900,
    createdAt: iso(410),
  },
  {
    id: "ar_kian",
    name: "کیان",
    proId: "KIA-0103",
    bio: "تهیه‌کننده هیپ‌هاپ و بیت‌میکر.",
    verified: true,
    status: "approved",
    sampleWorks: "https://example.com/kian",
    email: "kian@nava.app",
    followerCount: 9870,
    monthlyListeners: 51200,
    createdAt: iso(220),
  },
  {
    id: "ar_raha",
    name: "گروه رها",
    proId: "RAH-0211",
    bio: "گروه راک آلترناتیو با سه عضو.",
    verified: true,
    status: "approved",
    sampleWorks: "https://example.com/raha",
    email: "raha@nava.app",
    followerCount: 15600,
    monthlyListeners: 73400,
    createdAt: iso(180),
  },
  {
    id: "ar_golnoosh",
    name: "گلنوش",
    proId: "GOL-0307",
    bio: "نوازنده و آهنگساز موسیقی سنتی-تلفیقی.",
    verified: false,
    status: "pending",
    sampleWorks: "https://example.com/golnoosh/portfolio",
    email: "golnoosh@nava.app",
    followerCount: 0,
    monthlyListeners: 0,
    createdAt: iso(4),
  },
  {
    id: "ar_artin",
    name: "آرتین",
    proId: "ART-0319",
    bio: "تولیدکننده موسیقی الکترونیک و امبینت.",
    verified: false,
    status: "pending",
    sampleWorks: "https://example.com/artin/soundcloud",
    email: "artin@nava.app",
    followerCount: 0,
    monthlyListeners: 0,
    createdAt: iso(2),
  },
]

// ---- Albums & tracks ------------------------------------------------------

interface AlbumSpec {
  id: string
  title: string
  artistId: string
  genre: string
  daysAgo: number
  tracks: string[]
}

const albumSpecs: AlbumSpec[] = [
  {
    id: "al_navid_neon",
    title: "نئون",
    artistId: "ar_navid",
    genre: "الکترونیک",
    daysAgo: 30,
    tracks: ["شب‌تاب", "مدار", "بی‌وزن", "هزارتو", "طلوع سرد"],
  },
  {
    id: "al_navid_echo",
    title: "پژواک",
    artistId: "ar_navid",
    genre: "پاپ",
    daysAgo: 3,
    tracks: ["انعکاس", "نیمه شب", "دور"],
  },
  {
    id: "al_mahtab_calm",
    title: "آرام",
    artistId: "ar_mahtab",
    genre: "آکوستیک",
    daysAgo: 70,
    tracks: ["باران", "خاطره", "ساحل", "چتر"],
  },
  {
    id: "al_mahtab_night",
    title: "شب‌های شهر",
    artistId: "ar_mahtab",
    genre: "پاپ",
    daysAgo: 1,
    tracks: ["چراغ‌ها", "خیابان خالی", "صبح"],
  },
  {
    id: "al_kian_bars",
    title: "بیت‌ها",
    artistId: "ar_kian",
    genre: "هیپ‌هاپ",
    daysAgo: 50,
    tracks: ["شروع", "جریان", "بالا", "آخر خط"],
  },
  {
    id: "al_raha_loud",
    title: "بلند",
    artistId: "ar_raha",
    genre: "راک",
    daysAgo: 90,
    tracks: ["فریاد", "دیوار", "آتش", "سکوت"],
  },
]

const LYRICS_SAMPLE = `زیر نور چراغ‌های شهر
قدم می‌زنم تا صبح
صدای تو در گوشم می‌پیچد
مثل آهنگی که تمام نمی‌شود

کجا رفتی؟ کجا ماندم؟
میان این همه هیاهو
تنها صدای توست
که مرا به خانه می‌رساند`

const albums: Album[] = []
const tracks: Track[] = []
let trackCounter = 0

for (const spec of albumSpecs) {
  const trackIds: string[] = []
  spec.tracks.forEach((title, idx) => {
    trackCounter += 1
    const id = `tr_${spec.id}_${idx}`
    trackIds.push(id)
    tracks.push({
      id,
      title,
      artistId: spec.artistId,
      featuredArtistIds: idx === 1 ? ["ar_kian"] : [],
      albumId: spec.id,
      coverUrl: "",
      audioUrl: AUDIO(trackCounter),
      duration: 180 + ((trackCounter * 23) % 110),
      lyrics: idx % 2 === 0 ? LYRICS_SAMPLE : undefined,
      genre: spec.genre,
      releaseDate: iso(spec.daysAgo),
      type: "album",
      listeners: 1200 + ((trackCounter * 877) % 60000),
      streams: 5400 + ((trackCounter * 3137) % 240000),
      earlyAccess: spec.daysAgo <= 4,
    })
  })
  albums.push({
    id: spec.id,
    title: spec.title,
    artistId: spec.artistId,
    coverUrl: "",
    releaseDate: iso(spec.daysAgo),
    genre: spec.genre,
    trackIds,
  })
}

// Standalone singles (no album)
const singleSpecs: Array<{
  title: string
  artistId: string
  genre: string
  daysAgo: number
}> = [
  { title: "تنها", artistId: "ar_kian", genre: "هیپ‌هاپ", daysAgo: 6 },
  { title: "پرواز", artistId: "ar_raha", genre: "راک", daysAgo: 2 },
  { title: "نسیم", artistId: "ar_mahtab", genre: "آکوستیک", daysAgo: 12 },
  { title: "ستاره", artistId: "ar_navid", genre: "الکترونیک", daysAgo: 1 },
]

for (const s of singleSpecs) {
  trackCounter += 1
  tracks.push({
    id: `tr_single_${trackCounter}`,
    title: s.title,
    artistId: s.artistId,
    featuredArtistIds: [],
    coverUrl: "",
    audioUrl: AUDIO(trackCounter),
    duration: 175 + ((trackCounter * 31) % 90),
    lyrics: trackCounter % 2 === 0 ? LYRICS_SAMPLE : undefined,
    genre: s.genre,
    releaseDate: iso(s.daysAgo),
    type: "single",
    listeners: 800 + ((trackCounter * 613) % 40000),
    streams: 3200 + ((trackCounter * 2111) % 120000),
    earlyAccess: s.daysAgo <= 4,
  })
}

// ---- Users (demo accounts, one per role + per tier) -----------------------

const users: User[] = [
  {
    id: "u_listener",
    handle: "@nava_a3f1",
    displayName: "آرش رضایی",
    email: "listener@nava.app",
    role: "listener",
    tier: "gold",
    subscriptionExpiresAt: iso(-20),
    birthday: "1998-05-14",
    gender: "male",
    followingUserIds: [],
    followingArtistIds: ["ar_navid", "ar_mahtab"],
    followerCount: 42,
    createdAt: iso(120),
  },
  {
    id: "u_silver",
    handle: "@nava_b7c2",
    displayName: "نگار کریمی",
    email: "silver@nava.app",
    role: "listener",
    tier: "silver",
    subscriptionExpiresAt: iso(-5),
    birthday: "2000-11-02",
    gender: "female",
    followingUserIds: ["u_listener"],
    followingArtistIds: ["ar_kian"],
    followerCount: 8,
    createdAt: iso(90),
  },
  {
    id: "u_basic",
    handle: "@nava_c9d3",
    displayName: "سینا مرادی",
    email: "basic@nava.app",
    role: "listener",
    tier: "basic",
    subscriptionExpiresAt: iso(-2),
    birthday: "2003-02-20",
    gender: "male",
    followingUserIds: [],
    followingArtistIds: ["ar_raha"],
    followerCount: 3,
    createdAt: iso(40),
  },
  {
    id: "u_artist",
    handle: "@nava_navid",
    displayName: "نوید زند",
    email: "artist@nava.app",
    role: "artist",
    tier: "gold",
    subscriptionExpiresAt: iso(-200),
    gender: "male",
    followingUserIds: [],
    followingArtistIds: [],
    followerCount: 18420,
    artistId: "ar_navid",
    createdAt: iso(320),
  },
  {
    id: "u_support",
    handle: "@nava_sup",
    displayName: "تیم پشتیبانی",
    email: "support@nava.app",
    role: "support",
    tier: "gold",
    subscriptionExpiresAt: iso(-365),
    followingUserIds: [],
    followingArtistIds: [],
    followerCount: 0,
    createdAt: iso(500),
  },
  {
    id: "u_admin",
    handle: "@nava_admin",
    displayName: "مدیر سامانه",
    email: "admin@nava.app",
    role: "admin",
    tier: "gold",
    subscriptionExpiresAt: iso(-365),
    followingUserIds: [],
    followingArtistIds: [],
    followerCount: 0,
    createdAt: iso(500),
  },
]

const credentials: Record<string, string> = Object.fromEntries(
  users.map((u) => [u.email, DEMO_PASSWORD])
)

// ---- Playlists ------------------------------------------------------------

const playlists: Playlist[] = [
  {
    id: "pl_chill",
    name: "آرامش شبانه",
    ownerId: "u_listener",
    trackIds: [tracks[0].id, tracks[8].id, tracks[9].id],
    createdAt: iso(30),
    updatedAt: iso(2),
  },
  {
    id: "pl_workout",
    name: "انرژی صبحگاهی",
    ownerId: "u_listener",
    trackIds: [tracks[13].id, tracks[5].id],
    createdAt: iso(15),
    updatedAt: iso(1),
  },
]

// ---- Notifications (role-specific) ----------------------------------------

const notifications: AppNotification[] = [
  {
    id: "nt_1",
    userId: "u_listener",
    kind: "new_release",
    title: "اثر جدید از نوید زند",
    body: "آلبوم «پژواک» منتشر شد.",
    read: false,
    createdAt: iso(0, 9),
    href: "/album/al_navid_echo",
  },
  {
    id: "nt_2",
    userId: "u_listener",
    kind: "new_follower",
    title: "دنبال‌کننده جدید",
    body: "نگار کریمی شما را دنبال کرد.",
    read: false,
    createdAt: iso(1, 18),
    href: "/u/@nava_b7c2",
  },
  {
    id: "nt_3",
    userId: "u_basic",
    kind: "subscription_expiry",
    title: "اشتراک شما رو به اتمام است",
    body: "اعتبار اشتراک پایه شما به‌زودی تمام می‌شود.",
    read: false,
    createdAt: iso(0, 8),
    href: "/settings",
  },
  {
    id: "nt_4",
    userId: "u_artist",
    kind: "verification_result",
    title: "حساب هنرمندی شما تأیید شد",
    body: "اکنون می‌توانید آثار خود را منتشر کنید.",
    read: true,
    createdAt: iso(300, 10),
  },
  {
    id: "nt_5",
    userId: "u_artist",
    kind: "monthly_finance",
    title: "محاسبات مالی ماه گذشته",
    body: "گزارش درآمد و پاداش ماهانه شما آماده است.",
    read: false,
    createdAt: iso(0, 7),
    href: "/studio",
  },
  {
    id: "nt_6",
    userId: "u_support",
    kind: "verification_request",
    title: "درخواست احراز هویت جدید",
    body: "گلنوش درخواست تأیید حساب هنرمندی ثبت کرد.",
    read: false,
    createdAt: iso(4, 11),
    href: "/dashboard/verifications",
  },
  {
    id: "nt_7",
    userId: "u_support",
    kind: "new_ticket",
    title: "تیکت جدید",
    body: "کاربری درباره دانلود آهنگ سؤال پرسیده است.",
    read: false,
    createdAt: iso(1, 14),
    href: "/dashboard/tickets",
  },
]

// ---- Tickets --------------------------------------------------------------

const tickets: Ticket[] = [
  {
    id: "tk_1001",
    userId: "u_silver",
    userName: "نگار کریمی",
    subject: "امکان دانلود آهنگ‌ها",
    status: "open",
    createdAt: iso(1, 14),
    messages: [
      {
        id: "m1",
        authorRole: "user",
        body: "سلام، چطور می‌تونم آهنگ‌ها رو دانلود کنم؟",
        createdAt: iso(1, 14),
      },
    ],
  },
  {
    id: "tk_1002",
    userId: "u_basic",
    userName: "سینا مرادی",
    subject: "محدودیت تعداد استریم",
    status: "answered",
    createdAt: iso(3, 10),
    messages: [
      {
        id: "m1",
        authorRole: "user",
        body: "چرا بعد از مدتی نمی‌تونم آهنگ پخش کنم؟",
        createdAt: iso(3, 10),
      },
      {
        id: "m2",
        authorRole: "support",
        body: "اشتراک پایه محدودیت ۶۰ استریم در روز دارد. با ارتقا به نقره‌ای نامحدود می‌شود.",
        createdAt: iso(3, 12),
      },
    ],
  },
  {
    id: "tk_1003",
    userId: "u_listener",
    userName: "آرش رضایی",
    subject: "تغییر ایمیل حساب",
    status: "closed",
    createdAt: iso(8, 9),
    messages: [
      {
        id: "m1",
        authorRole: "user",
        body: "می‌خوام ایمیلم رو عوض کنم.",
        createdAt: iso(8, 9),
      },
      {
        id: "m2",
        authorRole: "support",
        body: "انجام شد، لطفاً خروج و ورود مجدد کنید.",
        createdAt: iso(8, 10),
      },
    ],
  },
]

// ---- Verifications --------------------------------------------------------

const verifications: Verification[] = [
  {
    id: "vf_1",
    artistId: "ar_golnoosh",
    artistName: "گلنوش",
    email: "golnoosh@nava.app",
    sampleWorks: "https://example.com/golnoosh/portfolio",
    status: "pending",
    createdAt: iso(4),
  },
  {
    id: "vf_2",
    artistId: "ar_artin",
    artistName: "آرتین",
    email: "artin@nava.app",
    sampleWorks: "https://example.com/artin/soundcloud",
    status: "pending",
    createdAt: iso(2),
  },
]

// ---- Accounting (current month) -------------------------------------------

const accounting: AccountingRow[] = artists
  .filter((a) => a.status === "approved")
  .map((a, i) => ({
    id: `ac_${a.id}`,
    artistId: a.id,
    artistName: a.name,
    artistProId: a.proId,
    month: monthKey(),
    uniqueListeners: a.monthlyListeners,
    streams: a.monthlyListeners * 4 + i * 1200,
    reward: Math.round((a.monthlyListeners * 4 + i * 1200) * 1.5),
    status: i % 2 === 0 ? "pending" : "settled",
  }))

// ---- Prices ---------------------------------------------------------------

const prices: Prices = {
  silver: 79000,
  gold: 149000,
  currency: "تومان",
  updatedAt: iso(10),
}

// ---- Recents & stream events ---------------------------------------------

const recents: RecentItem[] = [
  { userId: "u_listener", kind: "playlist", refId: "pl_chill", at: iso(0, 20) },
  { userId: "u_listener", kind: "track", refId: tracks[8].id, at: iso(0, 19) },
  { userId: "u_listener", kind: "track", refId: tracks[2].id, at: iso(1, 22) },
  {
    userId: "u_listener",
    kind: "playlist",
    refId: "pl_workout",
    at: iso(1, 7),
  },
]

// Basic user already near the daily cap, to demo the §9.2 limit gate.
const streams: StreamEvent[] = Array.from({ length: 57 }).map((_, i) => ({
  id: `st_${i}`,
  userId: "u_basic",
  trackId: tracks[i % tracks.length].id,
  at: new Date(new Date().setHours(8 + (i % 12), i % 60, 0, 0)).toISOString(),
}))

// ---------------------------------------------------------------------------

export function ensureSeeded(): void {
  if (typeof window === "undefined") return
  const seeded = read<number>(KEYS.seeded, 0)
  if (seeded >= SEED_VERSION) return

  writeList(KEYS.artists, artists)
  writeList(KEYS.albums, albums)
  writeList(KEYS.tracks, tracks)
  writeList(KEYS.users, users)
  writeList(KEYS.playlists, playlists)
  writeList(KEYS.notifications, notifications)
  writeList(KEYS.tickets, tickets)
  writeList(KEYS.verifications, verifications)
  writeList(KEYS.accounting, accounting)
  writeList(KEYS.recents, recents)
  writeList(KEYS.streams, streams)
  write(KEYS.prices, prices)
  write(KEYS.credentials, credentials)
  write(KEYS.seeded, SEED_VERSION)
}

export const DEMO_ACCOUNTS = [
  { email: "listener@nava.app", role: "شنونده (طلایی)" },
  { email: "silver@nava.app", role: "شنونده (نقره‌ای)" },
  { email: "basic@nava.app", role: "شنونده (پایه)" },
  { email: "artist@nava.app", role: "هنرمند" },
  { email: "support@nava.app", role: "پشتیبان" },
  { email: "admin@nava.app", role: "مدیر سامانه" },
]
export { DEMO_PASSWORD }
