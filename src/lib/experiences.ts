import { experiencePath } from '../i18n/routes';
import type { Locale } from '../i18n/ui';
import { type ExperienceEntry, type Pair, resolveForLocale } from './content';
import { formatPeriod } from './dates';

export type ExperienceKind = ExperienceEntry['data']['kind'];

export interface ExperienceView {
  slug: string;
  kind: ExperienceKind;
  title: string;
  org: string;
  summary: string;
  period: string;
  location?: string;
  highlights: string[];
  tags: string[];
  links: { label: string; url: string }[];
  href: string | null;
  isFallback: boolean;
  start: string;
  end: string | null;
}

export interface ExperienceGroup {
  kind: ExperienceKind;
  label: string;
  items: ExperienceView[];
}

export function buildExperienceView(
  pair: Pair<ExperienceEntry>,
  locale: Locale,
  presentLabel: string,
): ExperienceView {
  const { entry, isFallback } = resolveForLocale(pair, locale);
  const data = entry.data;

  return {
    slug: pair.slug,
    kind: data.kind,
    title: data.title,
    org: data.org,
    summary: data.summary,
    period: formatPeriod(data.start, data.end, locale, presentLabel),
    location: data.location,
    highlights: data.highlights,
    tags: data.tags,
    links: data.links,
    href: data.kind === 'project' ? experiencePath(pair.slug) : null,
    isFallback,
    start: data.start,
    end: data.end,
  };
}

export function sortExperienceViews(items: ExperienceView[]): ExperienceView[] {
  return [...items].sort((a, b) => {
    const aOngoing = a.end === null;
    const bOngoing = b.end === null;
    if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
    if (a.start !== b.start) return a.start < b.start ? 1 : -1;
    return a.slug.localeCompare(b.slug);
  });
}

export function groupExperienceViews(
  items: ExperienceView[],
  labels: Record<ExperienceKind, string>,
): ExperienceGroup[] {
  const order: ExperienceKind[] = ['work', 'project', 'education'];

  return order
    .map((kind) => ({
      kind,
      label: labels[kind],
      items: items.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0);
}
