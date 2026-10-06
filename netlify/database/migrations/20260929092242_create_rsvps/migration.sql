CREATE TABLE "rsvps" (
	"id" serial PRIMARY KEY,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"presence" text NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
