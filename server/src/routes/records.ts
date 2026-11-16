import { Router } from "express";
import {
  createRecord,
  deleteRecord,
  findRecord,
  listRecords,
  summarizeRecords,
  updateRecord,
  type RecordType,
  type RecordUpdates,
} from "../lib/records.js";

export const recordsRouter = Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidType(value: unknown): value is RecordType {
  return value === "income" || value === "expense";
}

function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

recordsRouter.get("/", (_req, res) => {
  res.json({ items: listRecords() });
});

recordsRouter.get("/summary", (_req, res) => {
  res.json(summarizeRecords());
});

recordsRouter.post("/", (req, res) => {
  const body = req.body ?? {};
  const errors: string[] = [];
  if (!isValidType(body.type)) errors.push("type 必须是 income 或 expense");
  if (!isValidAmount(body.amount)) errors.push("amount 必须是大于 0 的数字");
  if (typeof body.category !== "string" || body.category.trim().length === 0) {
    errors.push("category 不能为空");
  }
  if (!isValidDate(body.date)) errors.push("date 必须是 YYYY-MM-DD 格式");
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join("；") });
    return;
  }

  const record = createRecord({
    type: body.type,
    amount: body.amount,
    category: body.category.trim(),
    note: typeof body.note === "string" ? body.note.trim() : "",
    date: body.date,
  });
  res.status(201).json({ item: record });
});

recordsRouter.patch("/:id", (req, res) => {
  const record = findRecord(req.params.id);
  if (!record) {
    res.status(404).json({ message: "记录不存在" });
    return;
  }

  const body = req.body ?? {};
  const updates: RecordUpdates = {};
  let hasUpdate = false;

  if (body.type !== undefined) {
    if (!isValidType(body.type)) {
      res.status(400).json({ message: "type 必须是 income 或 expense" });
      return;
    }
    updates.type = body.type;
    hasUpdate = true;
  }
  if (body.amount !== undefined) {
    if (!isValidAmount(body.amount)) {
      res.status(400).json({ message: "amount 必须是大于 0 的数字" });
      return;
    }
    updates.amount = body.amount;
    hasUpdate = true;
  }
  if (body.category !== undefined) {
    if (typeof body.category !== "string" || body.category.trim().length === 0) {
      res.status(400).json({ message: "category 不能为空" });
      return;
    }
    updates.category = body.category.trim();
    hasUpdate = true;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== "string") {
      res.status(400).json({ message: "note 必须是字符串" });
      return;
    }
    updates.note = body.note.trim();
    hasUpdate = true;
  }
  if (body.date !== undefined) {
    if (!isValidDate(body.date)) {
      res.status(400).json({ message: "date 必须是 YYYY-MM-DD 格式" });
      return;
    }
    updates.date = body.date;
    hasUpdate = true;
  }

  if (!hasUpdate) {
    res.status(400).json({ message: "至少提供一个可更新字段" });
    return;
  }

  res.json({ item: updateRecord(req.params.id, updates) });
});

recordsRouter.delete("/:id", (req, res) => {
  const removed = deleteRecord(req.params.id);
  if (!removed) {
    res.status(404).json({ message: "记录不存在" });
    return;
  }
  res.status(204).send();
});
