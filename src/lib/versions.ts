/** The history of the content file, for the Versions panel on the edit page.
 *  Runs at build time only and reads the git history of the checkout, so the deploy
 *  workflow fetches the full history. Every save from the edit page rebuilds the page,
 *  which is what keeps this list current. */
import { execFileSync } from 'node:child_process';

const FILE = 'content/home.json';
const TIME_ZONE = 'America/Los_Angeles';
const LIMIT = 40;

const SECTION: Record<string, string> = {
  site: 'Site details', nav: 'Navigation', hero: 'Top of the page', stats: 'Stat cards',
  testimonials: 'Reviews', meet: 'Meet Anya', quote: 'Quote', footer: 'Footer',
};
const ITEM: Record<string, string> = { items: 'review', paragraphs: 'paragraph', links: 'link', stats: 'card' };
const FIELD: Record<string, string> = {
  primary_cta: 'main button', secondary_cta: 'second button', review_line: 'review line', count_line: 'review count',
  image_alt: 'photo description', line_1: 'left side', line_2: 'right side', phone_display: 'phone number',
  phone_tel: 'phone link', pullquote: 'pull quote', body: 'full review', subhead: 'paragraph under the headline',
};

export interface Version {
  sha: string;      // the commit
  when: string;     // e.g. "Sep 11, 2026, 2:32 PM"
  source: string;   // where the change came from
  summary: string;  // which pieces of copy changed, in plain words
  live: boolean;    // is this what the live site shows?
}

export function listVersions(): Version[] {
  let log: string;
  try {
    log = git('log', `-n${LIMIT + 1}`, '--format=%H%x1f%aI%x1f%an%x1f%s', '--', FILE);
  } catch {
    return [];
  }
  const rows = log.trim().split('\n').filter(Boolean).map((l) => l.split('\x1f'));
  const texts = rows.map(([sha]) => git('show', `${sha}:${FILE}`));
  const liveText = (() => { try { return git('show', `origin/main:${FILE}`); } catch { return ''; } })();
  return rows.slice(0, LIMIT).map(([sha, iso, author, subject], i) => ({
    sha,
    when: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)),
    source: sourceOf(subject, author),
    summary: i + 1 < texts.length ? describe(JSON.parse(texts[i + 1]), JSON.parse(texts[i])) : 'First version of the text',
    live: texts[i] === liveText,
  }));
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function sourceOf(subject: string, author: string): string {
  if (subject.startsWith('Restore ')) return 'restored an earlier version';
  if (subject.includes('via the edit page')) return 'from the edit page';
  if (subject.includes('via Pages CMS')) return 'from Pages CMS';
  return `by ${author}`;
}

/** "Top of the page: headline, main button · Reviews: review 2 full review" */
function describe(before: unknown, after: unknown): string {
  const a = flatten(before), b = flatten(after);
  const changed = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);
  if (changed.length === 0) return 'No change to the text';
  const bySection = new Map<string, string[]>();
  for (const key of changed) {
    const [section, ...rest] = key.split('.');
    const label = SECTION[section] ?? section;
    bySection.set(label, [...(bySection.get(label) ?? []), fieldName(rest)]);
  }
  return [...bySection].map(([label, fields]) => `${label}: ${fields.join(', ')}`).join(' · ');
}

/** ["items", "1", "body"] -> "review 2 full review"; ["primary_cta", "label"] -> "main button label" */
function fieldName(parts: string[]): string {
  const words: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (/^\d+$/.test(p)) continue;
    if (/^\d+$/.test(parts[i + 1] ?? '')) words.push(`${ITEM[p] ?? p} ${Number(parts[i + 1]) + 1}`);
    else words.push(FIELD[p] ?? p.replace(/_/g, ' '));
  }
  return words.join(' ') || 'text';
}

function flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = String(value);
  }
  return out;
}
