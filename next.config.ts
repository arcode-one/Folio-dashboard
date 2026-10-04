import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Уже открытая вкладка 30 секунд берётся из памяти браузера — повторный переход мгновенный.
    // Правки через сайт сбрасывают этот кэш сразу (revalidatePath), через бота — видны после обновления.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
