/** Split "90+ five-star Google reviews" into ["90+", "five-star Google reviews"].
 *  Used where the design shows the leading count in bold. */
export function splitLead(s: string): [string, string] {
  const i = s.indexOf(' ');
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
}
