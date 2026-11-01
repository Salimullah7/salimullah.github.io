import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(), description: z.string(), category: z.string(),
    role: z.string(), status: z.string(), order: z.number(), featured: z.boolean(),
    stack: z.array(z.string()),
    diagram: z.enum(['migration', 'renewal', 'regional', 'batch', 'analytics', 'delivery'])
  })
});
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({ title: z.string(), description: z.string(), date: z.string(), category: z.string() })
});
export const collections = { work, writing };
