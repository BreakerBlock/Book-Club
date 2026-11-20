import { pgTable, pgEnum, text, integer, real, timestamp, date, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

const id = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const pitchStatus = pgEnum("pitch_status", ["OPEN", "SELECTED", "ARCHIVED"]);
export const readStatus = pgEnum("read_status", ["WANT", "READING", "FINISHED"]);
export const eventKind = pgEnum("event_kind", ["EVENT", "SESSION"]);
export const rsvpStatus = pgEnum("rsvp_status", ["GOING", "INTERESTED"]);

export const members = pgTable("members", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  joinedAt: created(),
});

export const books = pgTable("books", {
  id: id(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre").notNull().default("Fiction"),
  isbn: text("isbn"),
  description: text("description").notNull().default(""),
  price: real("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  shelf: text("shelf"),
  coverUrl: text("cover_url"),
  arrivedAt: timestamp("arrived_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("books_genre_idx").on(t.genre), index("books_author_idx").on(t.author)]);

export const prizes = pgTable("prizes", {
  id: id(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  category: text("category").notNull().default("Winner"),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
});

export const availability = pgTable("availability", {
  id: id(),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  day: date("day").notNull(), // "YYYY-MM-DD"
}, (t) => [uniqueIndex("availability_member_day").on(t.memberId, t.day), index("availability_day_idx").on(t.day)]);

export const pitches = pgTable("pitches", {
  id: id(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre").notNull().default(""),
  reason: text("reason").notNull(),
  status: pitchStatus("status").notNull().default("OPEN"),
  createdAt: created(),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
});

export const votes = pgTable("votes", {
  id: id(),
  value: integer("value").notNull(),
  pitchId: text("pitch_id").notNull().references(() => pitches.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("votes_pitch_member").on(t.pitchId, t.memberId)]);

export const readingLogs = pgTable("reading_logs", {
  id: id(),
  bookTitle: text("book_title").notNull(),
  bookAuthor: text("book_author").notNull(),
  genre: text("genre").notNull().default(""),
  status: readStatus("status").notNull().default("READING"),
  rating: integer("rating"),
  review: text("review"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  bookId: text("book_id").references(() => books.id, { onDelete: "set null" }),
}, (t) => [index("reading_logs_updated_idx").on(t.updatedAt)]);

export const events = pgTable("events", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  kind: eventKind("kind").notNull().default("EVENT"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  location: text("location").notNull().default("In store"),
  capacity: integer("capacity"),
});

export const eventPhotos = pgTable("event_photos", {
  id: id(),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  createdAt: created(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
});

export const rsvps = pgTable("rsvps", {
  id: id(),
  status: rsvpStatus("status").notNull(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("rsvps_event_member").on(t.eventId, t.memberId)]);

/* relations for db.query.*.findMany({ with }) */
export const membersRel = relations(members, ({ many }) => ({ pitches: many(pitches), votes: many(votes), logs: many(readingLogs), rsvps: many(rsvps), availability: many(availability) }));
export const booksRel = relations(books, ({ many }) => ({ prizes: many(prizes), logs: many(readingLogs) }));
export const prizesRel = relations(prizes, ({ one }) => ({ book: one(books, { fields: [prizes.bookId], references: [books.id] }) }));
export const availabilityRel = relations(availability, ({ one }) => ({ member: one(members, { fields: [availability.memberId], references: [members.id] }) }));
export const pitchesRel = relations(pitches, ({ one, many }) => ({ member: one(members, { fields: [pitches.memberId], references: [members.id] }), votes: many(votes) }));
export const votesRel = relations(votes, ({ one }) => ({ pitch: one(pitches, { fields: [votes.pitchId], references: [pitches.id] }), member: one(members, { fields: [votes.memberId], references: [members.id] }) }));
export const logsRel = relations(readingLogs, ({ one }) => ({ member: one(members, { fields: [readingLogs.memberId], references: [members.id] }), book: one(books, { fields: [readingLogs.bookId], references: [books.id] }) }));
export const eventsRel = relations(events, ({ many }) => ({ photos: many(eventPhotos), rsvps: many(rsvps) }));
export const photosRel = relations(eventPhotos, ({ one }) => ({ event: one(events, { fields: [eventPhotos.eventId], references: [events.id] }) }));
export const rsvpsRel = relations(rsvps, ({ one }) => ({ event: one(events, { fields: [rsvps.eventId], references: [events.id] }), member: one(members, { fields: [rsvps.memberId], references: [members.id] }) }));

export type Book = typeof books.$inferSelect;
