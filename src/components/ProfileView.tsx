"use client";

import { Repeat2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AppData } from "@/lib/data";
import { APP_NAME } from "@/lib/env";
import { formatDay, formatMoney } from "@/lib/format";
import { monthName } from "@/lib/periods";
import { profit } from "@/lib/projects";
import { resetDemo } from "@/lib/store";
import { Page } from "./AppShell";
import { ClientAvatar } from "./Rows";
import { ProfessionDialog } from "./ProfessionPicker";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import { BrandAvatar, DemoBanner, Stat, Tile, TileHeader, plural, primaryButton, secondaryButton } from "./ui";

function ProfileScreen({ data, currency }: { data: AppData; currency: string }) {
  const T = useTerms();
  const { projects, payments, transactions } = data;

  const s = useMemo(() => {
    const pays = payments.filter((p) => p.currency === currency);
    const earned = pays.reduce((sum, p) => sum + p.amount, 0);
    const done = projects.filter((p) => p.status === "done" && p.currency === currency);
    const avg = done.length ? done.reduce((sum, p) => sum + p.price, 0) / done.length : 0;
    const projectProfit = done.reduce((sum, p) => sum + profit(p), 0);

    const byMonth = new Map<string, number>();
    pays.forEach((p) => byMonth.set(p.paid_at.slice(0, 7), (byMonth.get(p.paid_at.slice(0, 7)) ?? 0) + p.amount));
    const bestMonth = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];

    const byClient = new Map<string, number>();
    projects.forEach((p) => byClient.set(p.client, (byClient.get(p.client) ?? 0) + p.received));
    const topClients = [...byClient.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const byPlatform = new Map<string, { count: number; received: number; costs: number }>();
    projects
      .filter((p) => p.status !== "cancelled")
      .forEach((p) => {
        const key = p.platform || "Не указана";
        const row = byPlatform.get(key) ?? { count: 0, received: 0, costs: 0 };
        byPlatform.set(key, { count: row.count + 1, received: row.received + p.received, costs: row.costs + p.costs });
      });
    const platforms = [...byPlatform.entries()].sort((a, b) => b[1].received - a[1].received);

    const dates = [...projects.map((p) => p.created_at.slice(0, 10)), ...payments.map((p) => p.paid_at), ...transactions.map((t) => t.spent_at)].sort();

    return { earned, done: done.length, avg, projectProfit, bestMonth, topClients, platforms, since: dates[0] };
  }, [projects, payments, transactions, currency]);

  return (
    <Page>
      {data.demo && <DemoBanner />}

      <Tile i={0} className="relative overflow-hidden p-5 lg:p-7">
        <div className="relative flex flex-wrap items-center gap-4">
          <BrandAvatar className="size-20 text-[17px]" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">{APP_NAME}</h1>
            <p className="truncate text-muted">{T.tagline}</p>
            {s.since && <p className="mt-1 text-sm text-muted">Учёт ведётся с {formatDay(s.since)} {s.since.slice(0, 4)}</p>}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <ChangeProfessionButton current={data.profession} />
            <ResetDemoButton />
          </div>
        </div>
      </Tile>

      <h2 className="mt-6 mb-3 text-[13px] font-medium text-muted">За всё время</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat i={1} label="Заработано" value={formatMoney(s.earned, currency)} accent />
        <Stat i={2} label={T.doneStat} value={<span className="tnum">{s.done}</span>} hint={`из ${projects.length} ${plural(projects.length, [T.orderGen, T.ordersGen, T.ordersGen])}`} />
        <Stat i={3} label="Средний чек" value={formatMoney(Math.round(s.avg), currency)} />
        <Stat
          i={4}
          label="Лучший месяц"
          value={s.bestMonth ? formatMoney(s.bestMonth[1], currency) : "—"}
          hint={s.bestMonth ? `${monthName(s.bestMonth[0])} ${s.bestMonth[0].slice(0, 4)}` : undefined}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
        <Tile i={5} className="p-4 lg:col-span-7 lg:p-5">
          <TileHeader title={T.sources} sub={T.sourcesSub} />
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-[13px] text-muted">
              <tr>
                <th className="pb-2 font-normal">{T.source}</th>
                <th className="pb-2 text-right font-normal">Получено</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">Затраты</th>
                <th className="pb-2 text-right font-normal">Окупаемость</th>
              </tr>
            </thead>
            <tbody>
              {s.platforms.map(([name, r]) => (
                <tr key={name} className="border-t border-white/[0.07]">
                  <td className="py-2.5">
                    <span className="font-medium">{name}</span>
                    <span className="block text-xs text-muted">
                      {r.count} {plural(r.count, T.forms)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold tnum">{formatMoney(r.received, currency)}</td>
                  <td className="hidden py-2.5 text-right text-muted tnum sm:table-cell">{formatMoney(r.costs, currency)}</td>
                  <td className="py-2.5 text-right tnum">
                    {r.costs > 0 ? (
                      <span className={r.received / r.costs < 1 ? "text-danger" : "text-ink"}>×{(Math.round((r.received / r.costs) * 10) / 10).toString().replace(".", ",")}</span>
                    ) : (
                      <span className="text-muted">без затрат</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Окупаемость — во сколько раз полученное больше затрат на привлечение. Меньше ×1 — затраты съели больше, чем принесли.</p>
        </Tile>

        <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-4">
          <Tile i={6} className="p-4 lg:p-5">
            <TileHeader title={T.topClients} />
            <ul className="mt-2">
              {s.topClients.map(([name, sum]) => (
                <li key={name} className="flex items-center gap-3 py-2">
                  <ClientAvatar name={name} size="size-9" />
                  <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                  <span className="font-semibold tnum">{formatMoney(sum, currency)}</span>
                </li>
              ))}
            </ul>
          </Tile>
        </div>
      </div>
    </Page>
  );
}

function ChangeProfessionButton({ current }: { current: AppData["profession"] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={`${primaryButton} flex-1 basis-[180px] whitespace-nowrap sm:flex-none sm:basis-auto`}>
        <Repeat2 size={18} /> Сменить профессию
      </button>
      {open && <ProfessionDialog current={current} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Вернуть демо-данные к исходным — с подтверждением, как выход из кабинета в рабочей версии. */
function ResetDemoButton() {
  const T = useTerms();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${secondaryButton} flex-1 basis-[180px] whitespace-nowrap sm:flex-none sm:basis-auto`}>
        <RotateCcw size={18} /> Сбросить демо-данные
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="backdrop absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-title"
              className="pop-in relative w-full max-w-sm rounded-[28px] border border-line bg-[#1c1f23] p-6"
              style={{ boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.7)", transformOrigin: "center" }}
            >
              <h2 id="reset-title" className="font-display text-xl font-semibold tracking-tight">
                Сбросить демо-данные?
              </h2>
              <p className="mt-2 text-muted">Все ваши добавления, правки и удаления пропадут, вернутся исходные {T.orders.toLowerCase()}, доходы, расходы и заметки.</p>
              <div className="mt-6 flex gap-2">
                <button type="button" autoFocus onClick={() => setOpen(false)} className={`${secondaryButton} flex-1`}>
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDemo();
                    setOpen(false);
                  }}
                  className="press h-11 flex-1 rounded-full bg-danger font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export const ProfileView = withAppData(ProfileScreen);
