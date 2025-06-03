import { dreams, type Dream, type InsertDream } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private dreams: Map<number, Dream>;
  currentUserId: number;
  currentDreamId: number;

  constructor() {
    this.users = new Map();
    this.dreams = new Map();
    this.currentUserId = 1;
    this.currentDreamId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllDreams(): Promise<Dream[]> {
    return Array.from(this.dreams.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDream(id: number): Promise<Dream | undefined> {
    return this.dreams.get(id);
  }

  async createDream(insertDream: InsertDream): Promise<Dream> {
    const id = this.currentDreamId++;
    const dream: Dream = { 
      ...insertDream, 
      id, 
      createdAt: new Date() 
    };
    this.dreams.set(id, dream);
    return dream;
  }

  async updateDream(id: number, updates: Partial<InsertDream>): Promise<Dream | undefined> {
    const existingDream = this.dreams.get(id);
    if (!existingDream) return undefined;
    
    const updatedDream = { ...existingDream, ...updates };
    this.dreams.set(id, updatedDream);
    return updatedDream;
  }

  async deleteDream(id: number): Promise<boolean> {
    return this.dreams.delete(id);
  }
}

export const storage = new MemStorage();
