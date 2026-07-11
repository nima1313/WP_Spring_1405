import withSerwistInit from "@serwist/next"

// The Django backend. Locally it is http://localhost:8321; inside Docker the
// compose network resolves it as http://backend:8321 (set via API_ORIGIN).
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8321"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 2: everything is proxied so the browser only ever talks to a
  // same-origin /api (auth cookies + CSRF just work) and /media (uploaded audio,
  // covers and avatars served by Django).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${API_ORIGIN}/media/:path*`,
      },
    ]
  },
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

export default withSerwist(nextConfig)
