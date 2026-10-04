import { renderAppIcon } from "@/lib/app-icon";

// Статическая сборка: иконки рисуются один раз при next build и ложатся файлами /pwa-icon/192.png и /pwa-icon/512.png.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192.png" }, { size: "512.png" }];
}

export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await params;
  return renderAppIcon(size.startsWith("192") ? 192 : 512);
}
