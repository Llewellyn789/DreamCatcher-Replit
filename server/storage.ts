import { dreams, users, type Dream, type InsertDream, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dream operations
  getAllDreams(): Promise<Dream[]>;
  getDream(id: number): Promise<Dream | undefined>;
  createDream(dream: InsertDream): Promise<Dream>;
  updateDream(id: number, updates: Partial<InsertDream>): Promise<Dream | undefined>;
  deleteDream(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllDreams(): Promise<Dream[]> {
    const allDreams = await db.select().from(dreams).orderBy(desc(dreams.createdAt));
    return allDreams;
  }

  async getDream(id: number | string): Promise<Dream | undefined> {
    const [dream] = typeof id === 'string' 
      ? await db.select().from(dreams).where(eq(dreams.id, id))
      : await db.select().from(dreams).where(eq(dreams.id, id));
    return dream || undefined;
  }

  async createDream(insertDream: InsertDream): Promise<Dream> {
    const [dream] = await db
      .insert(dreams)
      .values(insertDream)
      .returning();
    return dream;
  }

  async updateDream(id: number, updates: Partial<InsertDream>): Promise<Dream | undefined> {
    const [dream] = await db
      .update(dreams)
      .set(updates)
      .where(eq(dreams.id, id))
      .returning();
    return dream || undefined;
  }

  async deleteDream(id: number): Promise<boolean> {
    const result = await db.delete(dreams).where(eq(dreams.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
