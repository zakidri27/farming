import { db } from "@/db";
import {
  animals, contacts, purchases, sales, expenses, incomes,
  feedStock, feedTransactions, feedAllocations, healthRecords,
  debts, treasury, settings, births, productions, consumptions,
} from "@/db/schema";
import { sql, getTableName } from "drizzle-orm";

export const backupTables = {
  animals, contacts, purchases, sales, expenses, incomes,
  feedStock, feedTransactions, feedAllocations, healthRecords,
  debts, treasury, settings, births, productions, consumptions,
} as const;

export type BackupData = Record<string, Record<string, unknown>[]>;

const serialTables = [
  "animals", "contacts", "purchases", "sales", "expenses", "incomes",
  "feedStock", "feedTransactions", "feedAllocations", "healthRecords",
  "debts", "treasury", "settings", "births", "productions", "consumptions",
];

export async function exportAll(): Promise<BackupData> {
  const data: BackupData = {};
  for (const [name, table] of Object.entries(backupTables)) {
    data[name] = (await db.select().from(table as never)) as Record<string, unknown>[];
  }
  return data;
}

// Export serializes Dates to ISO strings — convert them back for timestamp columns
const ISO_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && ISO_DT.test(v)) {
      const d = new Date(v);
      out[k] = isNaN(d.getTime()) ? v : d;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function restoreAll(data: BackupData): Promise<void> {
  // Only touch tables actually present in the payload (partial imports must not wipe the rest)
  const names = Object.keys(backupTables).filter((n) => Array.isArray(data[n]));
  const real = (n: string) => getTableName(backupTables[n as keyof typeof backupTables] as never);
  const delOrder = [...names].reverse();
  const insOrder = names;

  await db.transaction(async (tx) => {
    for (const name of delOrder) {
      await tx.execute(sql.raw(`DELETE FROM "${real(name)}"`));
    }
    for (const name of insOrder) {
      const rows = data[name];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const table = backupTables[name as keyof typeof backupTables] as never;
      for (let i = 0; i < rows.length; i += 200) {
        await tx.insert(table).values(rows.slice(i, i + 200).map(normalizeRow) as never);
      }
    }
    for (const name of serialTables) {
      const t = real(name);
      await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('"${t}"','id'), COALESCE((SELECT MAX(id) FROM "${t}"), 0) + 1, false)`));
    }
  });
}
