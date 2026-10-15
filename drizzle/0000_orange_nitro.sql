CREATE TYPE "public"."animal_type" AS ENUM('cow', 'goat', 'sheep', 'chicken', 'quail');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('customer', 'supplier', 'both');--> statement-breakpoint
CREATE TYPE "public"."debt_status" AS ENUM('pending', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."debt_type" AS ENUM('owed_to_us', 'we_owe');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('healthy', 'sick', 'treatment', 'recovered', 'dead');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'sale', 'expense', 'income');--> statement-breakpoint
CREATE TABLE "animals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "animal_type" NOT NULL,
	"breed" text,
	"birth_date" date,
	"gender" text,
	"weight" numeric(10, 2),
	"purchase_price" numeric(10, 2),
	"purchase_date" date,
	"status" text DEFAULT 'active',
	"notes" text,
	"tag_number" text,
	"mother_animal_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "births" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"mother_id" integer,
	"father_id" integer,
	"mother_name" text,
	"father_name" text,
	"child_name" text NOT NULL,
	"child_type" "animal_type" NOT NULL,
	"child_gender" text,
	"child_breed" text,
	"birth_weight" numeric(10, 2),
	"child_animal_id" integer,
	"status" text DEFAULT 'alive',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "contact_type" DEFAULT 'both' NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" "debt_type" NOT NULL,
	"contact_id" integer,
	"contact_name" text NOT NULL,
	"description" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"due_date" date,
	"status" "debt_status" DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"animal_type" "animal_type",
	"payment_method" text DEFAULT 'cash',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"unit_cost" numeric(10, 2),
	"min_quantity" numeric(10, 2) DEFAULT '0',
	"animal_type" "animal_type",
	"notes" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"feed_id" integer,
	"feed_name" text NOT NULL,
	"transaction_type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"cost" numeric(10, 2),
	"animal_type" "animal_type",
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"animal_id" integer,
	"animal_type" "animal_type",
	"record_type" text NOT NULL,
	"description" text NOT NULL,
	"diagnosis" text,
	"treatment" text,
	"medicine" text,
	"medicine_cost" numeric(10, 2),
	"vet_name" text,
	"vet_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"next_visit_date" date,
	"status" "health_status" DEFAULT 'healthy',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"animal_type" "animal_type",
	"customer_id" integer,
	"payment_method" text DEFAULT 'cash',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "productions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"animal_id" integer,
	"animal_name" text,
	"animal_type" "animal_type",
	"product_type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"unit_price" numeric(10, 2),
	"total_value" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit" text,
	"unit_price" numeric(10, 2),
	"total_amount" numeric(10, 2) NOT NULL,
	"supplier_id" integer,
	"animal_type" "animal_type",
	"animal_id" integer,
	"payment_status" text DEFAULT 'paid',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit" text,
	"unit_price" numeric(10, 2),
	"total_amount" numeric(10, 2) NOT NULL,
	"customer_id" integer,
	"animal_type" "animal_type",
	"animal_id" integer,
	"payment_status" text DEFAULT 'paid',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "treasury" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance" numeric(10, 2),
	"reference_type" text,
	"reference_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "births" ADD CONSTRAINT "births_mother_id_animals_id_fk" FOREIGN KEY ("mother_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "births" ADD CONSTRAINT "births_father_id_animals_id_fk" FOREIGN KEY ("father_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "births" ADD CONSTRAINT "births_child_animal_id_animals_id_fk" FOREIGN KEY ("child_animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_transactions" ADD CONSTRAINT "feed_transactions_feed_id_feed_stock_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed_stock"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productions" ADD CONSTRAINT "productions_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;