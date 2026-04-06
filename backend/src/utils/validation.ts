import { ZodSchema } from 'zod';

type ValidationResult<T> =
  | { data: T;    error: null   }
  | { data: null; error: string };

function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return { data: null, error: message };
  }
  return { data: result.data, error: null };
}

export const validateBody   = validate;
export const validateQuery  = validate;
export const validateParams = validate;
