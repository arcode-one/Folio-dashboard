"use client";

import {
  Bell,
  BriefcaseBusiness,
  House,
  Menu,
  NotebookPen,
  PiggyBank,
  TrendingUp,
  UserRound,
  WalletMinimal,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppData, useProfessionId } from "@/lib/data";
import { APP_NAME, DEFAULT_CURRENCY } from "@/lib/env";
import { buildNotices } from "@/lib/notifications";
import { getProfession, type Terms } from "@/lib/professions";
import { isActive as isActiveProject } from "@/lib/projects";
import { chooseProfession, getPreviewProfession } from "@/lib/store";
import { useSeenNotices } from "./hooks";
import { ProfessionDialog } from "./ProfessionPicker";
import { useTerms } from "./terms";
import { BrandAvatar, iconButton } from "./ui";

const TABS: { href: string; label: string }[] = [
  { href: "/", label: "Обзор" },
  { href: "/income", label: "Доходы" },
  { href: "/expenses", label: "Расходы" },
  { href: "/profit", label: "Прибыль" },
  { href: "/projects", label: "Заказы" },
  { href: "/notes", label: "Заметки" },
];

const RAIL: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Обзор", icon: House },
  { href: "/income", label: "Доходы", icon: TrendingUp },
  { href: "/expenses", label: "Расходы", icon: WalletMinimal },
  { href: "/projects", label: "Заказы", icon: BriefcaseBusiness },
  { href: "/notes", label: "Заметки", icon: NotebookPen },
];

/** Меню телефона: все разделы, включая уведомления и профиль. */
const MENU: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Обзор", icon: House },
  { href: "/income", label: "Доходы", icon: TrendingUp },
  { href: "/expenses", label: "Расходы", icon: WalletMinimal },
  { href: "/profit", label: "Прибыль", icon: PiggyBank },
  { href: "/projects", label: "Заказы", icon: BriefcaseBusiness },
  { href: "/notes", label: "Заметки", icon: NotebookPen },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

/** Раздел работы называется по-разному: «Заказы», «Съёмки», «Ученики»… */
const navLabel = (T: Terms, href: string, label: string) => (href === "/projects" ? T.orders : label);

type Props = {
  children: ReactNode;
  activeCount: number;
  noticeIds: string[];
};

/** Число заказов в работе и id уведомлений для значков меню. */
function useShellData() {
  const data = useAppData();
  return useMemo(() => {
    if (!data) return { activeCount: 0, noticeIds: [] as string[] };
    return {
      activeCount: data.projects.filter(isActiveProject).length,
      noticeIds: buildNotices({ ...data, currency: DEFAULT_CURRENCY, terms: getProfession(data.profession).terms }).map((n) => n.id),
    };
  }, [data]);
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function Logo() {
  return (
    <Link href="/" className="font-display text-xl font-semibold tracking-tight" aria-label={`${APP_NAME} — на главную`}>
      {APP_NAME}
    </Link>
  );
}


function NoticeDot({ ids }: { ids: string[] }) {
  const seen = useSeenNotices();
  const unread = ids.filter((id) => !seen.has(id)).length;
  if (!unread) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink tnum" aria-hidden>
      {unread > 9 ? "9+" : unread}
    </span>
  );
}

function unreadLabel(ids: string[], seen: Set<string>) {
  const unread = ids.filter((id) => !seen.has(id)).length;
  return unread ? `Уведомления, новых: ${unread}` : "Уведомления";
}

function BellLink({ ids, className }: { ids: string[]; className: string }) {
  const seen = useSeenNotices();
  return (
    <Link href="/notifications" aria-label={unreadLabel(ids, seen)} title="Уведомления" className={className}>
      <Bell size={20} strokeWidth={1.9} />
      <NoticeDot ids={ids} />
    </Link>
  );
}


/** Вкладки на ПК: как переключатель комнат в референсе — текст и акцентная черта под активной. */
function DesktopTabs({ activeCount }: { activeCount: number }) {
  const isActive = useIsActive();
  const T = useTerms();
  return (
    <nav aria-label="Разделы" className="flex h-14 items-center gap-1 rounded-full bg-black/25 px-2">
      {TABS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] transition-colors xl:px-5 ${
              active ? "font-semibold text-ink" : "text-muted hover:bg-white/[0.06] hover:text-ink"
            }`}
          >
            {navLabel(T, href, label)}
            {href === "/projects" && activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink tnum">{activeCount}</span>
            )}
            <span
              className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-accent transition-transform duration-300 ease-[var(--ease-out-soft)] xl:inset-x-5 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}

/** Шапка телефона: слева кабинет и название, справа уведомления и бургер. Прилипает к верху. */
function MobileHeader({ activeCount, noticeIds }: Omit<Props, "children">) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/[0.06] bg-[#14171b]/85 px-4 pt-safe pb-3 backdrop-blur-xl lg:hidden">
        <Link href="/profile" aria-label="Личный кабинет" className="press shrink-0 rounded-full">
          <BrandAvatar />
        </Link>
        <span className="ml-1 min-w-0 truncate">
          <Logo />
        </span>
        <BellLink ids={noticeIds} className={`${iconButton} ml-auto`} />
        <button type="button" onClick={() => setOpen(true)} aria-label="Открыть меню" aria-expanded={open} className={iconButton}>
          <Menu size={20} strokeWidth={1.9} />
          {activeCount > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" aria-hidden />}
        </button>
      </header>
      {open && <MobileMenu activeCount={activeCount} noticeIds={noticeIds} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Выезжающее справа меню телефона со всеми разделами. */
function MobileMenu({ activeCount, noticeIds, onClose }: Omit<Props, "children"> & { onClose: () => void }) {
  const isActive = useIsActive();
  const T = useTerms();
  const seen = useSeenNotices();
  const unread = noticeIds.filter((id) => !seen.has(id)).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Пока меню открыто, страница под ним не листается.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="backdrop absolute inset-0 bg-black/60" onClick={onClose} />
      <nav
        aria-label="Разделы"
        className="drawer absolute inset-y-0 right-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto rounded-l-[32px] border-l border-line bg-[#1a1d21] px-3 pt-safe pb-safe"
        style={{ boxShadow: "-30px 0 80px -20px rgb(0 0 0 / 0.7)" }}
      >
        <div className="flex items-center gap-3 px-1">
          <BrandAvatar />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-semibold">{APP_NAME}</p>
            <p className="truncate text-sm text-muted">{T.tagline}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть меню" className="press grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <ul className="mt-5 flex flex-col gap-1">
          {MENU.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const badge = href === "/projects" ? activeCount : href === "/notifications" ? unread : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`press flex h-12 items-center gap-3 rounded-2xl px-3 text-[15px] transition-colors ${
                    active ? "bg-white/[0.1] font-semibold text-ink" : "font-medium text-muted hover:bg-white/[0.06] hover:text-ink"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-accent" : undefined} />
                  <span className="flex-1">{navLabel(T, href, label)}</span>
                  {badge > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink tnum">{badge > 9 ? "9+" : badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>,
    document.body,
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const isActive = useIsActive();
  const T = useTerms();
  const { activeCount, noticeIds } = useShellData();
  const professionId = useProfessionId();

  // Каждый новый заход: сначала только выбор профессии на тёмном экране, кабинет с фоном — уже после выбора.
  if (professionId === null) return <ProfessionDialog onClose={() => chooseProfession(getPreviewProfession())} />;

  return (
    <>
      <div className="scene" aria-hidden />
      <div className="mx-auto min-h-dvh max-w-[1760px] lg:flex lg:h-dvh lg:min-h-0 lg:items-center lg:gap-4 lg:p-4 xl:gap-5 xl:p-6">
        {/* ─── Рельса слева (ПК) ─── */}
        <aside className="glass hidden w-[76px] shrink-0 flex-col items-center gap-2 rounded-[38px] py-4 lg:flex">
          {RAIL.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={navLabel(T, href, label)}
                aria-label={navLabel(T, href, label)}
                aria-current={active ? "page" : undefined}
                className={`press grid size-12 place-items-center rounded-full transition-colors ${
                  active ? "bg-white/20 text-ink" : "text-muted hover:bg-white/10 hover:text-ink"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              </Link>
            );
          })}
          <div className="my-2 h-px w-8 bg-white/10" aria-hidden />
          <BellLink
            ids={noticeIds}
            className={`press relative grid size-12 place-items-center rounded-full transition-colors ${
              isActive("/notifications") ? "bg-white/20 text-ink" : "text-muted hover:bg-white/10 hover:text-ink"
            }`}
          />
          <Link
            href="/profile"
            title="Профиль"
            aria-label="Профиль"
            aria-current={isActive("/profile") ? "page" : undefined}
            className={`press grid size-12 place-items-center rounded-full transition-colors ${
              isActive("/profile") ? "bg-white/20 text-ink" : "text-muted hover:bg-white/10 hover:text-ink"
            }`}
          >
            <UserRound size={20} strokeWidth={1.8} />
          </Link>
        </aside>

        {/* ─── Главная стеклянная панель ─── */}
        <div className="glass min-w-0 lg:flex lg:h-full lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-[40px]">
          <MobileHeader activeCount={activeCount} noticeIds={noticeIds} />

          {/* Шапка ПК */}
          <header className="hidden shrink-0 items-center gap-4 px-6 pt-5 lg:flex xl:px-7">
            {/* Кабинет слева — в такой же плашке, как вкладки, и с тем же ховером */}
            <Link
              href="/profile"
              aria-current={isActive("/profile") ? "page" : undefined}
              className="group flex h-14 shrink-0 items-center rounded-full bg-black/25 px-2"
            >
              <span
                className={`flex h-10 items-center gap-3 rounded-full pr-1 pl-1 transition-colors group-hover:bg-white/[0.06] xl:pr-4 ${
                  isActive("/profile") ? "bg-white/[0.06]" : ""
                }`}
              >
                <BrandAvatar className="size-9 text-[8px]" />
                <span className="hidden leading-tight xl:block">
                  <span className="block text-sm font-semibold">{APP_NAME}</span>
                  <span className="block text-xs text-muted">{T.tagline}</span>
                </span>
              </span>
            </Link>
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-black/25">
              <BellLink
                ids={noticeIds}
                className={`press relative grid size-10 place-items-center rounded-full transition-colors hover:bg-white/[0.06] hover:text-ink ${
                  isActive("/notifications") ? "bg-white/[0.06] text-ink" : "text-muted"
                }`}
              />
            </div>
            <div className="ml-auto">
              <DesktopTabs activeCount={activeCount} />
            </div>
          </header>

          <main className="thin-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}

/** Контейнер страницы. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="px-4 pt-4 pb-28 lg:px-6 lg:pt-5 lg:pb-7 xl:px-7">{children}</div>;
}
