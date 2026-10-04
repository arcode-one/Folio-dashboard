"use client";

import {
  AlarmClock,
  ArrowDownLeft,
  BellOff,
  CalendarClock,
  ChartColumn,
  HandCoins,
  ReceiptText,
  Target,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import type { AppData } from "@/lib/data";
import { formatDay } from "@/lib/format";
import { buildNotices, type Notice, type NoticeKind } from "@/lib/notifications";
import { Page } from "./AppShell";
import { markNoticesSeen, useSeenNotices } from "./hooks";
import { SheetHost, useSheets } from "./SheetHost";
import { useTerms } from "./terms";
import { withAppData } from "./WithData";
import { DemoBanner, EmptyState, PageHeader, Tile } from "./ui";

const ICON: Record<NoticeKind, { icon: LucideIcon; color: string }> = {
  overdue: { icon: AlarmClock, color: "var(--danger)" },
  deadline: { icon: CalendarClock, color: "var(--status-progress)" },
  unpaid: { icon: HandCoins, color: "var(--status-progress)" },
  noprepay: { icon: Wallet, color: "var(--status-new)" },
  payment: { icon: ArrowDownLeft, color: "var(--accent)" },
  expense: { icon: TrendingDown, color: "var(--danger)" },
  big: { icon: ReceiptText, color: "var(--status-new)" },
  summary: { icon: ChartColumn, color: "var(--ink)" },
  goal: { icon: Target, color: "var(--accent)" },
};

const GROUPS: { level: Notice["level"]; title: string }[] = [
  { level: "alert", title: "Требует внимания" },
  { level: "good", title: "Хорошие новости" },
  { level: "info", title: "К сведению" },
];

function NotificationsScreen({ data, currency }: { data: AppData; currency: string }) {
  const terms = useTerms();
  const notices = useMemo(() => buildNotices({ ...data, currency, terms }), [data, currency, terms]);
  const sheets = useSheets();
  const seen = useSeenNotices();

  // Пока страница открыта, новые помечены; прочитанными становятся, когда уходим со страницы или сворачиваем приложение.
  useEffect(() => {
    const ids = notices.map((n) => n.id);
    const markAll = () => markNoticesSeen(ids);
    const onHide = () => document.visibilityState === "hidden" && markAll();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      markAll();
    };
  }, [notices]);

  return (
    <Page>
      {data.demo && <DemoBanner />}
      <PageHeader
        title="Уведомления"
        subtitle={notices.length ? "Сроки, долги клиентов, оплаты и итоги месяца" : undefined}
      />

      {notices.length === 0 ? (
        <Tile className="mt-4">
          <EmptyState icon={BellOff} title="Всё спокойно">
            Здесь появятся близкие дедлайны, неоплаченные работы, новые оплаты и итоги месяца.
          </EmptyState>
        </Tile>
      ) : (
        <div className="mt-4 grid max-w-3xl grid-cols-1 gap-5">
          {GROUPS.map(({ level, title }) => {
            const list = notices.filter((n) => n.level === level);
            if (!list.length) return null;
            return (
              <section key={level}>
                <h2 className="mb-2 text-[13px] font-medium text-muted">{title}</h2>
                <ul className="grid gap-2">
                  {list.map((n, i) => {
                    const { icon: Icon, color } = ICON[n.kind];
                    const content = (
                      <>
                        <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
                          <Icon size={18} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">{n.title}</span>
                            {!seen.has(n.id) &&<span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">новое</span>}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted">{n.text}</span>
                        </span>
                        <span className="shrink-0 text-xs text-faint">{formatDay(n.date)}</span>
                      </>
                    );
                    return (
                      <li key={n.id} className="tile rise" style={{ ["--i" as string]: Math.min(i, 10) }}>
                        {n.projectId ? (
                          <button
                            onClick={() => sheets.open({ kind: "project", id: n.projectId! })}
                            className="flex w-full items-start gap-3 rounded-[24px] p-4 text-left transition-colors hover:bg-white/[0.04]"
                          >
                            {content}
                          </button>
                        ) : (
                          <div className="flex items-start gap-3 p-4">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <SheetHost
        {...sheets}
        data={{ categories: data.categories, projects: data.projects, payments: data.payments, transactions: data.transactions, currency, today: data.today }}
      />
    </Page>
  );
}

export const NotificationsView = withAppData(NotificationsScreen);
