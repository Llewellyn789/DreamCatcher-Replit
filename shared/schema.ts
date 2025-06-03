import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dreams = pgTable("dreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  duration: text("duration"), // e.g. "3:42"
  analysis: text("analysis"), // JSON string of Jungian analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,
  createdAt: true,
});

export type InsertDream = z.infer<typeof insertDreamSchema>;
export type Dream = typeof dreams.$inferSelect;

// Jungian Analysis Structure
export const jungianAnalysisSchema = z.object({
  archetypes: z.string(),
  symbols: z.string(),
  unconscious: z.string(),
  insights: z.string(),
  integration: z.string(),
});

export type JungianAnalysis = z.infer<typeof jungianAnalysisSchema>;
