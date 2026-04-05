import { z } from 'zod';

export const ShortenUrlSchema = z.object({
  url: z.string()
    .url({ message: "Invalid URL format" })
    .startsWith("http", { message: "URL must include http or https" })
    .max(2048, { message: "URL is too long" })
});

export const RedirectParamSchema = z.object({
  shortKey: z.string()
    .min(1)
    .max(10)
    .regex(/^[0-9a-zA-Z]+$/, { message: "Invalid characters in short key" })
});
