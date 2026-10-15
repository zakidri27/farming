CREATE TABLE "consumptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"product_type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
