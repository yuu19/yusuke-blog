CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_subject" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notes_owner_subject_idx" ON "notes" USING btree ("owner_subject");