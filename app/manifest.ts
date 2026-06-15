import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نوا | Nava",
    short_name: "Nava",
    description: "سرویس استریم موسیقی نوا",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0712",
    theme_color: "#0B0712",
    dir: "rtl",
    lang: "fa",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
