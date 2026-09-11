// The edit relay: the only server-side code in the project.
//
// The edit page (src/pages/edit.astro) posts its form here. Save turns the changed fields
// into one commit on the draft branch; Publish does the same and then starts the Publish
// workflow. Zero dependencies. `node relay/relay.js` runs it on Node 24, and the exported
// handler runs unchanged on Cloudflare Workers or Deno.
//
// Settings, as environment variables:
//   GITHUB_TOKEN      token with contents:write and actions:write on the repo (required)
//   GITHUB_REPO       owner/name, e.g. iambaney/mho-v2-draft (required)
//   BRANCH            branch the edit page writes to (default: draft)
//   CONTENT_PATH      the content file (default: content/home.json)
//   PUBLISH_WORKFLOW  workflow file the Publish button starts (default: publish.yml)
//   EDIT_PASSWORD     if set, the browser asks for it before saving (the user name is ignored)
//   PORT              port to listen on when run with Node (default: 8787)
//   GITHUB_API        base URL of the GitHub API; only tests change this

const defaults = {
  BRANCH: 'draft',
  CONTENT_PATH: 'content/home.json',
  PUBLISH_WORKFLOW: 'publish.yml',
  PORT: '8787',
  GITHUB_API: 'https://api.github.com',
};

const handler = {
  async fetch(request, env) {
    const cfg = { ...defaults, ...env };
    const back = request.headers.get('referer') || '';
    if (!cfg.GITHUB_TOKEN || !cfg.GITHUB_REPO) {
      return page('The relay is not set up', 'GITHUB_TOKEN and GITHUB_REPO need to be set where it runs.', back);
    }
    if (cfg.EDIT_PASSWORD && !authorized(request, cfg.EDIT_PASSWORD)) {
      return new Response('A password is needed to edit the site.', {
        status: 401,
        headers: { 'www-authenticate': 'Basic realm="Edit the site"' },
      });
    }
    const action = new URL(request.url).pathname;
    if (request.method === 'GET') {
      return page('The relay is running', `Ready to save to ${esc(cfg.GITHUB_REPO)} on the ${esc(cfg.BRANCH)} branch.`);
    }
    if (request.method !== 'POST' || !['/save', '/publish'].includes(action)) {
      return new Response('Not found', { status: 404 });
    }
    try {
      const form = new URLSearchParams(await request.text());
      const gh = github(cfg);
      const saved = await save(gh, form);
      if (action === '/publish') {
        await gh.dispatch();
        return page('Publishing', `${saved} The live site updates in about a minute.`, back, 60);
      }
      return page('Saved', `${saved} The draft site updates in about a minute.`, back, 60);
    } catch (e) {
      return page('That did not work', e.message, back);
    }
  },
};

export default handler;

/** Apply the form's fields to the content file and commit it if anything changed. */
async function save(gh, form) {
  const file = await gh.read();
  const sha = form.get('sha');
  if (sha && sha !== file.sha) {
    throw new Error('The text changed since this page was opened, probably saved by someone else. Go back, reload the page, and make the change again.');
  }
  let changed = 0;
  for (const [key, raw] of form) {
    if (key === 'sha') continue;
    if (setPath(file.content, key, raw.replace(/\r\n/g, '\n'))) changed++;
  }
  if (changed === 0) return 'Nothing had changed.';
  const noun = changed === 1 ? 'piece' : 'pieces';
  await gh.write(file.content, file.sha, `Update ${changed} ${noun} of copy via the edit page`);
  return `Saved ${changed} ${noun} of copy.`;
}

/** Set obj["a"]["b"]["0"]["c"] for the key "a.b.0.c", but only where a string already exists
 *  at that place. Anything else in the form is ignored. Returns whether the value changed. */
function setPath(obj, key, value) {
  const parts = key.split('.');
  let node = obj;
  for (const part of parts.slice(0, -1)) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, part)) return false;
    node = node[part];
  }
  const last = parts.at(-1);
  if (node === null || typeof node !== 'object' || !Object.hasOwn(node, last)) return false;
  if (typeof node[last] !== 'string' || node[last] === value) return false;
  node[last] = value;
  return true;
}

/** The three GitHub API calls the relay makes. */
function github(cfg) {
  const base = `${cfg.GITHUB_API}/repos/${cfg.GITHUB_REPO}`;
  const headers = {
    authorization: `Bearer ${cfg.GITHUB_TOKEN}`,
    accept: 'application/vnd.github+json',
    'content-type': 'application/json',
    'user-agent': 'mho-edit-relay',
  };
  async function call(method, path, body) {
    const res = await fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
    if (!res.ok) throw new Error(`GitHub answered ${res.status} to ${method} ${path}: ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  }
  const file = `/contents/${cfg.CONTENT_PATH}`;
  return {
    async read() {
      const f = await call('GET', `${file}?ref=${cfg.BRANCH}`);
      return { content: JSON.parse(fromBase64(f.content)), sha: f.sha };
    },
    write(content, sha, message) {
      const text = JSON.stringify(content, null, 2) + '\n';
      return call('PUT', file, { message, sha, branch: cfg.BRANCH, content: toBase64(text) });
    },
    dispatch() {
      return call('POST', `/actions/workflows/${cfg.PUBLISH_WORKFLOW}/dispatches`, { ref: cfg.BRANCH });
    },
  };
}

function authorized(request, password) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  const given = fromBase64(header.slice(6)).split(':').slice(1).join(':');
  return given === password;
}

/** A small HTML answer. With `back` and `refresh`, it returns to the edit page after that many seconds. */
function page(title, text, back = '', refresh = 0) {
  const meta = back && refresh ? `<meta http-equiv="refresh" content="${refresh};url=${esc(back)}">` : '';
  const link = back ? `<p><a href="${esc(back)}">Back to the editor</a></p>` : '';
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">${meta}<title>${esc(title)}</title>
<body style="font-family:system-ui,sans-serif;max-width:38rem;margin:4rem auto;padding:0 1rem;line-height:1.5;color:#2A241D;background:#F7ECDD">
<h1 style="font-weight:500">${esc(title)}</h1><p>${esc(text)}</p>${link}`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const toBase64 = (s) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(''));
const fromBase64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

// Run with Node: adapt its http server to the fetch handler above.
if (import.meta.main) {
  const { createServer } = await import('node:http');
  const port = Number(process.env.PORT || defaults.PORT);
  createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const response = await handler.fetch(request, process.env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }).listen(port, () => console.log(`Edit relay listening on http://localhost:${port}`));
}
