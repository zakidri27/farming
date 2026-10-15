// OFFLINE FOUNDATION (phase 1): SQLite mirror of the Postgres schema.
// Uses drizzle-orm/sqlite-core so the SAME queries run on-device.
// Phase 2 (not done): point pages at local-db instead of /api/* + static export.
// Enums -> text, numeric -> real, date/timestamp -> text (ISO strings),
// serial -> integer PK autoincrement.
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

const baseDates = {
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
};

export const animals = sqliteTable("animals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  breed: text("breed"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  weight: real("weight"),
  purchasePrice: real("purchase_price"),
  purchaseDate: text("purchase_date"),
  status: text("status").default("active"),
  teeth: text("teeth"),
  ageText: text("age_text"),
  lifeStage: text("life_stage").default("adult"),
  batchId: integer("batch_id"),
  purpose: text("purpose"),
  notes: text("notes"),
  tagNumber: text("tag_number"),
  motherAnimalId: integer("mother_animal_id"),
  ...baseDates,
});

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("both"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  unitPrice: real("unit_price"),
  totalAmount: real("total_amount").notNull(),
  supplierId: integer("supplier_id"),
  animalType: text("animal_type"),
  animalId: integer("animal_id"),
  paymentStatus: text("payment_status").default("paid"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  unitPrice: real("unit_price"),
  totalAmount: real("total_amount").notNull(),
  customerId: integer("customer_id"),
  animalType: text("animal_type"),
  animalId: integer("animal_id"),
  productType: text("product_type"),
  paymentStatus: text("payment_status").default("paid"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  animalType: text("animal_type"),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const incomes = sqliteTable("incomes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  animalType: text("animal_type"),
  customerId: integer("customer_id"),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const feedStock = sqliteTable("feed_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull().default("kg"),
  unitCost: real("unit_cost"),
  minQuantity: real("min_quantity").default(0),
  maxQuantity: real("max_quantity"),
  animalType: text("animal_type"),
  notes: text("notes"),
  updatedAt: text("updated_at"),
});

export const feedTransactions = sqliteTable("feed_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  feedId: integer("feed_id"),
  feedName: text("feed_name").notNull(),
  transactionType: text("transaction_type").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  cost: real("cost"),
  animalType: text("animal_type"),
  headcount: integer("headcount"),
  perHeadQty: real("per_head_qty"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const feedAllocations = sqliteTable("feed_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id"),
  animalId: integer("animal_id"),
  date: text("date").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  createdAt: text("created_at"),
});

export const healthRecords = sqliteTable("health_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  animalId: integer("animal_id"),
  animalType: text("animal_type"),
  recordType: text("record_type").notNull(),
  description: text("description").notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  medicine: text("medicine"),
  medicineCost: real("medicine_cost"),
  vetName: text("vet_name"),
  vetCost: real("vet_cost"),
  totalCost: real("total_cost"),
  nextVisitDate: text("next_visit_date"),
  status: text("status").default("healthy"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const debts = sqliteTable("debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  contactId: integer("contact_id"),
  contactName: text("contact_name").notNull(),
  description: text("description").notNull(),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").default(0),
  dueDate: text("due_date"),
  status: text("status").default("pending"),
  notes: text("notes"),
  ...baseDates,
});

export const treasury = sqliteTable("treasury", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  balance: real("balance"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: text("updated_at"),
});

export const births = sqliteTable("births", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  motherId: integer("mother_id"),
  fatherId: integer("father_id"),
  motherName: text("mother_name"),
  fatherName: text("father_name"),
  childName: text("child_name").notNull(),
  childType: text("child_type").notNull(),
  childGender: text("child_gender"),
  childBreed: text("child_breed"),
  birthWeight: real("birth_weight"),
  childAnimalId: integer("child_animal_id"),
  batchName: text("batch_name"),
  quantity: real("quantity").default(1),
  status: text("status").default("alive"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const productions = sqliteTable("productions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  animalId: integer("animal_id"),
  animalName: text("animal_name"),
  animalType: text("animal_type"),
  productType: text("product_type").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull().default("kg"),
  unitPrice: real("unit_price"),
  totalValue: real("total_value"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const consumptions = sqliteTable("consumptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  productType: text("product_type").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull().default("kg"),
  reason: text("reason").notNull(),
  notes: text("notes"),
  createdAt: text("created_at"),
});
