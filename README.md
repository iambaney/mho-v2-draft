# My Healing Oasis

Static site for myhealingoasis.net. Built with [Astro](https://astro.build); the output is plain HTML and CSS with no JavaScript.

## Where things live

| Path | What it is |
|---|---|
| `content/home.yaml` | Every word on the home page. Edit this to change copy. |
| `public/images/` | Photos referenced from the content file. |
| `public/fonts/` | Self-hosted Fraunces and Nunito Sans (SIL Open Font License). |
| `src/styles/tokens.css` | Colours, fonts, and sizes as CSS custom properties. Change a token here and it changes everywhere. |
| `src/styles/global.css` | The page styles. |
| `src/components/` | One file per section of the page (Nav, Hero, Proof, Testimonials, Meet, QuoteBand, Footer). |
| `src/pages/index.astro` | The home page: loads the content file and lays out the sections. |
| `.github/workflows/` | Build-and-deploy automation. |

## Working on it

```sh
npm install     # once
npm run dev     # local preview at http://localhost:4321 with live reload
npm run build   # writes the finished site to dist/
```

Edits to `content/home.yaml`, the stylesheets, or the components show up in the browser without a refresh.

## Publishing

Two branches, two sites:

- `draft` builds to the preview site: https://iambaney.github.io/mho-v2-draft/draft/ . Every change lands here first.
- `main` builds to the live site: https://iambaney.github.io/mho-v2-draft/ . It changes only when `draft` is published.

Three ways in, one flow: make the change on `draft`, look at it on the preview site, then publish.

- **Code.** Edit, push to `draft`, check the preview, then run the Publish workflow: `gh workflow run publish.yml`, or the "Run workflow" button on the Actions tab.
- **No code.** [Pages CMS](https://app.pagescms.org) shows `content/home.yaml` as a form with plain labels, saves to `draft`, and has a Publish button. `.pages.yml` describes the form. Editors are invited by email and do not need a GitHub account.
- **AI agents.** They read `AGENTS.md`, which describes the same flow and the rules of the codebase.

Publish is `.github/workflows/publish.yml`: it merges `draft` into `main` and runs the deploy for the live site.

Pushing either branch runs the deploy workflow, which builds the site and uploads `dist/`. The GitHub Pages workflow is the proof of concept; `deploy-dreamhost.yml.example` is the same workflow with the upload step pointed at Dreamhost.

`dist/` is the whole website. It runs on any web host with no build tools installed.
