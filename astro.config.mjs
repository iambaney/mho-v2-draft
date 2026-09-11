import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

// BASE_PATH is set by the deploy workflow for a GitHub Pages project site ("/repo/" or "/repo/draft/").
// Unset locally and on Dreamhost, where the site lives at "/".
export default defineConfig({
  output: 'static',
  base: process.env.BASE_PATH ?? '/',
  vite: { plugins: [yaml()] },
});
