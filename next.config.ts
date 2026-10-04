import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Весь сайт работает в браузере, поэтому собирается в статику (папка out) — её публикует GitHub Pages.
  output: "export",
  // /income → /income/index.html: так GitHub Pages открывает страницы по прямой ссылке.
  trailingSlash: true,
};

export default nextConfig;
