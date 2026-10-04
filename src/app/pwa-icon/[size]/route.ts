import { renderAppIcon } from "@/lib/app-icon";

export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await params;
  return renderAppIcon(size === "192" ? 192 : 512);
}
