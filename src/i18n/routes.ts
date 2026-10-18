import type { Locale } from './ui';

/** 给路径补上末尾斜杠，站内链接统一使用带斜杠的形式。 */
export function withTrailingSlash(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.endsWith('/')) return normalized;
  if (/\.[a-z0-9]+$/i.test(normalized)) return normalized;
  return `${normalized}/`;
}

/** 把站内路径转换到指定语言。中文无前缀，英文统一 /en。 */
export function localizePath(path: string, locale: Locale): string {
  const normalized = withTrailingSlash(path);

  if (locale === 'en') {
    if (normalized === '/en/' || normalized.startsWith('/en/')) return normalized;
    return normalized === '/' ? '/en/' : `/en${normalized}`;
  }

  if (normalized === '/en/') return '/';
  if (normalized.startsWith('/en/')) return normalized.slice(3);
  return normalized;
}

/** 当前页面对应的另一种语言路径。 */
export function alternatePath(pathname: string): string {
  const normalized = withTrailingSlash(pathname);

  if (normalized === '/') return '/en/';
  if (normalized === '/en/') return '/';
  if (normalized.endsWith('.html')) {
    return normalized === '/404.html' ? '/en/' : normalized;
  }
  if (normalized.startsWith('/en/')) return normalized.slice(3);
  return `/en${normalized}`;
}

export function experiencePath(slug: string, locale: Locale): string {
  return localizePath(`/experience/${slug}/`, locale);
}
