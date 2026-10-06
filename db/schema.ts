import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const rsvps = pgTable("rsvps", {
  id: serial().primaryKey(),
  nom: text().notNull(),
  email: text().notNull(),
  presence: text().notNull(), // "present" | "absent"
  guests: integer().notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
