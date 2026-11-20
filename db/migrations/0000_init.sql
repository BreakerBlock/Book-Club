CREATE TYPE "public"."event_kind" AS ENUM('EVENT', 'SESSION');--> statement-breakpoint
CREATE TYPE "public"."pitch_status" AS ENUM('OPEN', 'SELECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."read_status" AS ENUM('WANT', 'READING', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('GOING', 'INTERESTED');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"day" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"genre" text DEFAULT 'Fiction' NOT NULL,
	"isbn" text,
	"description" text DEFAULT '' NOT NULL,
	"price" real DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"shelf" text,
	"cover_url" text,
	"arrived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" "event_kind" DEFAULT 'EVENT' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"location" text DEFAULT 'In store' NOT NULL,
	"capacity" integer
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pitches" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"genre" text DEFAULT '' NOT NULL,
	"reason" text NOT NULL,
	"status" "pitch_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"member_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prizes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"category" text DEFAULT 'Winner' NOT NULL,
	"book_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"book_title" text NOT NULL,
	"book_author" text NOT NULL,
	"genre" text DEFAULT '' NOT NULL,
	"status" "read_status" DEFAULT 'READING' NOT NULL,
	"rating" integer,
	"review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"member_id" text NOT NULL,
	"book_id" text
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "rsvp_status" NOT NULL,
	"event_id" text NOT NULL,
	"member_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	"pitch_id" text NOT NULL,
	"member_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitches" ADD CONSTRAINT "pitches_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_pitch_id_pitches_id_fk" FOREIGN KEY ("pitch_id") REFERENCES "public"."pitches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_member_day" ON "availability" USING btree ("member_id","day");--> statement-breakpoint
CREATE INDEX "availability_day_idx" ON "availability" USING btree ("day");--> statement-breakpoint
CREATE INDEX "books_genre_idx" ON "books" USING btree ("genre");--> statement-breakpoint
CREATE INDEX "books_author_idx" ON "books" USING btree ("author");--> statement-breakpoint
CREATE INDEX "reading_logs_updated_idx" ON "reading_logs" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_event_member" ON "rsvps" USING btree ("event_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_pitch_member" ON "votes" USING btree ("pitch_id","member_id");