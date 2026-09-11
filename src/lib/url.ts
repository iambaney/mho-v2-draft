/** Prefix a site-relative path ("/images/x.jpg", "/about/") with the configured base path.
 *  Anything else ("#", "tel:...", "https://...") is returned unchanged. */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}${path}`;
}
