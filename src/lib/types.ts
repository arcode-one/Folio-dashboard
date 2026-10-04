export type Category = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  sort: number;
};

export type TransactionSource = "text" | "receipt" | "manual";

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  category_id: number | null;
  project_id: string | null;
  description: string | null;
  vendor: string | null;
  spent_at: string;
  source: TransactionSource;
  receipt_path: string | null;
  created_at: string;
};

export const PROJECT_STATUSES = ["new", "in_progress", "done", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  client: string;
  title: string;
  status: ProjectStatus;
  platform: string | null;
  price: number;
  commission: number;
  currency: string;
  deadline: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
};

/** Строка из view project_summary: проект + посчитанные суммы. */
export type ProjectSummary = Project & {
  received: number;
  prepaid: number;
  last_paid_at: string | null;
  costs: number;
};

export const NOTE_COLORS = ["none", "lime", "sky", "amber", "rose"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export type Note = {
  id: string;
  title: string | null;
  body: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentKind = "prepayment" | "payment";

export type Payment = {
  id: string;
  project_id: string | null;
  amount: number;
  currency: string;
  kind: PaymentKind;
  paid_at: string;
  note: string | null;
  created_at: string;
};
