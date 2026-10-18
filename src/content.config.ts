import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const locale = z.enum(['zh', 'en']);
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '日期格式必须是 YYYY-MM');

// Pages CMS 会把留空的字段写成空字符串，这里统一转成 undefined / null，
// 保证后台保存后的 frontmatter 仍然能通过 Astro 的 schema。
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);
const nullableMonth = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  month.nullable(),
);
const optionalLevel = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.enum(['了解', '熟悉', '熟练', '精通', 'Basic', 'Familiar', 'Proficient', 'Expert']).optional(),
);
const optionalYears = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.number().int().min(0).max(50).optional(),
);

const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: z.object({
    locale,
    sample: z.boolean().default(false),
    name: z.string().min(1).max(40),
    headline: z.string().min(1).max(60),
    location: z.string().min(1).max(40),
    email: z.string().email(),
    avatar: optionalString,
    socials: z.array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
        icon: optionalString,
      }),
    ),
    resumeUrl: optionalString,
    updated: z.coerce.date(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    locale,
    sample: z.boolean().default(false),
    kind: z.enum(['work', 'project', 'education']),
    title: z.string().min(1).max(60),
    org: z.string().min(1).max(60),
    start: month,
    end: nullableMonth,
    location: z.string().max(40).optional(),
    summary: z.string().min(1).max(120),
    highlights: z.array(z.string()).max(5).default([]),
    tags: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/skills' }),
  schema: z.object({
    locale,
    sample: z.boolean().default(false),
    category: z.string().min(1).max(20),
    order: z.number().int().min(0),
    items: z
      .array(
        z.object({
          name: z.string().min(1).max(30),
          level: optionalLevel,
          years: optionalYears,
          note: z.string().max(60).optional(),
        }),
      )
      .min(1),
  }),
});

export const collections = { profile, experience, skills };
