CREATE TABLE "feed_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer,
	"animal_id" integer,
	"date" date NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feed_transactions" ADD COLUMN "headcount" integer;--> statement-breakpoint
ALTER TABLE "feed_transactions" ADD COLUMN "per_head_qty" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "feed_allocations" ADD CONSTRAINT "feed_allocations_transaction_id_feed_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."feed_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_allocations" ADD CONSTRAINT "feed_allocations_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;