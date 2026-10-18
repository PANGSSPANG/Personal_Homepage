import { type CollectionEntry, getCollection } from 'astro:content';

import type { Locale } from '../i18n/ui';

export type ProfileEntry = CollectionEntry<'profile'>;
export type ExperienceEntry = CollectionEntry<'experience'>;
export type SkillEntry = CollectionEntry<'skills'>;

export interface Pair<T> {
  slug: string;
  zh: T;
  en: T | null;
}

export interface Resolved<T> {
  entry: T;
  isFallback: boolean;
}

export function slugFromId(id: string): string {
  const parts = id.split('/');
  return parts.slice(1).join('/');
}

export function localeFromId(id: string): Locale {
  const [prefix] = id.split('/');
  return prefix === 'en' ? 'en' : 'zh';
}

function pairEntries<T extends { id: string; data: { locale: Locale } }>(entries: T[]): Pair<T>[] {
  const buckets = new Map<string, { zh?: T; en?: T }>();

  for (const entry of entries) {
    const slug = slugFromId(entry.id);
    const bucket = buckets.get(slug) ?? {};
    if (localeFromId(entry.id) === 'en') bucket.en = entry;
    else bucket.zh = entry;
    buckets.set(slug, bucket);
  }

  return [...buckets.entries()]
    .filter(([, bucket]) => Boolean(bucket.zh))
    .map(([slug, bucket]) => ({
      slug,
      zh: bucket.zh as T,
      en: bucket.en ?? null,
    }));
}

export async function getProfilePair(): Promise<Pair<ProfileEntry>> {
  const entries = await getCollection('profile');
  const zh = entries.find((entry) => entry.id === 'zh');
  const en = entries.find((entry) => entry.id === 'en') ?? null;

  if (!zh) {
    throw new Error('缺少 src/content/profile/zh.md，中文个人信息是必填内容。');
  }

  return { slug: 'profile', zh, en };
}

export async function getExperiencePairs(): Promise<Pair<ExperienceEntry>[]> {
  return pairEntries(await getCollection('experience'));
}

export async function getPublishedExperiencePairs(): Promise<Pair<ExperienceEntry>[]> {
  return (await getExperiencePairs()).filter((pair) => !pair.zh.data.draft);
}

export async function getExperiencePair(slug: string): Promise<Pair<ExperienceEntry>> {
  const pairs = await getExperiencePairs();
  const pair = pairs.find((item) => item.slug === slug);

  if (!pair) {
    throw new Error(`找不到经历条目：${slug}`);
  }

  return pair;
}

export async function getSkillPairs(): Promise<Pair<SkillEntry>[]> {
  return pairEntries(await getCollection('skills'));
}

export function resolveForLocale<T>(pair: Pair<T>, locale: Locale): Resolved<T> {
  if (locale === 'zh') return { entry: pair.zh, isFallback: false };
  if (pair.en) return { entry: pair.en, isFallback: false };
  return { entry: pair.zh, isFallback: true };
}

export async function getSiteFlags(): Promise<{ hasSample: boolean }> {
  const [profiles, experiences, skills] = await Promise.all([
    getCollection('profile'),
    getCollection('experience'),
    getCollection('skills'),
  ]);

  const publishedExperiences = experiences.filter((entry) => !entry.data.draft);
  const all = [...profiles, ...publishedExperiences, ...skills];

  return { hasSample: all.some((entry) => entry.data.sample) };
}
