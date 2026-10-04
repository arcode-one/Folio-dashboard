import type { Metadata, Viewport } from "next";
import { Manrope, Onest } from "next/font/google";
import { APP_NAME } from "@/lib/env";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s — ${APP_NAME}` },
  description: "Демо дашборда для фрилансеров 10 профессий: работа, доходы, расходы и заметки",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black" },
};

// maximumScale не даёт iOS самому увеличивать страницу при вводе в поле (пальцами масштабировать всё равно можно).
export const viewport: Viewport = { viewportFit: "cover", maximumScale: 1, themeColor: "#15191e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${manrope.variable} antialiased`}>
      <head>
        <link rel="preload" as="image" href="/bg-blur.webp" media="(max-width: 1023px)" />
        <link rel="preload" as="image" href="/bg.webp" media="(min-width: 1024px)" />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
