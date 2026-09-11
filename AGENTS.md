# Working on the My Healing Oasis site

This file is for anyone making changes here, whether a person or an AI agent. Read it before editing anything.

## What this is

A one-page static website built with [Astro](https://astro.build). The build reads one content file and a handful of templates and writes plain HTML and CSS into `dist/`. The finished site contains no JavaScript. That is a deliberate feature, not an omission.

Two branches, two sites:

| Branch | Site | What it is for |
|---|---|---|
| `draft` | https://iambaney.github.io/mho-v2-draft/draft/ | Every change lands here first. Check your work here. |
| `main` | https://iambaney.github.io/mho-v2-draft/ | The live site. It changes only when `draft` is published. |

Nobody commits to `main` directly. Publishing is one action that merges `draft` into `main` and deploys it.

## Where things live

| Path | What it is |
|---|---|
| `content/home.json` | Every word on the page. Text changes happen here and nowhere else. |
| `src/styles/tokens.css` | Colours and fonts as CSS custom properties, plus the `@font-face` rules. Change a value once and it applies everywhere. |
| `src/styles/global.css` | All layout and typography rules, grouped by section, with the responsive rules at the bottom. |
| `src/components/` | One template per section: `Nav`, `Hero`, `Proof` (the stat cards), `Testimonials`, `Meet`, `QuoteBand`, `Footer`. Each is the HTML for that section with the content filled in. `Home` stacks them in order. `Text` renders one piece of copy, or a form field for it on the edit page. |
| `src/pages/index.astro` | The home page: `Home` inside the base layout. |
| `src/pages/edit.astro` | The edit page: `Home` with `edit` on, wrapped in a form that posts to the relay. Built into the draft site only. |
| `src/styles/edit.css` | Styles for the edit page's form fields. Never loaded by the home page. |
| `relay/relay.js` | The server the edit page posts to. Commits the changed copy to `draft` and starts the Publish workflow. |
| `src/layouts/Base.astro` | The `<html>` and `<head>` wrapper. |
| `src/lib/` | Two small helpers: `withBase` prefixes site paths with the deploy base path; `splitLead` bolds the first word of the review lines. |
| `public/images/` | Photos. Referenced from the content file as `/images/<name>`. |
| `public/fonts/` | Self-hosted Fraunces and Nunito Sans, with their licences. |
| `mockup/` | The original design reference the site was built from. Not used by the build. Do not edit. |
| `.pages.yml` | Configuration for Pages CMS, a form editor for the same content file on `draft`. |
| `.github/workflows/` | Build, deploy and publish automation. |

## The flow for every change

1. Work on `draft`: `git switch draft && git pull`. Pull first, because the edit page and Pages CMS commit to this branch too (their commits say "via the edit page" or "via Pages CMS").
2. Make the change.
3. Check it. `npm run build` must succeed. For a visual check run `npm run dev` and open the URL it prints. Astro keeps the dev server running in the background and reloads the page when files change; `npx astro dev stop` stops it.
4. Commit with a one-line message that says what changed for a visitor, for example `Shorten the hero headline`. Push to `draft`.
5. About a minute later the preview site shows the change. `gh run list --branch draft --limit 1` shows the build and `gh run watch <run id>` follows it.
6. When the preview looks right and you have been asked to publish, run `gh workflow run publish.yml`. The live site updates about a minute later. Never publish on your own initiative.

If a build fails on GitHub, `gh run view <run id> --log-failed` prints why.

## Editing text

- Change words in `content/home.json` only. Do not hard-code text into a template.
- Keep the file valid JSON, formatted with two-space indentation as it is now, so that saves from the edit page produce small diffs.
- Keep the typographic punctuation the copy already uses: curly quotes, en and em dashes, the `·` separator.
- In `hero.review_line` and `testimonials.count_line` the first word is rendered in bold. Keep the number first.
- The phone number and address are placeholders (`XXX-XXX-XXXX`) until launch. Leave them.
- Do not rewrite copy you were not asked to change.

## Changing the design

- Colours and fonts: `src/styles/tokens.css`. Prefer changing a token to adding a new colour.
- Layout, spacing and type sizes: `src/styles/global.css`. The responsive rules are container queries at 700, 800 and 860 px and sit at the end of the file.
- Markup: the component for that section. Its class names are the ones `global.css` targets, so change both together.
- Every piece of copy in a component goes through `Text`, with `k` set to its key in the content file (`hero.headline`, `testimonials.items.0.body`) and `edit={edit}` passed along. That is what makes it editable on the edit page. Links and buttons render as `span` when `edit` is on, so the label can be edited.
- A new section is three things: a component in `src/components/`, a line in `Home.astro` that renders it with `edit={edit}`, and its text in `content/home.json`. Its styles go in `global.css` next to the others.
- Images go in `public/images/` and are referenced as `/images/<name>` from the content file. Templates wrap image and link paths in `withBase()` so the site also works under a sub-path. Keep doing that.
- Fonts are self-hosted on purpose. Do not add links to Google Fonts or any other third-party host.
- The mockup in `mockup/` is where the design came from. It is reference material, not a live spec, so the site may drift from it as the design evolves.

## Rules

- No JavaScript on the page, including the edit page. No `<script>` tags, no `client:` directives, no Astro integrations or UI frameworks that ship code to the browser.
- No new npm dependencies without asking Anthony. The site has exactly one, Astro, and the relay has none.
- Do not edit `.github/workflows/`, `.pages.yml`, `relay/` or `package.json` unless the task is about them.
- Never commit to `main`. Never force-push. Never rewrite history on `draft`.
- `PLAN.md`, `dist/`, `node_modules/` and `.astro/` are ignored by git and stay that way.
- No analytics, trackers, cookie banners or embeds unless asked.
