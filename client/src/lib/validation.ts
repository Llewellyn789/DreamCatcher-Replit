
import { z } from "zod";

// Client-side validation schemas
export const audioFileSchema = z.object({
  file: z.instanceof(File),
  size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB"),
  type: z.string().refine(
    (type) => type.startsWith('audio/') || type.includes('webm'),
    "File must be an audio file"
  )
});

export const dreamContentSchema = z.object({
  content: z.string().min(10, "Dream content must be at least 10 characters"),
  title: z.string().min(1, "Title is required").max(100, "Title too long")
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

export const transcriptionResponseSchema = z.object({
  transcript: z.string().min(1, "Transcript cannot be empty")
});

export const analysisResponseSchema = z.object({
  analysis: z.object({
    archetypes: z.string(),
    symbols: z.string(),
    unconscious: z.string(),
    insights: z.string(),
    integration: z.string()
  })
});

// Validation helper functions
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  try {
    audioFileSchema.parse({ file, size: file.size, type: file.type });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as z.ZodError).errors[0].message };
  }
}

export function validateApiResponse(response: any, schema: z.ZodSchema) {
  try {
    return { valid: true, data: schema.parse(response) };
  } catch (error) {
    return { valid: false, error: (error as z.ZodError).errors[0].message };
  }
}
