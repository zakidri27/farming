// OFFLINE LAYER (phase 2): on-device SQLite through @capacitor-community/sqlite.
// This is the client-side replacement for PostgreSQL + Drizzle.
// - camelCase column params (Postgres / Drizzle style) <-> snake_case SQL columns.
// - Starts empty; the user adds all data through the app UI.
// - Only safe to call from client code (window/Capacitor must exist).
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";

export const DB_NAME = "farm_local";

const TABLE_NAMES = [
  "animals", "contacts", "purchases", "sales", "expenses", "incomes",
  "feed_stock", "feed_transactions", "feed_allocations", "health_records",
  "debts", "treasury", "settings", "births", "productions", "consumptions",
] as const;
export type TableName = (typeof TABLE_NAMES)[number];

// camelCase table keys used by the backup format
export const BACKUP_KEYS = [
  "animals", "contacts", "purchases", "sales", "expenses", "incomes",
  "feedStock", "feedTransactions", "feedAllocations", "healthRecords",
  "debts", "treasury", "settings", "births", "productions", "consumptions",
] as const;
type BackupKey = (typeof BACKUP_KEYS)[number];

const TABLE_DDL: Record<TableName, string> = {
  animals: `CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    breed TEXT,
    birth_date TEXT,
    gender TEXT,
    weight REAL,
    purchase_price REAL,
    purchase_date TEXT,
    status TEXT DEFAULT 'active',
    teeth TEXT,
    age_text TEXT,
    life_stage TEXT DEFAULT 'adult',
    batch_id INTEGER,
    purpose TEXT,
    notes TEXT,
    tag_number TEXT,
    mother_animal_id INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,
  contacts: `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'both',
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT
  )`,
  purchases: `CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    unit_price REAL,
    total_amount REAL NOT NULL,
    supplier_id INTEGER,
    animal_type TEXT,
    animal_id INTEGER,
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    created_at TEXT
  )`,
  sales: `CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    unit_price REAL,
    total_amount REAL NOT NULL,
    customer_id INTEGER,
    animal_type TEXT,
    animal_id INTEGER,
    product_type TEXT,
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    created_at TEXT
  )`,
  expenses: `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    animal_type TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT
  )`,
  incomes: `CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    animal_type TEXT,
    customer_id INTEGER,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TEXT
  )`,
  feed_stock: `CREATE TABLE IF NOT EXISTS feed_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    unit_cost REAL,
    min_quantity REAL DEFAULT 0,
    max_quantity REAL,
    animal_type TEXT,
    notes TEXT,
    updated_at TEXT
  )`,
  feed_transactions: `CREATE TABLE IF NOT EXISTS feed_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    feed_id INTEGER,
    feed_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    cost REAL,
    animal_type TEXT,
    headcount INTEGER,
    per_head_qty REAL,
    notes TEXT,
    created_at TEXT
  )`,
  feed_allocations: `CREATE TABLE IF NOT EXISTS feed_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    animal_id INTEGER,
    date TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    created_at TEXT
  )`,
  health_records: `CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    animal_id INTEGER,
    animal_type TEXT,
    record_type TEXT NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    medicine TEXT,
    medicine_cost REAL,
    vet_name TEXT,
    vet_cost REAL,
    total_cost REAL,
    next_visit_date TEXT,
    status TEXT DEFAULT 'healthy',
    notes TEXT,
    created_at TEXT
  )`,
  debts: `CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    contact_id INTEGER,
    contact_name TEXT NOT NULL,
    description TEXT NOT NULL,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    due_date TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,
  treasury: `CREATE TABLE IF NOT EXISTS treasury (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    balance REAL,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    created_at TEXT
  )`,
  settings: `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TEXT
  )`,
  births: `CREATE TABLE IF NOT EXISTS births (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    mother_id INTEGER,
    father_id INTEGER,
    mother_name TEXT,
    father_name TEXT,
    child_name TEXT NOT NULL,
    child_type TEXT NOT NULL,
    child_gender TEXT,
    child_breed TEXT,
    birth_weight REAL,
    child_animal_id INTEGER,
    batch_name TEXT,
    quantity REAL DEFAULT 1,
    status TEXT DEFAULT 'alive',
    notes TEXT,
    created_at TEXT
  )`,
  productions: `CREATE TABLE IF NOT EXISTS productions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    animal_id INTEGER,
    animal_name TEXT,
    animal_type TEXT,
    product_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    unit_price REAL,
    total_value REAL,
    notes TEXT,
    created_at TEXT
  )`,
  consumptions: `CREATE TABLE IF NOT EXISTS consumptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    product_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TEXT
  )`,
};

// camelCase column whitelist per table (mirrors TABLE_DDL). Used by restoreAll
// so an import can never fail because a payload contains an unknown column.
export const TABLE_COLUMNS: Record<TableName, string[]> = {
  animals: ["id", "name", "type", "breed", "birthDate", "gender", "weight", "purchasePrice", "purchaseDate", "status", "teeth", "ageText", "lifeStage", "batchId", "purpose", "notes", "tagNumber", "motherAnimalId", "createdAt", "updatedAt"],
  contacts: ["id", "name", "type", "phone", "email", "address", "notes", "createdAt"],
  purchases: ["id", "date", "category", "description", "quantity", "unit", "unitPrice", "totalAmount", "supplierId", "animalType", "animalId", "paymentStatus", "notes", "createdAt"],
  sales: ["id", "date", "category", "description", "quantity", "unit", "unitPrice", "totalAmount", "customerId", "animalType", "animalId", "productType", "paymentStatus", "notes", "createdAt"],
  expenses: ["id", "date", "category", "description", "amount", "animalType", "paymentMethod", "notes", "createdAt"],
  incomes: ["id", "date", "category", "description", "amount", "animalType", "customerId", "paymentMethod", "notes", "createdAt"],
  feed_stock: ["id", "name", "type", "quantity", "unit", "unitCost", "minQuantity", "maxQuantity", "animalType", "notes", "updatedAt"],
  feed_transactions: ["id", "date", "feedId", "feedName", "transactionType", "quantity", "unit", "cost", "animalType", "headcount", "perHeadQty", "notes", "createdAt"],
  feed_allocations: ["id", "transactionId", "animalId", "date", "quantity", "unit", "createdAt"],
  health_records: ["id", "date", "animalId", "animalType", "recordType", "description", "diagnosis", "treatment", "medicine", "medicineCost", "vetName", "vetCost", "totalCost", "nextVisitDate", "status", "notes", "createdAt"],
  debts: ["id", "date", "type", "contactId", "contactName", "description", "totalAmount", "paidAmount", "dueDate", "status", "notes", "createdAt", "updatedAt"],
  treasury: ["id", "date", "type", "category", "description", "amount", "balance", "referenceType", "referenceId", "notes", "createdAt"],
  settings: ["id", "key", "value", "updatedAt"],
  births: ["id", "date", "motherId", "fatherId", "motherName", "fatherName", "childName", "childType", "childGender", "childBreed", "birthWeight", "childAnimalId", "batchName", "quantity", "status", "notes", "createdAt"],
  productions: ["id", "date", "animalId", "animalName", "animalType", "productType", "quantity", "unit", "unitPrice", "totalValue", "notes", "createdAt"],
  consumptions: ["id", "date", "productType", "quantity", "unit", "reason", "notes", "createdAt"],
};

export const snakeToTable: Record<BackupKey, TableName> = {
  animals: "animals",
  contacts: "contacts",
  purchases: "purchases",
  sales: "sales",
  expenses: "expenses",
  incomes: "incomes",
  feedStock: "feed_stock",
  feedTransactions: "feed_transactions",
  feedAllocations: "feed_allocations",
  healthRecords: "health_records",
  debts: "debts",
  treasury: "treasury",
  settings: "settings",
  births: "births",
  productions: "productions",
  consumptions: "consumptions",
};
export const tableToSnake: Record<TableName, BackupKey> = Object.fromEntries(
  Object.entries(snakeToTable).map(([k, v]) => [v, k as BackupKey])
) as Record<TableName, BackupKey>;

export function snakeCase(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
}
export function camelCase(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function nowIso(): string {
  return new Date().toISOString();
}
export function todayIso(): string {
  return nowIso().slice(0, 10);
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------
// Connection management (only meaningful inside a Capacitor native WebView)
// ---------------------------------------------------------------------------
let sqlite: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
let initPromise: Promise<void> | null = null;

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return typeof w.Capacitor?.isNativePlatform === "function"
    ? w.Capacitor.isNativePlatform()
    : false;
}

async function getDb(): Promise<SQLiteDBConnection> {
  if (!sqlite) sqlite = new SQLiteConnection(CapacitorSQLite);
  if (db) return db;
  const exists = await sqlite.isConnection(DB_NAME, false);
  if (exists.result) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
  }
  await db.open();
  return db;
}

export function initOfflineDB(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const conn = await getDb();
      for (const t of TABLE_NAMES) {
        await conn.execute(TABLE_DDL[t]);
      }
    })().catch((e) => {
      initPromise = null; // allow retry on next fetch
      throw e;
    });
  }
  return initPromise;
}

export async function closeOfflineDB(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
  initPromise = null;
}

export async function isDBReady(): Promise<boolean> {
  if (initPromise) {
    await initPromise;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Generic query helpers (camelCase in/out)
// ---------------------------------------------------------------------------
export async function queryRows<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const conn = await getDb();
  const res = await conn.query(sql);
  const rows = (res.values ?? []) as Record<string, unknown>[];
  return rows.map((r) => {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(r)) o[camelCase(k)] = r[k];
    return o as unknown as T;
  });
}

export async function runSql(sql: string): Promise<number> {
  const conn = await getDb();
  const res = await conn.run(sql);
  return res.changes?.changes ?? 0;
}

// Insert a camelCase row; returns the new id.
export async function insertRow(table: TableName, data: Record<string, unknown>): Promise<number> {
  const cols: string[] = [];
  const vals: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    cols.push(snakeCase(k));
    vals.push(esc(v));
  }
  await runSql(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")})`);
  const rows = await queryRows<{ id: number }>("SELECT last_insert_rowid() AS id");
  return rows[0]?.id ?? 0;
}

export async function getById(table: TableName, id: number): Promise<Record<string, unknown> | undefined> {
  const rows = await queryRows(`SELECT * FROM ${table} WHERE id = ${esc(id)} LIMIT 1`);
  return rows[0] as Record<string, unknown> | undefined;
}

export async function updateById(
  table: TableName,
  id: number,
  data: Record<string, unknown>
): Promise<void> {
  const sets: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    sets.push(`${snakeCase(k)} = ${esc(v)}`);
  }
  if (sets.length === 0) return;
  await runSql(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ${esc(id)}`);
}

export async function deleteById(table: TableName, id: number): Promise<void> {
  await runSql(`DELETE FROM ${table} WHERE id = ${esc(id)}`);
}

// Wipe every table so the app is empty, as on first use.
export async function resetAllData(): Promise<void> {
  const conn = await getDb();
  for (const t of TABLE_NAMES) {
    await conn.execute(`DELETE FROM ${t}`);
  }
}

// ---------------------------------------------------------------------------
// Backup / restore (mirror of src/lib/backup.ts, but local)
// ---------------------------------------------------------------------------
export type BackupData = Record<string, Record<string, unknown>[]>;

export async function exportAll(): Promise<BackupData> {
  const data: BackupData = {};
  for (const key of BACKUP_KEYS) {
    const table = snakeToTable[key as BackupKey];
    data[key] = await queryRows(`SELECT * FROM ${table}`);
  }
  return data;
}

export async function restoreAll(data: BackupData): Promise<void> {
  const present = BACKUP_KEYS.filter((k) => Array.isArray(data[k])) as BackupKey[];
  for (const key of [...present].reverse()) {
    const table = snakeToTable[key];
    await runSql(`DELETE FROM ${table}`);
  }
  for (const key of present) {
    const rows = data[key] as Record<string, unknown>[];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const table = snakeToTable[key];
    const allowed = TABLE_COLUMNS[table];
    for (const row of rows) {
      const cols: string[] = [];
      const vals: string[] = [];
      for (const [k, v] of Object.entries(row)) {
        if (v === undefined || v === null) continue;
        if (!allowed.includes(k)) continue;
        cols.push(snakeCase(k));
        vals.push(esc(v));
      }
      if (cols.length === 0) continue;
      await runSql(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Treasury helpers (mirror of src/lib/treasury.ts)
// ---------------------------------------------------------------------------
export interface TreasurySummary {
  capital: number;
  totalIn: number;
  totalOut: number;
  balance: number;
}

export async function getCapital(): Promise<number> {
  const rows = await queryRows<{ value: string | null }>(
    `SELECT value FROM settings WHERE key = 'initial_capital' LIMIT 1`
  );
  return parseFloat(rows[0]?.value || "0") || 0;
}

export async function setCapital(amount: string): Promise<void> {
  const rows = await queryRows(`SELECT id FROM settings WHERE key = 'initial_capital' LIMIT 1`);
  if (rows.length > 0) {
    await runSql(`UPDATE settings SET value = ${esc(amount)}, updated_at = ${esc(nowIso())} WHERE key = 'initial_capital'`);
  } else {
    await runSql(`INSERT INTO settings (key, value, updated_at) VALUES ('initial_capital', ${esc(amount)}, ${esc(nowIso())})`);
  }
}

export async function getSummary(): Promise<TreasurySummary> {
  const capital = await getCapital();
  const inn = await queryRows<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM treasury WHERE type = 'income'`
  );
  const out = await queryRows<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM treasury WHERE type = 'expense'`
  );
  const totalIn = inn[0]?.total ?? 0;
  const totalOut = out[0]?.total ?? 0;
  return { capital, totalIn, totalOut, balance: capital + totalIn - totalOut };
}

export async function postEntry(e: {
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string | number;
  referenceType?: string | null;
  referenceId?: number | null;
  notes?: string | null;
}): Promise<Record<string, unknown>> {
  const amount = typeof e.amount === "string" ? parseFloat(e.amount) : e.amount;
  const id = await insertRow("treasury", {
    date: e.date,
    type: e.type,
    category: e.category,
    description: e.description,
    amount,
    referenceType: e.referenceType || null,
    referenceId: e.referenceId || null,
    notes: e.notes || null,
    createdAt: nowIso(),
  });
  const row = await getById("treasury", id);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row ?? {})) out[camelCase(k)] = v;
  return out;
}