import type { Dream as DbDream } from "@shared/schema";

/**
 * LocalStorage-compatible Dream interface
 * Adapts the database Dream type for localStorage usage
 */
export interface Dream {
  id: string;
  title: string;
  content: string; // matches 'body' field from prompt but keeping 'content' to match existing schema
  duration?: string;
  analysis?: string; // JSON string of Jungian analysis
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags?: string[];
}

const STORAGE_KEY = "dreams";

/**
 * Generate a unique identifier using crypto.randomUUID() with fallback
 */
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Load all dreams from localStorage
 */
function loadAll(): Dream[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Normalize each dream to ensure all required fields exist
    return parsed.map(normalize);
  } catch (error) {
    console.warn('Failed to load dreams from localStorage:', error);
    return [];
  }
}

/**
 * Persist all dreams to localStorage
 */
function persist(dreams: Dream[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  } catch (error) {
    console.error('Failed to persist dreams to localStorage:', error);
    throw new Error('Failed to save dreams');
  }
}

/**
 * Normalize a partial dream object to ensure all required fields exist
 */
function normalize(d: Partial<Dream>): Dream {
  const now = new Date().toISOString();
  
  return {
    id: d.id || uuid(),
    title: d.title || 'Untitled Dream',
    content: d.content || '',
    duration: d.duration,
    analysis: d.analysis,
    createdAt: d.createdAt || now,
    updatedAt: d.updatedAt || now,
    tags: d.tags || [],
  };
}

/**
 * Get all dreams sorted by updatedAt in descending order
 */
export async function getAllDreams(): Promise<Dream[]> {
  const dreams = loadAll();
  return dreams.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get a dream by its ID
 */
export async function getById(id: string): Promise<Dream | undefined> {
  const dreams = loadAll();
  return dreams.find(dream => dream.id === id);
}

/**
 * Save a dream (create or update)
 * @param input - Dream data with optional ID for updates
 */
export async function saveDream(input: Partial<Dream> & { id?: string }): Promise<Dream> {
  const dreams = loadAll();
  const now = new Date().toISOString();
  
  if (input.id) {
    // Update existing dream
    const index = dreams.findIndex(dream => dream.id === input.id);
    if (index >= 0) {
      const updated = normalize({
        ...dreams[index],
        ...input,
        updatedAt: now,
      });
      dreams[index] = updated;
      persist(dreams);
      return updated;
    }
  }
  
  // Create new dream
  const newDream = normalize({
    ...input,
    id: input.id || uuid(),
    createdAt: now,
    updatedAt: now,
  });
  
  dreams.push(newDream);
  persist(dreams);
  return newDream;
}

/**
 * Update an existing dream
 * @param id - Dream ID to update
 * @param patch - Partial dream data to merge
 */
export async function updateDream(id: string, patch: Partial<Dream>): Promise<Dream> {
  const dreams = loadAll();
  const index = dreams.findIndex(dream => dream.id === id);
  
  if (index < 0) {
    throw new Error(`Dream with ID ${id} not found`);
  }
  
  const updated = normalize({
    ...dreams[index],
    ...patch,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  });
  
  dreams[index] = updated;
  persist(dreams);
  return updated;
}

/**
 * Delete a dream by ID
 */
export async function deleteDream(id: string): Promise<void> {
  const dreams = loadAll();
  const filteredDreams = dreams.filter(dream => dream.id !== id);
  
  if (filteredDreams.length === dreams.length) {
    throw new Error(`Dream with ID ${id} not found`);
  }
  
  persist(filteredDreams);
}

/**
 * Export all dreams as a formatted JSON string
 */
export async function exportJSON(): Promise<string> {
  const dreams = await getAllDreams();
  return JSON.stringify(dreams, null, 2);
}

/**
 * Import dreams from a JSON file or string
 * @param fileOrString - File object or JSON string to import
 * @returns Object with count of imported dreams
 */
export async function importJSON(fileOrString: File | string): Promise<{ count: number }> {
  let jsonData: string;
  
  if (fileOrString instanceof File) {
    jsonData = await fileOrString.text();
  } else {
    jsonData = fileOrString;
  }
  
  try {
    const parsed = JSON.parse(jsonData);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: expected an array of dreams');
    }
    
    const normalizedDreams = parsed.map(normalize);
    const existingDreams = loadAll();
    
    // Merge imported dreams with existing ones, avoiding duplicates by ID
    const existingIds = new Set(existingDreams.map(d => d.id));
    const newDreams = normalizedDreams.filter(d => !existingIds.has(d.id));
    
    const allDreams = [...existingDreams, ...newDreams];
    persist(allDreams);
    
    return { count: newDreams.length };
  } catch (error) {
    throw new Error(`Failed to import dreams: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}