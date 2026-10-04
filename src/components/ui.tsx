"use client";

import {
  ArrowUpRight,
  Briefcase,
  CarTaxiFront,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clapperboard,
  Coffee,
  Fuel,
  Gift,
  GraduationCap,
  House,
  Loader,
  Package,
  Pill,
  Plane,
  Repeat,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { APP_NAME } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { PERIODS, type Period } from "@/lib/periods";
import type { Category, ProjectStatus } from "@/lib/types";
import { useTerms } from "./terms";

export function plural(n: number, forms: [string, string, string]) {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Задержка появления для анимации .rise */
export const riseDelay = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Анимированные числа ───────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const from = useRef(0);

  useEffect(() => {
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(initial + (target - initial) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function AnimatedMoney({ value, currency, sign = false }: { value: number; currency: string; sign?: boolean }) {
  const shown = useCountUp(value);
  const rounded = Math.abs(value) >= 1000 || Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 100) / 100;
  return (
    <span className="tnum">
      {sign && value > 0 ? "+" : ""}
      {formatMoney(rounded, currency)}
    </span>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  return <span className="tnum">{Math.round(useCountUp(value))}</span>;
}

// ─── Кнопки ───────────────────────────────────────────────────────────

export const primaryButton =
  "press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-60";
export const secondaryButton =
  "press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-card-hi px-5 font-medium text-ink transition-colors hover:bg-white/20";
export const pillButton =
  "press inline-flex h-9 items-center gap-1.5 rounded-full bg-card-hi px-3.5 text-sm font-medium transition-colors hover:bg-white/20";
export const iconButton =
  "press relative grid size-11 shrink-0 place-items-center rounded-full bg-card-hi text-ink transition-colors hover:bg-white/20";

/** Круглая кнопка со стрелкой в углу плашки — поворачивается при наведении на плашку. */
export function ArrowButton() {
  return (
    <span className="arrow-btn grid size-8 shrink-0 place-items-center rounded-full bg-card-hi text-ink" aria-hidden>
      <ArrowUpRight size={16} strokeWidth={2.2} />
    </span>
  );
}

// ─── Плашки ───────────────────────────────────────────────────────────

export function Tile({
  children,
  className = "",
  i,
  as: Tag = "section",
  label,
}: {
  children: ReactNode;
  className?: string;
  i?: number;
  as?: "section" | "div" | "li" | "article";
  label?: string;
}) {
  return (
    <Tag className={`tile ${i !== undefined ? "rise" : ""} ${className}`} style={i !== undefined ? riseDelay(i) : undefined} aria-label={label}>
      {children}
    </Tag>
  );
}

export function TileHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 className="text-[15px] font-semibold">
        {title}
        {sub && <span className="ml-1.5 font-normal text-muted">{sub}</span>}
      </h2>
      {children}
    </div>
  );
}

/** Маленькая подпись + крупное число, как «Total Power used» в референсе. */
export function Stat({
  label,
  value,
  hint,
  i,
  accent = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  i?: number;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Tile as="div" i={i} className={`flex min-w-0 flex-col justify-between p-4 lg:p-5 ${className}`}>
      <p className="text-[13px] text-muted">{label}</p>
      <p
        className={`mt-2 truncate font-display text-[22px] leading-tight font-semibold tracking-tight sm:text-[26px] ${accent ? "text-accent" : ""}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-[13px] text-muted">{hint}</p>}
    </Tile>
  );
}

// ─── Выбор периода ─────────────────────────────────────────────────────

/** Месяц / 3 мес / 6 мес / Год. `dimmed` — выбраны свои даты, ни один вариант не подсвечен. */
export function PeriodPicker({ value, onChange, dimmed = false }: { value: Period; onChange: (p: Period) => void; dimmed?: boolean }) {
  const index = PERIODS.findIndex((p) => p.value === value);
  return (
    <div role="radiogroup" aria-label="Период" className="relative inline-flex rounded-full bg-black/25 p-1">
      <span
        className={`absolute inset-y-1 left-1 w-[62px] rounded-full bg-ink transition-[transform,opacity] duration-300 ease-[var(--ease-out-soft)] sm:w-[72px] ${dimmed ? "opacity-0" : ""}`}
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden
      />
      {PERIODS.map((p) => {
        const on = p.value === value && !dimmed;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.value)}
            className={`relative z-10 h-9 w-[62px] rounded-full text-sm font-medium transition-colors duration-300 sm:w-[72px] ${
              on ? "text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
// ─── Поля ─────────────────────────────────────────────────────────────

export const inputClass =
  "w-full rounded-2xl border border-line bg-white/[0.06] px-4 py-3 text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-faint focus:border-accent focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const index = options.findIndex((o) => o.value === value);
  return (
    <div role="radiogroup" aria-label={label} className="relative flex rounded-full bg-black/25 p-1">
      <span
        className="absolute inset-y-1 left-1 rounded-full bg-ink transition-transform duration-300 ease-[var(--ease-out-soft)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
        aria-hidden
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 min-w-0 flex-1 truncate rounded-full px-2 py-2 text-sm font-medium transition-colors duration-300 ${
            o.value === value ? "text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function currencySymbol(currency: string) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")
    ?.value;
}

export function BigAmountInput({
  value,
  onChange,
  currency,
  autoFocus,
  label = "Сумма",
}: {
  value: string;
  onChange: (v: string) => void;
  currency: string;
  autoFocus?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-5 flex items-baseline gap-2 rounded-3xl bg-white/[0.06] px-5 py-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent)]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        aria-label={label}
        autoFocus={autoFocus}
        className="w-full min-w-0 bg-transparent font-display text-[40px] leading-tight font-semibold tracking-tight outline-none tnum placeholder:text-faint"
      />
      <span className="font-display text-2xl font-semibold text-muted">{currencySymbol(currency)}</span>
    </div>
  );
}

export function amountToInput(amount: number | undefined) {
  if (!amount) return "";
  return (Number.isInteger(amount) ? String(amount) : amount.toFixed(2)).replace(".", ",");
}

// ─── Шторка ───────────────────────────────────────────────────────────

/** На телефоне выезжает снизу, на ПК — стеклянная панель справа. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="backdrop absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-lg touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-[32px] border-t border-line bg-[#1c1f23] px-5 pt-2 pb-safe lg:inset-y-4 lg:right-4 lg:left-auto lg:max-h-none lg:w-[460px] lg:max-w-none lg:rounded-[32px] lg:border lg:bg-[#1c1f23]/85 lg:px-7 lg:pt-7 lg:backdrop-blur-2xl"
        style={{ boxShadow: "var(--sheet-shadow)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-white/20 lg:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-4">
          <h2 className="min-w-0 truncate font-display text-xl font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть" className={`${iconButton} size-10 text-muted hover:text-ink`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SheetActions({
  pending,
  submitLabel,
  onSubmit,
  onDelete,
  confirmDelete,
  deleteLabel,
}: {
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onDelete?: () => void;
  confirmDelete?: boolean;
  deleteLabel?: string;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2 pb-2">
      <button onClick={onSubmit} disabled={pending} className={`${primaryButton} h-13 text-base`}>
        {pending ? "Сохраняю…" : submitLabel}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={pending}
          className={`press h-12 rounded-full font-medium transition-colors ${
            confirmDelete ? "bg-danger text-white" : "text-danger hover:bg-danger/10"
          }`}
        >
          {confirmDelete ? "Нажмите ещё раз, чтобы удалить" : (deleteLabel ?? "Удалить")}
        </button>
      )}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-2xl bg-danger/12 px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}

// ─── Прочее ───────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight lg:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, label, animate = true }: { value: number; max: number; label: string; animate?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 overflow-hidden rounded-full bg-white/12"
    >
      <div className={`h-full rounded-full bg-accent ${animate ? "grow-x" : ""}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const STATUS_STYLE: Record<ProjectStatus, { className: string; icon: LucideIcon }> = {
  new: { className: "bg-status-new/15 text-status-new", icon: CircleDashed },
  in_progress: { className: "bg-status-progress/15 text-status-progress", icon: Loader },
  done: { className: "bg-status-done/15 text-status-done", icon: CircleCheck },
  cancelled: { className: "bg-status-cancelled/15 text-status-cancelled", icon: CircleX },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { className, icon: Icon } = STATUS_STYLE[status];
  const T = useTerms();
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden />
      {T.status[status]}
    </span>
  );
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Работа: Briefcase,
  Продукты: ShoppingCart,
  "Кафе и рестораны": Coffee,
  Транспорт: CarTaxiFront,
  Авто: Fuel,
  "Дом и ЖКХ": House,
  "Связь и интернет": Smartphone,
  Здоровье: Pill,
  "Одежда и обувь": Shirt,
  Красота: Sparkles,
  Развлечения: Clapperboard,
  Подписки: Repeat,
  Образование: GraduationCap,
  Подарки: Gift,
  Путешествия: Plane,
  Другое: Package,
};

/** Иконка категории в цветном кружке. Для своих категорий без иконки — эмодзи из базы. */
export function CategoryIcon({ category, size = "md" }: { category: Category; size?: "sm" | "md" }) {
  const Icon = CATEGORY_ICONS[category.name];
  const box = size === "sm" ? "size-8" : "size-10";
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center rounded-full`}
      style={{ background: `${category.color}2e`, color: `color-mix(in srgb, ${category.color} 55%, white)` }}
      aria-hidden
    >
      {Icon ? <Icon size={size === "sm" ? 16 : 18} strokeWidth={2} /> : <span className="text-lg">{category.emoji}</span>}
    </span>
  );
}

/** Логотип: белая надпись на чёрном круге — аватар кабинета. */
export function BrandAvatar({ className = "size-11 text-[10px]" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-black font-display font-extrabold tracking-[-0.03em] text-white ring-1 ring-white/15 ${className}`}
      aria-hidden
    >
      {APP_NAME}
    </span>
  );
}

// Плашку демо можно закрыть — запоминаем это в браузере.
const BANNER_KEY = "demo-banner-hidden";
const BANNER_EVENT = "demo-banner-change";

function subscribeBanner(cb: () => void) {
  window.addEventListener(BANNER_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(BANNER_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function bannerHidden() {
  try {
    return localStorage.getItem(BANNER_KEY) === "1";
  } catch {
    return false;
  }
}

export function DemoBanner() {
  const hidden = useSyncExternalStore(subscribeBanner, bannerHidden, () => true);
  if (hidden) return null;

  function hide() {
    try {
      localStorage.setItem(BANNER_KEY, "1");
    } catch {}
    window.dispatchEvent(new Event(BANNER_EVENT));
  }

  return (
    <div className="rise mb-4 flex items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent-soft py-2 pr-2 pl-4 text-sm">
      <Sparkles size={18} className="shrink-0 text-accent" aria-hidden />
      <p className="min-w-0 flex-1">
        Демо-версия: всё можно добавлять, менять и удалять — данные хранятся только в вашем браузере.{" "}
        <Link href="/profile" className="font-medium text-accent hover:underline">
          Сбросить
        </Link>
      </p>
      <button type="button" onClick={hide} aria-label="Скрыть плашку" className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-5 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-card-hi text-muted">
        <Icon size={22} />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}

/** Круглая кнопка «+» внизу экрана на телефоне. */
export function Fab({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-end px-4 lg:hidden">
      <div className="pointer-events-auto">
        {onClick ? (
          <button
            onClick={onClick}
            aria-label={label}
            className="press grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_10px_30px_-6px_rgb(255_59_95/0.45)]"
          >
            {children}
          </button>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function money(n: number, currency: string) {
  return formatMoney(n, currency);
}
