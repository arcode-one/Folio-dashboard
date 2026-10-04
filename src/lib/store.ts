import { buildSeed, type DemoDB } from "./demo";
import { todayISO } from "./format";
import type { AppData } from "./data";
import { PROFESSION_IDS, type ProfessionId } from "./professions";
import { SEEDS } from "./seeds";
import type { ProjectSummary } from "./types";

// Вместо базы — localStorage: у каждого посетителя своя копия демо-данных,
// которую можно менять как угодно и в любой момент сбросить к исходной.
// Для каждой профессии — свой набор данных и свой ключ: переключение не теряет правки.

const KEY_PREFIX = "finance-demo-db:";
const PROFESSION_KEY = "demo-profession";
const VERSION = 2;

const keyFor = (id: ProfessionId) => KEY_PREFIX + id;

/** undefined — ещё не читали, null — профессия не выбрана */
let profession: ProfessionId | null | undefined;

type Stored = DemoDB & { version: number; /** «сегодня» на момент последнего сохранения */ base: string };

let db: Stored | null = null;
let snapshot: AppData | null = null;
const listeners = new Set<() => void>();

const DATE = /^\d{4}-\d{2}-\d{2}/;

function shiftDate<T extends string | null>(value: T, days: number): T {
  if (!value || !DATE.test(value)) return value;
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return (d.toISOString().slice(0, 10) + value.slice(10)) as T;
}

/** Демо не стареет: при следующем визите все даты сдвигаются на прошедшие дни. */
function shiftAll(s: Stored, days: number): Stored {
  return {
    ...s,
    projects: s.projects.map((p) => ({
      ...p,
      deadline: shiftDate(p.deadline, days),
      completed_at: shiftDate(p.completed_at, days),
      created_at: shiftDate(p.created_at, days),
    })),
    payments: s.payments.map((p) => ({ ...p, paid_at: shiftDate(p.paid_at, days), created_at: shiftDate(p.created_at, days) })),
    transactions: s.transactions.map((t) => ({ ...t, spent_at: shiftDate(t.spent_at, days), created_at: shiftDate(t.created_at, days) })),
    notes: s.notes.map((n) => ({ ...n, created_at: shiftDate(n.created_at, days), updated_at: shiftDate(n.updated_at, days) })),
  };
}

function fresh(id: ProfessionId, today: string): Stored {
  return { ...buildSeed(today, SEEDS[id]), version: VERSION, base: today };
}

function persist(id: ProfessionId, s: Stored) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(s));
  } catch {}
}

function readProfession(): ProfessionId | null {
  if (profession !== undefined) return profession;
  let value: string | null = null;
  try {
    value = localStorage.getItem(PROFESSION_KEY);
  } catch {}
  profession = PROFESSION_IDS.includes(value as ProfessionId) ? (value as ProfessionId) : null;
  return profession;
}

function load(id: ProfessionId): Stored {
  const today = todayISO();
  let s: Stored | null = null;
  try {
    const raw = localStorage.getItem(keyFor(id));
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    if (parsed?.version === VERSION && Array.isArray(parsed.projects)) s = parsed;
  } catch {}
  if (!s) s = fresh(id, today);
  else if (s.base !== today) {
    const days = Math.round((Date.parse(today) - Date.parse(s.base)) / 86_400_000);
    s = { ...shiftAll(s, days), base: today };
  }
  persist(id, s);
  return s;
}

function build(id: ProfessionId, s: Stored): AppData {
  // Копии объектов: правки в хранилище не должны менять уже отданный снимок.
  const transactions = s.transactions.map((t) => ({ ...t })).sort(
    (a, b) => b.spent_at.localeCompare(a.spent_at) || b.created_at.localeCompare(a.created_at),
  );
  const payments = s.payments.map((p) => ({ ...p })).sort((a, b) => b.paid_at.localeCompare(a.paid_at) || b.created_at.localeCompare(a.created_at));
  const projects: ProjectSummary[] = s.projects
    .map((p) => {
      const own = payments.filter((x) => x.project_id === p.id);
      return {
        ...p,
        received: own.reduce((sum, x) => sum + x.amount, 0),
        prepaid: own.filter((x) => x.kind === "prepayment").reduce((sum, x) => sum + x.amount, 0),
        last_paid_at: own[0]?.paid_at ?? null,
        costs: transactions.filter((t) => t.project_id === p.id).reduce((sum, t) => sum + t.amount, 0),
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const notes = s.notes.map((n) => ({ ...n })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));

  return {
    demo: true,
    profession: id,
    today: s.base,
    since: "",
    categories: s.categories.map((c) => ({ ...c })),
    projects,
    payments,
    transactions,
    notes,
    goal: s.goal,
    settingsReady: true,
  };
}

function emit() {
  snapshot = null;
  listeners.forEach((l) => l());
}

/** Данные выбранной профессии; null — профессия ещё не выбрана. */
export function getSnapshot(): AppData | null {
  const id = readProfession();
  if (!id) return null;
  if (!db) db = load(id);
  if (!snapshot) snapshot = build(id, db);
  return snapshot;
}

/** Выбранная профессия; null — ещё не выбрана (показываем экран выбора). */
export function getProfessionSnapshot(): ProfessionId | null {
  return readProfession();
}

export function chooseProfession(id: ProfessionId) {
  try {
    localStorage.setItem(PROFESSION_KEY, id);
  } catch {}
  profession = id;
  db = null;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // Изменения в соседней вкладке.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== PROFESSION_KEY && !e.key.startsWith(KEY_PREFIX)) return;
    profession = undefined;
    db = null;
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function mutate(change: (s: Stored) => void) {
  const id = readProfession();
  if (!id) return;
  if (!db) db = load(id);
  change(db);
  persist(id, db);
  emit();
}

/** Вернуть исходные демо-данные текущей профессии. */
export function resetDemo() {
  const id = readProfession();
  if (!id) return;
  db = fresh(id, todayISO());
  persist(id, db);
  emit();
}

export function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}
