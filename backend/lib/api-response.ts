import { z } from 'zod';

export async function parseJsonBody<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema
): Promise<{ success: true; data: z.output<Schema> } | { success: false }> {
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? { success: true, data: parsed.data } : { success: false };
  } catch {
    return { success: false };
  }
}
