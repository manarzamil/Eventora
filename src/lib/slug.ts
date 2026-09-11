/**
 * URL slug generation.
 *
 * Unicode is normalised to NFD so that combining diacritics can be stripped —
 * "Montjuïc" becomes "montjuic" rather than "montju-c" — which keeps slugs
 * readable for the Spanish and transliterated Arabic titles in the dataset.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Appends a numeric suffix until the slug is unique within `taken`. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  taken.add(slug);
  return slug;
}
