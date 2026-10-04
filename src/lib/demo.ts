import type { Category, Note, Payment, Project, Transaction } from "./types";

// Сборка стартовых демо-данных из описания профессии (lib/seeds.ts).
// Все даты считаются от «сегодня», поэтому демо всегда выглядит свежим. Клиенты и суммы вымышленные.

export const DEMO_CATEGORIES: Category[] = [
  ["Работа", "💼", "#2f5bff"],
  ["Продукты", "🛒", "#22c55e"],
  ["Кафе и рестораны", "☕", "#f97316"],
  ["Транспорт", "🚕", "#eab308"],
  ["Авто", "⛽", "#64748b"],
  ["Дом и ЖКХ", "🏠", "#0ea5e9"],
  ["Связь и интернет", "📱", "#6366f1"],
  ["Здоровье", "💊", "#ef4444"],
  ["Одежда и обувь", "👕", "#ec4899"],
  ["Красота", "💅", "#d946ef"],
  ["Развлечения", "🎬", "#a855f7"],
  ["Подписки", "🔁", "#8b5cf6"],
  ["Образование", "📚", "#14b8a6"],
  ["Подарки", "🎁", "#f43f5e"],
  ["Путешествия", "✈️", "#06b6d4"],
  ["Другое", "📦", "#94a3b8"],
].map(([name, emoji, color], i) => ({ id: i + 1, name, emoji, color, sort: i }));

const CAT = Object.fromEntries(DEMO_CATEGORIES.map((c) => [c.name, c.id]));

export type DemoProject = {
  client: string;
  title: string;
  status: Project["status"];
  platform: string | null;
  price: number;
  commission: number;
  /** [дней назад, сумма, предоплата?] */
  payments: [number, number, boolean?][];
  /** [дней назад, сумма, описание] */
  costs: [number, number, string][];
  startedDaysAgo: number;
  deadlineInDays?: number;
  notes?: string;
  /** Взят в этом месяце: даты прижимаются к началу месяца, чтобы вкладка «месяц» не пустовала первого числа */
  thisMonth?: boolean;
};

/** [дней назад, категория, описание, продавец, сумма, чек?] */
export type ExpenseRow = [number, string, string, string | null, number, boolean?];

export type SeedSpec = {
  projects: DemoProject[];
  /** Доход без привязки: [дней назад, сумма, комментарий] */
  income?: [number, number, string][];
  /** Регулярный доход без привязки: каждые `every` дней, начиная с `from` дней назад */
  recurring?: { amount: number; note: string; every: number; from: number }[];
  /** Рабочие траты, которые повторяются каждый месяц */
  work: ExpenseRow[];
  /** Разовые крупные траты */
  oneOff: ExpenseRow[];
  /** [заголовок, текст, цвет, закреплена, дней назад] */
  notes: [string | null, string, Note["color"], boolean, number][];
  goal: number;
};

/** Личные траты — одинаковые для всех профессий, повторяются каждый месяц. */
const PERSONAL: ExpenseRow[] = [
  [0, "Кафе и рестораны", "Капучино", "Кофемания", 290],
  [0, "Транспорт", "Такси", "Яндекс Go", 520],
  [1, "Продукты", "Продукты на неделю", "Перекрёсток", 4870.4, true],
  [2, "Кафе и рестораны", "Обед", null, 950],
  [3, "Здоровье", "Витамины", "Аптека 36,6", 940, true],
  [4, "Развлечения", "Кино", "Синема Парк", 860],
  [5, "Продукты", "Фрукты и овощи", "ВкусВилл", 1380],
  [6, "Авто", "Бензин", "Газпромнефть", 3200],
  [8, "Дом и ЖКХ", "Коммунальные платежи", null, 6780],
  [9, "Связь и интернет", "Мобильная связь и интернет", "Билайн", 890],
  [10, "Подписки", "Музыка и кино", "Яндекс Плюс", 449],
  [11, "Одежда и обувь", "Худи", "Lamoda", 4490, true],
  [16, "Подарки", "Цветы маме", null, 2500],
  [19, "Продукты", "Продукты", "Лента", 3640.9],
  [22, "Красота", "Стрижка", null, 1500],
  [25, "Кафе и рестораны", "Ужин с друзьями", null, 2700],
];

// Повторяем типичный месяц в прошлых месяцах, чтобы на графиках было что показать.
const PAST_MONTH_SCALE = [0.92, 1.12, 0.84, 1.05, 0.96, 0.74, 1.18, 0.88, 1, 0.79, 1.08, 0.9];

export function daysAgo(today: string, n: number) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const uid = (group: string, n: number) => `00000000-0000-4000-${group}-${String(n).padStart(12, "0")}`;

export type DemoDB = {
  categories: Category[];
  projects: Project[];
  payments: Payment[];
  transactions: Transaction[];
  notes: Note[];
  goal: number | null;
};

export function buildSeed(today: string, spec: SeedSpec): DemoDB {
  const projects: Project[] = [];
  const payments: Payment[] = [];
  const transactions: Transaction[] = [];
  const dayOfMonth = Number(today.slice(8, 10));

  spec.projects.forEach((raw, i) => {
    const id = uid("8000", i + 1);
    const start = raw.thisMonth ? Math.min(raw.startedDaysAgo, dayOfMonth - 1) : raw.startedDaysAgo;
    const clamp = <T extends [number, ...unknown[]]>(x: T): T => [Math.min(x[0], start), ...x.slice(1)] as T;
    const p = { ...raw, startedDaysAgo: start, payments: raw.payments.map(clamp), costs: raw.costs.map(clamp) };
    projects.push({
      id,
      client: p.client,
      title: p.title,
      status: p.status,
      platform: p.platform,
      price: p.price,
      commission: p.commission,
      currency: "RUB",
      deadline: p.deadlineInDays ? daysAgo(today, -p.deadlineInDays) : null,
      completed_at: p.status === "done" ? daysAgo(today, p.payments.at(-1)?.[0] ?? 0) : null,
      notes: p.notes ?? null,
      created_at: `${daysAgo(today, p.startedDaysAgo)}T10:00:00Z`,
    });
    p.payments.forEach(([ago, amount, prepay], j) =>
      payments.push({
        id: uid("b000", i * 100 + j),
        project_id: id,
        amount,
        currency: "RUB",
        kind: prepay ? "prepayment" : "payment",
        paid_at: daysAgo(today, ago),
        note: null,
        created_at: `${daysAgo(today, ago)}T12:00:00Z`,
      }),
    );
    p.costs.forEach(([ago, amount, description], j) =>
      transactions.push({
        id: uid("c000", i * 100 + j),
        amount,
        currency: "RUB",
        category_id: CAT["Работа"],
        project_id: id,
        description,
        vendor: null,
        spent_at: daysAgo(today, ago),
        source: "manual",
        receipt_path: null,
        created_at: `${daysAgo(today, ago)}T09:00:00Z`,
      }),
    );
  });

  const income: [number, number, string][] = [...(spec.income ?? [])];
  for (const r of spec.recurring ?? []) {
    for (let ago = r.from; ago < 365; ago += r.every) income.push([ago, r.amount, r.note]);
  }
  income.forEach(([ago, amount, note], i) =>
    payments.push({
      id: uid("d000", i + 1),
      project_id: null,
      amount,
      currency: "RUB",
      kind: "payment",
      paid_at: daysAgo(today, ago),
      note,
      created_at: `${daysAgo(today, ago)}T11:00:00Z`,
    }),
  );

  const monthly = [...PERSONAL, ...spec.work];
  [1, ...PAST_MONTH_SCALE].forEach((scale, month) => {
    monthly.forEach(([ago, category, description, vendor, amount, receipt], i) => {
      const day = daysAgo(today, ago + month * 30);
      transactions.push({
        id: uid("9000", month * 100 + i),
        amount: Math.round(amount * scale * 100) / 100,
        currency: "RUB",
        category_id: CAT[category],
        project_id: null,
        description,
        vendor,
        spent_at: day,
        source: receipt ? "receipt" : "manual",
        receipt_path: null,
        created_at: `${day}T08:00:00Z`,
      });
    });
  });

  spec.oneOff.forEach(([ago, category, description, vendor, amount], i) =>
    transactions.push({
      id: uid("e000", i + 1),
      amount,
      currency: "RUB",
      category_id: CAT[category],
      project_id: null,
      description,
      vendor,
      spent_at: daysAgo(today, ago),
      source: "manual",
      receipt_path: null,
      created_at: `${daysAgo(today, ago)}T15:00:00Z`,
    }),
  );

  const at = (n: number) => `${daysAgo(today, n)}T09:00:00Z`;
  const notes: Note[] = spec.notes.map(([title, body, color, pinned, ago], i) => ({
    id: uid("a000", i + 1),
    title,
    body,
    color,
    pinned,
    created_at: at(ago + 2),
    updated_at: at(ago),
  }));

  return { categories: DEMO_CATEGORIES, projects, payments, transactions, notes, goal: spec.goal };
}
