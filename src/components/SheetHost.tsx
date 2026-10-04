"use client";

import { useCallback, useState } from "react";
import type { Category, Payment, ProjectSummary, Transaction } from "@/lib/types";
import { PaymentSheet } from "./PaymentSheet";
import { ProjectSheet } from "./ProjectSheet";
import { TransactionSheet } from "./TransactionSheet";

export type SheetState = (
  | { kind: "tx"; id: string | null; projectId?: string | null; categoryId?: number | null }
  | { kind: "payment"; id: string | null; projectId?: string | null }
  | { kind: "project"; id: string | null }
) & { back?: SheetState };

export type SheetData = {
  categories: Category[];
  projects: ProjectSummary[];
  payments: Payment[];
  transactions: Transaction[];
  currency: string;
  today: string;
};

export function useSheets() {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const close = useCallback(() => setSheet((s) => s?.back ?? null), []);
  return { sheet, open: setSheet, close };
}

/** Показывает нужную шторку. Данные берутся по id из свежих props, поэтому после сохранения цифры обновляются. */
export function SheetHost({ sheet, open, close, data }: ReturnType<typeof useSheets> & { data: SheetData }) {
  if (!sheet) return null;
  const key = `${sheet.kind}:${sheet.id ?? "new"}`;

  if (sheet.kind === "tx") {
    return (
      <TransactionSheet
        key={key}
        transaction={data.transactions.find((t) => t.id === sheet.id) ?? null}
        categories={data.categories}
        projects={data.projects}
        defaultCategoryId={sheet.categoryId}
        defaultProjectId={sheet.projectId}
        currency={data.currency}
        today={data.today}
        onClose={close}
      />
    );
  }

  if (sheet.kind === "payment") {
    return (
      <PaymentSheet
        key={key}
        payment={data.payments.find((p) => p.id === sheet.id) ?? null}
        projects={data.projects}
        defaultProjectId={sheet.projectId}
        currency={data.currency}
        today={data.today}
        onClose={close}
      />
    );
  }

  const project = data.projects.find((p) => p.id === sheet.id) ?? null;
  return (
    <ProjectSheet
      key={key}
      project={project}
      payments={project ? data.payments.filter((p) => p.project_id === project.id) : []}
      costs={project ? data.transactions.filter((t) => t.project_id === project.id) : []}
      today={data.today}
      onClose={close}
      onAddPayment={(projectId) => open({ kind: "payment", id: null, projectId, back: sheet })}
      onEditPayment={(p) => open({ kind: "payment", id: p.id, back: sheet })}
      onAddCost={(projectId) => open({ kind: "tx", id: null, projectId, back: sheet })}
      onEditCost={(t) => open({ kind: "tx", id: t.id, back: sheet })}
    />
  );
}
