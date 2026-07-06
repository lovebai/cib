# AGENTS.md

## Project Overview

Cloudflare Worker (JavaScript ESM) that fetches a CSV of Chinese independent blogs and renders an HTML navigation site with search, tag filtering, and favicon proxying.

## Build / Run / Test Commands

```bash
# Start local dev server (wrangler dev)
npm run dev

# Deploy to Cloudflare
npm run deploy

# Run all tests
npm test

# Run a single test file
npx vitest run test/index.spec.js

# Run a single test by name pattern
npx vitest run --reporter=verbose -t "responds with Hello World"

# Run tests in watch mode
npx vitest

# Format all source files
npx prettier --write .

# Check formatting
npx prettier --check .
```

## Code & Formatting Conventions

### Indentation
- **Tabs** for all files. Never spaces (enforced by `.editorconfig` and `.prettierrc`).
- YAML files (`.yml`) use spaces (2-space indent).

### Line endings
- LF only. No CRLF.

### Prettier (`.prettierrc`)
- `printWidth`: 140
- `singleQuote`: true
- `semi`: true
- `useTabs`: true

### Imports
- Use ES module syntax (`import` / `export default`).
- No named exports from the worker entry point — only `export default { fetch }`.
- File extensions required: `import worker from '../src'` (Node.js/Workers resolves extensions).

### Naming
- **Variables & functions**: `camelCase` (e.g., `parseCSV`, `renderNavbar`, `csvUrl`).
- **Constants** (module-level): `camelCase` (not UPPER_SNAKE_CASE), though be consistent with existing code.
- **Classes**: Not used in this codebase (avoid introducing if possible).
- **Files**: `kebab-case` for filenames (e.g., `vitest.config.js`).

### Types
- Plain JavaScript. No TypeScript.
- No JSDoc type annotations currently used.

### Module pattern
```js
// src/index.js — single entry point
export default {
  async fetch(request, env) {
    // ...
  }
};
```

All logic lives in `src/index.js`. Avoid creating additional top-level files unless necessary.

### Functions
- Top-level helper functions declared with `function` keyword (not arrow functions assigned to `const`).
- Arrow functions (`=>`) only for inline callbacks: `.map()`, `.filter()`, `.sort()`, etc.
- All render functions (`render*`) return HTML strings.

### HTML String Rendering
- Use template literals (backticks) for all HTML construction.
- SVG icons inline as template literal strings.
- Client-side JS embedded via `<script>` tags inside template literals (using backtick escaping).
- CSS embedded via `<style>` tags inside template literals.
- Avoid introducing a client-side framework.

### API / Request Handling
- Single `fetch(request, env)` handler with URL pathname routing (if/else if chain).
- Return `new Response(body, { headers: { 'content-type': 'text/html;charset=utf-8' } })`.
- Env vars accessed via `env.*` (set in `wrangler.jsonc`).
- Missing query params: return `new Response("message", { status: 400 })`.
- External fetch failures in `/getFavicon` route: catch error, return `{ status: 500 }`.
- Cache-Control headers for proxied resources: `public, max-age=1296000` (15 days).

### Error Handling
- Guard clauses for missing required query parameters.
- `try/catch` around external `fetch()` calls that proxy third-party content.
- Avoid swallowing errors silently — return meaningful error responses.

### State / Side Effects
- No persistent state between requests (Worker is stateless).
- Avoid module-level mutable state. Exception: `IconApiUrl` is set once per request to support fallback logic. Prefer local `const` inside `fetch()`.

### Testing (Vitest)
- Tests use `cloudflare:test` module and `@cloudflare/vitest-pool-workers`.
- Import pattern:
  ```js
  import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
  import { describe, it, expect } from 'vitest';
  import worker from '../src';
  ```
- Two test styles used:
  1. **Unit style**: Call `worker.fetch(request, env, ctx)` directly, with `createExecutionContext()` / `waitOnExecutionContext(ctx)`.
  2. **Integration style**: Use `SELF.fetch(url)` to go through the full Workers runtime.

### What NOT to do
- Do NOT add ESLint (not configured).
- Do NOT add TypeScript (not used in this project).
- Do NOT introduce a frontend framework (React, Vue, etc.).
- Do NOT add a build step (Workers run JS directly).
- Do NOT add JSDoc type annotations (project convention is no types).
- Do NOT create new files unless truly necessary — keep things in `src/index.js`.
