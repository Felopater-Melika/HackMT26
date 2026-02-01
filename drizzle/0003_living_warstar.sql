CREATE TABLE "medication_deep_dives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"medication_id" uuid NOT NULL,
	"scan_id" uuid,
	"inputs_hash" text NOT NULL,
	"openfda_data_hash" text,
	"summary" text,
	"what_it_treats" jsonb,
	"how_it_works" text,
	"how_to_take" jsonb,
	"expected_timeline" text,
	"benefits" jsonb,
	"side_effects" jsonb,
	"personalized_warnings" jsonb,
	"interactions" jsonb,
	"lifestyle" jsonb,
	"monitoring" jsonb,
	"questions_to_ask_doctor" jsonb,
	"confidence" jsonb,
	"sources_used" jsonb,
	"disclaimer" text,
	"raw_llm_response" text,
	"ai_model" text,
	"temperature" numeric,
	"tokens_used" integer,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_medications" ADD COLUMN "medication_label" jsonb;--> statement-breakpoint
ALTER TABLE "medication_deep_dives" ADD CONSTRAINT "medication_deep_dives_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_deep_dives" ADD CONSTRAINT "medication_deep_dives_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_deep_dives" ADD CONSTRAINT "medication_deep_dives_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "medication_deep_dives_inputs_hash_idx" ON "medication_deep_dives" USING btree ("inputs_hash");--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "scans_used";