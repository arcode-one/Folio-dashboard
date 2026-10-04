"use client";

import {
  Brain,
  Camera,
  Clapperboard,
  Dumbbell,
  GraduationCap,
  Hammer,
  Monitor,
  Palette,
  Smartphone,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { APP_NAME } from "@/lib/env";
import { PROFESSIONS, type ProfessionId } from "@/lib/professions";
import { chooseProfession } from "@/lib/store";
import { BrandAvatar } from "./ui";

const ICON: Record<ProfessionId, LucideIcon> = {
  web: Monitor,
  photo: Camera,
  video: Clapperboard,
  graphic: Palette,
  smm: Smartphone,
  repair: Hammer,
  tutor: GraduationCap,
  beauty: Sparkles,
  psych: Brain,
  fitness: Dumbbell,
};

function Grid({ current, onPick }: { current?: ProfessionId; onPick: (id: ProfessionId) => void }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
      {PROFESSIONS.map((p, i) => {
        const Icon = ICON[p.id];
        const active = p.id === current;
        return (
          <li key={p.id} className="rise" style={{ animationDelay: `${60 + i * 35}ms` }}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              aria-current={active ? "true" : undefined}
              className={`tile tile-hover press flex h-full w-full items-center gap-3 p-3.5 text-left lg:flex-col lg:items-start lg:gap-4 lg:p-4 ${
                active ? "outline-2 outline-accent" : ""
              }`}
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-full ${active ? "bg-accent text-accent-ink" : "bg-white/10 text-ink"}`}
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{p.name}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{p.about}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Первый экран: кто вы по профессии. Под выбор собираются подписи и демо-данные. */
export function ProfessionPicker() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 pt-safe pb-safe lg:p-8">
      <div className="glass w-full max-w-[1180px] rounded-[36px] p-5 max-lg:bg-[#1a1d21]/90 lg:p-8">
        <div className="rise flex items-center gap-3">
          <BrandAvatar />
          <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <h1 className="rise mt-6 font-display text-[28px] leading-tight font-semibold tracking-tight lg:text-[36px]">Кто вы по профессии?</h1>
        <p className="rise mt-2 max-w-2xl text-muted">
          Дашборд соберётся под вашу работу: свои разделы, слова и пример данных за год. Всё можно добавлять, менять и удалять — а
          профессию сменить в профиле.
        </p>
        <Grid onPick={chooseProfession} />
      </div>
    </main>
  );
}

/** Смена профессии из профиля — то же меню в окне поверх страницы. */
export function ProfessionDialog({ current, onClose }: { current: ProfessionId; onClose: () => void }) {
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

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <div className="backdrop fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profession-title"
        className="pop-in relative w-full max-w-[1100px] rounded-[32px] border border-line bg-[#1c1f23] p-5 lg:p-7"
        style={{ boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.7)", transformOrigin: "center" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="profession-title" className="font-display text-2xl font-semibold tracking-tight">
              Сменить профессию
            </h2>
            <p className="mt-1 text-muted">У каждой профессии свои данные — правки в текущей сохранятся.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="press grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <Grid
          current={current}
          onPick={(id) => {
            chooseProfession(id);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
