"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#080c0a" : "#e6eae7");
  try {
    localStorage.setItem("theme", theme);
  } catch {}
  window.setTimeout(() => root.classList.remove("theme-switching"), 320);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Светлая тема" : "Тёмная тема";

  if (withLabel) {
    return (
      <button
        onClick={() => setTheme(next)}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <ThemeIcon theme={theme} />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="press grid size-11 place-items-center rounded-full bg-surface text-ink shadow-[var(--card-shadow)] transition-colors hover:bg-accent-soft"
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <span className="relative grid size-5 place-items-center" aria-hidden>
      <Sun
        size={20}
        className={`absolute transition-all duration-500 ease-[var(--ease-out-soft)] ${
          theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
        }`}
      />
      <Moon
        size={20}
        className={`absolute transition-all duration-500 ease-[var(--ease-out-soft)] ${
          theme === "dark" ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      />
    </span>
  );
}
