"use client";

import { ArrowDownLeft, BriefcaseBusiness, NotebookPen, Plus, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatDay, formatMoney } from "@/lib/format";
import { PAYMENT_KIND_LABEL } from "@/lib/projects";
import type { Category, Payment, ProjectSummary, Transaction } from "@/lib/types";
import type { SheetState } from "./SheetHost";
import { useTerms } from "./terms";
import { CategoryIcon, primaryButton } from "./ui";

const AVATAR_COLORS = ["#ff6b86", "#9dbcff", "#ffd27a", "#ff9b8c", "#c7a6ff", "#7fd6d0", "#f5b3d6"];

export function ClientAvatar({ name, size = "size-10", className = "" }: { name: string; size?: string; className?: string }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full font-display font-bold ${className}`}
      style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, color }}
      aria-hidden
    >
      {name.replace(/[«»"]/g, "").charAt(0).toUpperCase()}
    </span>
  );
}

export function OpRow({
  onClick,
  icon,
  title,
  subtitle,
  amount,
}: {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  amount: ReactNode;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{title}</span>
          <span className="block truncate text-[13px] text-muted">{subtitle}</span>
        </span>
        <span className="shrink-0 font-semibold tnum">{amount}</span>
      </button>
    </li>
  );
}

export const UNCATEGORIZED: Category = { id: 0, name: "Без категории", emoji: "📦", color: "#94a3b8", sort: 9999 };

export function IncomeIcon() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden>
      <ArrowDownLeft size={18} strokeWidth={2.3} />
    </span>
  );
}

export function PaymentRow({
  payment,
  project,
  onOpen,
  showDate = true,
}: {
  payment: Payment;
  project: ProjectSummary | null | undefined;
  onOpen: () => void;
  showDate?: boolean;
}) {
  return (
    <OpRow
      onClick={onOpen}
      icon={<IncomeIcon />}
      title={project?.client ?? payment.note ?? "Доход"}
      subtitle={[PAYMENT_KIND_LABEL[payment.kind], project?.title, showDate ? formatDay(payment.paid_at) : null].filter(Boolean).join(", ")}
      amount={<span className="text-accent">+{formatMoney(payment.amount, payment.currency)}</span>}
    />
  );
}

export function ExpenseRow({
  tx,
  category,
  project,
  onOpen,
  showDate = true,
}: {
  tx: Transaction;
  category: Category;
  project: ProjectSummary | null | undefined;
  onOpen: () => void;
  showDate?: boolean;
}) {
  return (
    <OpRow
      onClick={onOpen}
      icon={<CategoryIcon category={category} />}
      title={tx.description || category.name}
      subtitle={[project ? project.client : tx.vendor || category.name, showDate ? formatDay(tx.spent_at) : null].filter(Boolean).join(", ")}
      amount={<>−{formatMoney(tx.amount, tx.currency)}</>}
    />
  );
}

const addItems = (order: string): { label: string; icon: LucideIcon; state: SheetState | "note" }[] => [
  { label: "Расход", icon: Wallet, state: { kind: "tx", id: null } },
  { label: "Доход", icon: ArrowDownLeft, state: { kind: "payment", id: null } },
  { label: order, icon: BriefcaseBusiness, state: { kind: "project", id: null } },
  { label: "Заметка", icon: NotebookPen, state: "note" },
];

/** Кнопка «Добавить» с выбором: расход, доход, заказ или заметка. */
export function AddMenu({ onPick, placement }: { onPick: (s: SheetState) => void; placement: "up" | "down" }) {
  const T = useTerms();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {placement === "down" ? (
        <button onClick={() => setOpen(!open)} aria-expanded={open} className={primaryButton}>
          <Plus size={18} strokeWidth={2.4} className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
          Добавить
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Добавить"
          className="press grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_10px_30px_-6px_rgb(255_59_95/0.45)]"
        >
          <Plus size={24} strokeWidth={2.4} className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
        </button>
      )}
      {open && (
        <div
          role="menu"
          className={`pop-in absolute right-0 z-40 w-52 overflow-hidden rounded-3xl border border-line bg-[#1f2226]/95 p-1.5 shadow-2xl ${
            placement === "down" ? "top-13" : "bottom-16 origin-bottom-right"
          }`}
        >
          {addItems(T.order).map(({ label, icon: Icon, state }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (state === "note") router.push("/notes?new=1");
                else onPick(state);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left font-medium transition-colors hover:bg-white/[0.07]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon size={16} />
              </span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
