import { z } from 'zod';

/**
 * Validator schema for URL input
 */
export const urlSchema = z.object({
  url: z
    .string()
    .url({ message: 'Invalid URL format' })
    .min(1, { message: 'URL is required' })
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: 'URL must use HTTP or HTTPS protocol' }
    ),
});

export type UrlInput = z.infer<typeof urlSchema>;

