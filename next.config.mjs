import withSerwistInit from "@serwist/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 2: the Django backend lives at localhost:8321 and is proxied here so
  // the frontend always talks to a same-origin /api. Harmless in phase 1 (the
  // LocalStorage repositories never hit the network).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8321/api/:path*",
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
