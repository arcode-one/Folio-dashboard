"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { saveGoal } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import { iconButton } from "./ui";

const STEP = 10_000;
const R = 78;
const START = 135; // градусы: дуга 270°, разрыв снизу
const SWEEP = 270;

function point(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 100 + R * Math.cos(rad), y: 100 + R * Math.sin(rad) };
}

function arc(from: number, to: number) {
  const a = point(from);
  const b = point(to);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

/** Кольцо «план на месяц»: сколько заработано от плана. Плюс и минус меняют план с шагом 10 000. */
export function GoalRing({
  earned,
  goal: initialGoal,
  currency,
  editable,
  demo,
}: {
  earned: number;
  goal: number | null;
  currency: string;
  /** false — таблицы настроек нет, менять план нельзя */
  editable: boolean;
  demo: boolean;
}) {
  const [goal, setGoal] = useState(initialGoal ?? 0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function change(delta: number) {
    const next = Math.max(0, goal + delta);
    setGoal(next);
    setError(null);
    if (demo) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const result = await saveGoal(next);
      if (result.error) setError(result.error);
    }, 700);
  }

  const share = goal > 0 ? earned / goal : 0;
  const progress = Math.min(1, share);
  const end = START + SWEEP * progress;
  const knob = point(end);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[220px]">
        <svg viewBox="0 0 200 200" className="w-full" aria-hidden>
          <defs>
            <linearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#e0244a" />
              <stop offset="1" stopColor="#ff8aa0" />
            </linearGradient>
          </defs>
          <path d={arc(START, START + SWEEP)} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="12" strokeLinecap="round" />
          {progress > 0 && (
            <path
              d={arc(START, Math.max(START + 0.5, end))}
              fill="none"
              stroke="url(#ring)"
              strokeWidth="12"
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          )}
          <circle cx={knob.x} cy={knob.y} r="11" fill="#fff" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-[44px] leading-none font-semibold tracking-tight tnum">
            {goal > 0 ? Math.round(share * 100) : "—"}
            <span className="align-top text-2xl">{goal > 0 ? "%" : ""}</span>
          </p>
          <p className="mt-1 text-xs text-muted">{goal > 0 ? "плана месяца" : "план не задан"}</p>
        </div>
      </div>

      <div className="-mt-6 flex items-center gap-3">
        <button onClick={() => change(-STEP)} disabled={!editable || goal <= 0} aria-label="Уменьшить план на 10 000" className={`${iconButton} size-9 disabled:opacity-40`}>
          <Minus size={16} />
        </button>
        <div className="min-w-28 text-center">
          <p className="text-xs text-muted">План</p>
          <p className="font-semibold tnum">{goal > 0 ? formatMoney(goal, currency) : "не задан"}</p>
        </div>
        <button onClick={() => change(STEP)} disabled={!editable} aria-label="Увеличить план на 10 000" className={`${iconButton} size-9 disabled:opacity-40`}>
          <Plus size={16} />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted tnum">
        Заработано {formatMoney(earned, currency)}
        {goal > earned && `, осталось ${formatMoney(goal - earned, currency)}`}
      </p>
      {!editable && <p className="mt-2 text-center text-xs text-muted">План сейчас недоступен.</p>}
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
