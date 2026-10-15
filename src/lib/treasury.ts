import { db } from "@/db";
import { treasury, settings } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function getCapital(): Promise<number> {
  const rows = await db.select().from(settings).where(eq(settings.key, "initial_capital"));
  return parseFloat(rows[0]?.value || "0");
}

export async function setCapital(amount: string): Promise<void> {
  const existing = await db.select().from(settings).where(eq(settings.key, "initial_capital"));
  if (existing.length > 0) {
    await db.update(settings).set({ value: amount, updatedAt: new Date() }).where(eq(settings.key, "initial_capital"));
  } else {
    await db.insert(settings).values({ key: "initial_capital", value: amount });
  }
}

export interface TreasurySummary {
  capital: number;
  totalIn: number;
  totalOut: number;
  balance: number;
}

export async function getSummary(): Promise<TreasurySummary> {
  const capital = await getCapital();
  const inn = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(treasury).where(eq(treasury.type, "income"));
  const out = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(treasury).where(eq(treasury.type, "expense"));
  const totalIn = parseFloat(inn[0]?.total || "0");
  const totalOut = parseFloat(out[0]?.total || "0");
  return { capital, totalIn, totalOut, balance: capital + totalIn - totalOut };
}

export async function postEntry(e: {
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string;
  referenceType?: string | null;
  referenceId?: number | null;
  notes?: string | null;
}) {
  const [row] = await db
    .insert(treasury)
    .values({
      date: e.date,
      type: e.type,
      category: e.category,
      description: e.description,
      amount: e.amount,
      referenceType: e.referenceType || null,
      referenceId: e.referenceId || null,
      notes: e.notes || null,
    })
    .returning();
  return row;
}
