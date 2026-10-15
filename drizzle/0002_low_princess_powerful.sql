ALTER TABLE "animals" ADD COLUMN "batch_id" integer;--> statement-breakpoint
ALTER TABLE "births" ADD COLUMN "batch_name" text;--> statement-breakpoint
ALTER TABLE "births" ADD COLUMN "quantity" numeric(10, 2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_batch_id_births_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."births"("id") ON DELETE no action ON UPDATE no action;