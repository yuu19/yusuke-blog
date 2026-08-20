CREATE TABLE "oauth_bff_session" (
	"session_id_hash" text PRIMARY KEY NOT NULL,
	"token_ciphertext" text NOT NULL,
	"subject" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_bff_transaction" (
	"state_hash" text PRIMARY KEY NOT NULL,
	"browser_binding_hash" text NOT NULL,
	"code_verifier" text NOT NULL,
	"nonce" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "oauth_bff_session_expires_at_idx" ON "oauth_bff_session" USING btree ("expires_at");