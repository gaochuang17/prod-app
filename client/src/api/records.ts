import { apiClient } from "./client";

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

export interface RecordListResponse {
  items: Record[];
}

export interface RecordSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

export interface RecordInput {
  type: RecordType;
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export type RecordUpdates = Partial<RecordInput>;

export async function fetchRecords(): Promise<Record[]> {
  const res = await apiClient.get<RecordListResponse>("/records");
  return res.data.items;
}

export async function fetchSummary(): Promise<RecordSummary> {
  const res = await apiClient.get<RecordSummary>("/records/summary");
  return res.data;
}

export async function createRecord(input: RecordInput): Promise<Record> {
  const res = await apiClient.post<{ item: Record }>("/records", input);
  return res.data.item;
}

export async function updateRecord(
  id: string,
  updates: RecordUpdates,
): Promise<Record> {
  const res = await apiClient.patch<{ item: Record }>(`/records/${id}`, updates);
  return res.data.item;
}

export async function deleteRecord(id: string): Promise<void> {
  await apiClient.delete(`/records/${id}`);
}
