import { Router } from "express";
import { Prisma, type RecordType } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

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

function formatRecord(record: {
  id: string;
  type: RecordType;
  amount: Prisma.Decimal;
  category: string;
  note: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    type: record.type,
    amount: Number(record.amount),
    category: record.category,
    note: record.note,
    date: record.date.toISOString().slice(0, 10),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

recordsRouter.get("/", async (_req, res, next) => {
  try {
    const records = await prisma.record.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    res.json({ items: records.map(formatRecord) });
  } catch (error) {
    next(error);
  }
});

recordsRouter.get("/summary", async (_req, res, next) => {
  try {
    const groups = await prisma.record.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: { _all: true },
    });
    const income = groups.find((group) => group.type === "income");
    const expense = groups.find((group) => group.type === "expense");
    const totalIncome = Number(income?._sum.amount ?? 0);
    const totalExpense = Number(expense?._sum.amount ?? 0);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: (income?._count._all ?? 0) + (expense?._count._all ?? 0),
    });
  } catch (error) {
    next(error);
  }
});

recordsRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const errors: string[] = [];

    if (!isValidType(body.type)) errors.push("type 必须是 income 或 expense");
    if (!isValidAmount(body.amount)) errors.push("amount 必须是大于 0 的数字");
    if (typeof body.category !== "string" || body.category.trim().length === 0) {
      errors.push("category 不能为空");
    }
    if (body.category && body.category.length > 64) errors.push("category 最长 64 个字符");
    if (!isValidDate(body.date)) errors.push("date 必须是 YYYY-MM-DD 格式");
    if (body.note !== undefined && typeof body.note !== "string") errors.push("note 必须是字符串");
    if (typeof body.note === "string" && body.note.length > 500) errors.push("note 最长 500 个字符");

    if (errors.length > 0) {
      res.status(400).json({ message: errors.join("；") });
      return;
    }

    const record = await prisma.record.create({
      data: {
        type: body.type,
        amount: body.amount,
        category: body.category.trim(),
        note: typeof body.note === "string" ? body.note.trim() : "",
        date: new Date(`${body.date}T00:00:00.000Z`),
      },
    });

    res.status(201).json({ item: formatRecord(record) });
  } catch (error) {
    next(error);
  }
});

recordsRouter.patch("/:id", async (req, res, next) => {
  try {
    const record = await prisma.record.findUnique({ where: { id: req.params.id } });

    if (!record) {
      res.status(404).json({ message: "记录不存在" });
      return;
    }

    const body = req.body ?? {};
    const updates: Prisma.RecordUpdateInput = {};
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
      if (body.category.length > 64) {
        res.status(400).json({ message: "category 最长 64 个字符" });
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
      if (body.note.length > 500) {
        res.status(400).json({ message: "note 最长 500 个字符" });
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
      updates.date = new Date(`${body.date}T00:00:00.000Z`);
      hasUpdate = true;
    }

    if (!hasUpdate) {
      res.status(400).json({ message: "至少提供一个可更新字段" });
      return;
    }

    const updated = await prisma.record.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ item: formatRecord(updated) });
  } catch (error) {
    next(error);
  }
});

recordsRouter.delete("/:id", async (req, res, next) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!record) {
      res.status(404).json({ message: "记录不存在" });
      return;
    }

    await prisma.record.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
