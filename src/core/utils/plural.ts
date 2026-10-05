/**
 * Plural helper utility for Toiloki.
 * Formats counts with grammatically correct singular or plural forms.
 * Examples:
 *   plural(1, 'utility', 'utilities') => "1 utility"
 *   plural(2, 'utility', 'utilities') => "2 utilities"
 *   plural(1, 'file') => "1 file"
 *   plural(5, 'file') => "5 files"
 */
export function plural(count: number, singular: string, pluralForm?: string): string {
  const form = count === 1 ? singular : (pluralForm || `${singular}s`);
  return `${count} ${form}`;
}

/**
 * Returns just the word form based on count.
 * Examples:
 *   pluralWord(1, 'file') => "file"
 *   pluralWord(2, 'file') => "files"
 */
export function pluralWord(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm || `${singular}s`);
}
