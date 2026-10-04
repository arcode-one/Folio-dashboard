import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/env";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Работа, доходы и расходы",
    start_url: "/",
    display: "standalone",
    background_color: "#15191e",
    theme_color: "#15191e",
    lang: "ru",
    icons: [
      { src: "/pwa-icon/192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
