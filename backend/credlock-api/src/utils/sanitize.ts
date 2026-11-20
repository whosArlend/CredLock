/**
 * Sanitizes user search input for safe use in Supabase/PostgREST .ilike() queries.
 *
 * 1. Strips ASCII control characters (\x00-\x1F, \x7F)
 * 2. Replaces PostgREST filter delimiter characters (, ( ) " :) with spaces to prevent filter injection
 * 3. Escapes backslashes (\ -> \\) to prevent escape syntax errors
 * 4. Escapes SQL ILIKE wildcards (% -> \% and _ -> \_) to prevent unintended excessively broad wildcard searches
 * 5. Trims leading and trailing whitespace
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term) return '';
  return term
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[,()":]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .trim();
}
