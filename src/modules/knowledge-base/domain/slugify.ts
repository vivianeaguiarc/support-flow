export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildUniqueSlug(base: string, existingSlugs: string[]): string {
  const normalizedBase = slugify(base) || 'article';
  const slugSet = new Set(existingSlugs);

  if (!slugSet.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  while (slugSet.has(`${normalizedBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedBase}-${suffix}`;
}
