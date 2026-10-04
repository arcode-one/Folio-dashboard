"use client";

import type { ComponentType } from "react";
import { useAppData, type AppData } from "@/lib/data";
import { Page } from "./AppShell";

/** Заглушка, пока данные не прочитаны из браузера (сервер и первая отрисовка). */
export function PageSkeleton() {
  const block = "animate-pulse rounded-3xl bg-white/[0.07]";
  return (
    <Page>
      <div aria-busy="true" aria-label="Загрузка">
        <div className="h-9 w-44 animate-pulse rounded-full bg-white/[0.07]" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded-full bg-white/[0.05]" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-[104px]`} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
          <div className={`${block} h-[300px] lg:col-span-8`} />
          <div className={`${block} h-[300px] lg:col-span-4`} />
        </div>
      </div>
    </Page>
  );
}

/** Подставляет в экран данные из хранилища браузера; страницам на сервере их передавать не нужно. */
export function withAppData<P extends { data: AppData }>(View: ComponentType<P>) {
  function WithAppData(props: Omit<P, "data">) {
    const data = useAppData();
    if (!data) return <PageSkeleton />;
    return <View {...(props as P)} data={data} />;
  }
  WithAppData.displayName = `withAppData(${View.displayName ?? View.name})`;
  return WithAppData;
}
