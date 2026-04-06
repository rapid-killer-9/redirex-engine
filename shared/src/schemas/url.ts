import { z } from 'zod';

export const ShortenUrlSchema = z.object({
  url:         z.string().url('Invalid URL').max(2048, 'URL too long'),
  title:       z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  expiresAt:   z.string().datetime({ message: 'Invalid datetime format' }).optional(),
});

export const UpdateUrlSchema = z.object({
  isActive:    z.boolean().optional(),
  title:       z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  expiresAt:   z.string().datetime().nullable().optional(),
});

export const ShortKeyParamSchema = z.object({
  shortKey: z
    .string()
    .min(1, 'Short key required')
    .max(10, 'Short key too long')
    .regex(/^[0-9a-zA-Z]+$/, 'Short key must be alphanumeric'),
});

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ShortenUrlInput  = z.infer<typeof ShortenUrlSchema>;
export type UpdateUrlInput   = z.infer<typeof UpdateUrlSchema>;
export type ShortKeyParam    = z.infer<typeof ShortKeyParamSchema>;
export type PaginationQuery  = z.infer<typeof PaginationSchema>;