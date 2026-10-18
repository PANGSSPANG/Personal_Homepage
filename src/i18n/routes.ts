import type { Locale } from './ui';

/** 给路径补上末尾斜杠，站内链接统一使用带斜杠的形式。 */
export function withTrailingSlash(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.endsWith('/')) return normalized;
  if (/\.[a-z0-9]+$/i.test(normalized)) return normalized;
  return `${normalized}/`;
}

/** 目前站点只有中文，保留该函数以便以后扩展。 */
export function localizePath(path: string, locale: Locale): string {
  void locale;
  return withTrailingSlash(path);
}

export function experiencePath(slug: string): string {
  return withTrailingSlash(`/experience/${slug}/`);
}
