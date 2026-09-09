import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  date,
  boolean,
} from "drizzle-orm/pg-core";

// Enums
export const animalTypeEnum = pgEnum("animal_type", [
  "cow",
  "goat",
  "sheep",
  "chicken",
  "quail",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "sale",
  "expense",
  "income",
]);

export const healthStatusEnum = pgEnum("health_status", [
  "healthy",
  "sick",
  "treatment",
  "recovered",
  "dead",
]);

export const debtTypeEnum = pgEnum("debt_type", ["owed_to_us", "we_owe"]);

export const debtStatusEnum = pgEnum("debt_status", [
  "pending",
  "partial",
  "paid",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "customer",
  "supplier",
  "both",
]);

// Animals table
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: animalTypeEnum("type").notNull(),
  breed: text("breed"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  weight: numeric("weight", { precision: 10, scale: 2 }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  purchaseDate: date("purchase_date"),
  status: text("status").default("active"),
  notes: text("notes"),
  tagNumber: text("tag_number"),
  motherAnimalId: integer("mother_animal_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts (customers & suppliers)
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: contactTypeEnum("type").notNull().default("both"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchases
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: text("category").notNull(), // animal, feed, equipment, medicine, other
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  supplierId: integer("supplier_id").references(() => contacts.id),
  animalType: animalTypeEnum("animal_type"),
  animalId: integer("animal_id").references(() => animals.id),
  paymentStatus: text("payment_status").default("paid"), // paid, pending, partial
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: text("category").notNull(), // animal, milk, eggs, meat, wool, other
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerId: integer("customer_id").references(() => contacts.id),
  animalType: animalTypeEnum("animal_type"),
  animalId: integer("animal_id").references(() => animals.id),
  paymentStatus: text("payment_status").default("paid"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses (general)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: text("category").notNull(), // salary, electricity, water, maintenance, transport, other
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  animalType: animalTypeEnum("animal_type"),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Income (general)
export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: text("category").notNull(), // milk, eggs, meat, wool, manure, other
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  animalType: animalTypeEnum("animal_type"),
  customerId: integer("customer_id").references(() => contacts.id),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feed management
export const feedStock = pgTable("feed_stock", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // hay, grain, concentrate, supplement, other
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("kg"),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  minQuantity: numeric("min_quantity", { precision: 10, scale: 2 }).default("0"),
  animalType: animalTypeEnum("animal_type"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedTransactions = pgTable("feed_transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  feedId: integer("feed_id").references(() => feedStock.id),
  feedName: text("feed_name").notNull(),
  transactionType: text("transaction_type").notNull(), // in, out
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  animalType: animalTypeEnum("animal_type"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health records
export const healthRecords = pgTable("health_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  animalId: integer("animal_id").references(() => animals.id),
  animalType: animalTypeEnum("animal_type"),
  recordType: text("record_type").notNull(), // vaccination, treatment, checkup, deworming, other
  description: text("description").notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  medicine: text("medicine"),
  medicineCost: numeric("medicine_cost", { precision: 10, scale: 2 }),
  vetName: text("vet_name"),
  vetCost: numeric("vet_cost", { precision: 10, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  nextVisitDate: date("next_visit_date"),
  status: healthStatusEnum("status").default("healthy"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Debts
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: debtTypeEnum("type").notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  contactName: text("contact_name").notNull(),
  description: text("description").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0"),
  dueDate: date("due_date"),
  status: debtStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Treasury / Cash flow
export const treasury = pgTable("treasury", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(), // income, expense
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }),
  referenceType: text("reference_type"), // purchase, sale, expense, income, debt
  referenceId: integer("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
