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

## The edit page and the relay

The edit page is plain HTML: one form, no JavaScript. Its Save and Publish buttons post to the relay, `relay/relay.js`, a dependency-free server of about 160 lines that reads the content file from GitHub, applies the changed fields, commits the result to `draft`, and for Publish starts the Publish workflow. It runs on Node, or unchanged on Cloudflare Workers or Deno.

To run it on your own machine:

```sh
GITHUB_TOKEN=<token> GITHUB_REPO=iambaney/mho-v2-draft node relay/relay.js
```

The token is a fine-grained personal access token for this repo with Contents and Actions set to read and write. Browsers treat `localhost` as a secure origin, so the edit page on the draft site can post to a relay on your laptop. When the relay gets a permanent home, set the `RELAY_URL` repository variable (Settings, Secrets and variables, Actions, Variables) to its address and push; the edit page picks it up at the next build. `EDIT_PASSWORD` makes the browser ask for a password before saving.

Pushing either branch runs the deploy workflow, which builds the site and uploads `dist/`. The GitHub Pages workflow is the proof of concept; `deploy-dreamhost.yml.example` is the same workflow with the upload step pointed at Dreamhost.

`dist/` is the whole website. It runs on any web host with no build tools installed.
