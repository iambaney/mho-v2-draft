# My Healing Oasis

Static site for myhealingoasis.net. Built with [Astro](https://astro.build); the output is plain HTML and CSS with no JavaScript.

## Where things live

| Path | What it is |
|---|---|
| `content/home.json` | Every word on the home page. Edit this to change copy. |
| `public/images/` | Photos referenced from the content file. |
| `public/fonts/` | Self-hosted Fraunces and Nunito Sans (SIL Open Font License). |
| `src/styles/tokens.css` | Colours, fonts, and sizes as CSS custom properties. Change a token here and it changes everywhere. |
| `src/styles/global.css` | The page styles. |
| `src/components/` | One file per section of the page (Nav, Hero, Proof, Testimonials, Meet, QuoteBand, Footer), plus `Text`, which renders one piece of copy, and `Home`, which stacks the sections. |
| `src/pages/index.astro` | The home page. |
| `src/pages/edit.astro` | The edit page: the home page with every piece of copy as a form field. Draft site only. |
| `relay/relay.js` | The small server the edit page's Save and Publish buttons post to. |
| `.github/workflows/` | Build-and-deploy automation. |

## Working on it

```sh
npm install     # once
npm run dev     # local preview at http://localhost:4321 with live reload
npm run build   # writes the finished site to dist/
```

Edits to `content/home.json`, the stylesheets, or the components show up in the browser without a refresh.

## Publishing

Two branches, two sites:

- `draft` builds to the preview site: https://iambaney.github.io/mho-v2-draft/draft/ . Every change lands here first.
- `main` builds to the live site: https://iambaney.github.io/mho-v2-draft/ . It changes only when `draft` is published.

Three ways in, one flow: make the change on `draft`, look at it on the preview site, then publish.

- **Code.** Edit, push to `draft`, check the preview, then run the Publish workflow: `gh workflow run publish.yml`, or the "Run workflow" button on the Actions tab.
- **The edit page.** `/edit/` on the draft site is the home page with every piece of copy as a field. Save commits the changes to `draft`; Publish does that and puts the draft site live. See "The edit page and the relay" below.
- **A form.** [Pages CMS](https://app.pagescms.org) shows `content/home.json` as a form with plain labels, saves to `draft`, and has a Publish button. `.pages.yml` describes the form. Editors are invited by email and do not need a GitHub account. Use it for what the edit page does not cover yet: images, links, and adding or removing reviews.
- **AI agents.** They read `AGENTS.md`, which describes the same flow and the rules of the codebase.

Publish is `.github/workflows/publish.yml`: it merges `draft` into `main`, runs the deploy for the live site, and brings `draft` level with `main`.

Pushing either branch runs the deploy workflow, which builds the site and uploads `dist/`. The GitHub Pages workflow is the proof of concept; `deploy-dreamhost.yml.example` is the same workflow with the upload step pointed at Dreamhost.

`dist/` is the whole website. It runs on any web host with no build tools installed.

## The edit page and the relay

The edit page is plain HTML: one form, no JavaScript. Its Save and Publish buttons post to the relay, `relay/relay.js`, a dependency-free server of about 160 lines that reads the content file from GitHub, applies the changed fields, commits the result to `draft`, and for Publish starts the Publish workflow. It runs on Node, or unchanged on Cloudflare Workers or Deno.

Until it has a permanent home, the relay runs on your own machine, and the edit page on the draft site is built to post to `http://localhost:8787`. Browsers treat `localhost` as a secure origin, so that works from the public draft site without any warnings. No new token is needed: the GitHub CLI you are already signed in to has one with the right scopes, and `$(gh auth token)` hands it over.

```sh
GITHUB_TOKEN=$(gh auth token) GITHUB_REPO=iambaney/mho-v2-draft node relay/relay.js
```

Settings the relay reads from its environment:

| Variable | What it is |
|---|---|
| `GITHUB_TOKEN` | Required. `$(gh auth token)` on your laptop. On a server, a dedicated fine-grained token for the repo with Contents and Actions set to read and write. |
| `GITHUB_REPO` | Required. `owner/name`, currently `iambaney/mho-v2-draft`. |
| `EDIT_PASSWORD` | Optional. Any string. When set, the browser asks for a password before saving (the user name is ignored). Off for the demo. |
| `PORT` | Optional. Default `8787`. |

When the relay moves to a server, set the `RELAY_URL` repository variable on GitHub (repo Settings, Secrets and variables, Actions, Variables tab, or `gh variable set RELAY_URL --body "https://…"`) to its address and re-run the draft deploy. The edit page picks it up at the next build. Until then leave it unset.

## Demo day checklist

1. Make sure local and remote agree: `git switch draft && git pull`.
2. Start the relay in a terminal and leave it running:
   ```sh
   GITHUB_TOKEN=$(gh auth token) GITHUB_REPO=iambaney/mho-v2-draft node relay/relay.js
   ```
   It prints `Edit relay listening on http://localhost:8787`. Opening that address in a browser shows "The relay is running".
3. Open the edit page: https://iambaney.github.io/mho-v2-draft/draft/edit/ . Click any text, change it, press **Save**. The confirmation page says how many pieces of copy were saved and returns to the editor after a minute; `gh run list --limit 3` shows the draft build in the meantime. When the page comes back the change is in it, and on the draft site: https://iambaney.github.io/mho-v2-draft/draft/ .
4. Press **Publish**. About a minute later the live site shows it: https://iambaney.github.io/mho-v2-draft/ .
5. The same change through the other doors, if useful:
   - Pages CMS at https://app.pagescms.org : the same file as a form, its own Publish button, editors invited by email.
   - Code or an agent: edit `content/home.json` on `draft`, push, then `gh workflow run publish.yml`. `AGENTS.md` is what an agent reads first.
6. Show the trail: `git fetch && git log --oneline -6 origin/draft`. Every save is a commit that says where it came from.

If something does not go through: `gh run list` shows the builds and `gh run view <run id> --log-failed` shows why one failed. The relay explains its own errors on the page it returns. A page that looks stale after a minute is usually the browser cache; reload it.
