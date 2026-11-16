import { randomUUID } from "node:crypto";

export type RecordType = "income" | "expense";

export interface Record {
  id: string;
  type: RecordType;
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordInput {
  type: RecordType;
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface RecordUpdates {
  type?: RecordType;
  amount?: number;
  category?: string;
  note?: string;
  date?: string;
}

export interface RecordSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

const records: Record[] = [];

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function listRecords(): Record[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function findRecord(id: string): Record | undefined {
  return records.find((record) => record.id === id);
}

export function createRecord(input: RecordInput): Record {
  const now = new Date().toISOString();
  const record: Record = {
    id: randomUUID(),
    type: input.type,
    amount: roundAmount(input.amount),
    category: input.category,
    note: input.note ?? "",
    date: input.date,
    createdAt: now,
    updatedAt: now,
  };
  records.unshift(record);
  return record;
}

export function updateRecord(id: string, updates: RecordUpdates): Record | undefined {
  const record = findRecord(id);
  if (!record) return undefined;
  if (updates.type !== undefined) record.type = updates.type;
  if (updates.amount !== undefined) record.amount = roundAmount(updates.amount);
  if (updates.category !== undefined) record.category = updates.category;
  if (updates.note !== undefined) record.note = updates.note;
  if (updates.date !== undefined) record.date = updates.date;
  record.updatedAt = new Date().toISOString();
  return record;
}

export function deleteRecord(id: string): boolean {
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  return true;
}

export function summarizeRecords(): RecordSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const record of records) {
    if (record.type === "income") {
      totalIncome += record.amount;
    } else {
      totalExpense += record.amount;
    }
  }
  return {
    totalIncome: roundAmount(totalIncome),
    totalExpense: roundAmount(totalExpense),
    balance: roundAmount(totalIncome - totalExpense),
    count: records.length,
  };
}
