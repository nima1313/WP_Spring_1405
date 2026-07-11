// Demo login chips shown on the login page. The accounts themselves live in the
// backend seed (accounts/management/commands/seed.py); this is just the list the
// UI offers for one-tap sign-in during review.

export const DEMO_PASSWORD = "nava1234"

export const DEMO_ACCOUNTS = [
  { email: "listener@nava.app", role: "شنونده (طلایی)" },
  { email: "silver@nava.app", role: "شنونده (نقره‌ای)" },
  { email: "basic@nava.app", role: "شنونده (پایه)" },
  { email: "artist@nava.app", role: "هنرمند" },
  { email: "support@nava.app", role: "پشتیبان" },
  { email: "admin@nava.app", role: "مدیر سامانه" },
]
