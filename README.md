# hearts

A Hearts card game with three CPU opponents

## Development

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173.

## Scripts

- `npm run dev` — start the dev server with hot reload
- `npm run build` — produce a production build in `dist/`
- `npm run preview` — preview the production build locally
- `npm run typecheck` — run TypeScript without emitting
- `npm run lint` — run ESLint (zero warnings allowed)

## Architecture

This project follows a small set of conventions designed to make changes easy and to support migrating from local storage to a remote backend without rewriting application code.

**Data access** lives in `src/data/`. All persistence goes through DAOs returned by the abstract `Factory` (`src/data/Factory.ts`). The default factory uses LocalStorage-backed DAOs. To migrate to a real backend later, implement a new factory and swap the `daoFactory` export — application code does not change.

**Components** are split between two directories:

- `src/components/ui/` is the registry of reusable compositions. See `src/components/ui/REGISTRY.md` for what's available.
- `src/components/features/` holds feature-specific components. Each file declares its feature via a `@module <name>` JSDoc tag.

**State** is split between Zustand stores (`src/state/`) for cross-component state and React `useState` for component-local state. Stores typically wrap a DAO and own the in-memory cache.

**Routing** is declared in `src/router/index.tsx`. All routes live in one file until there are 20+.

**Logging** uses the `logger` singleton from `src/logger`. In development, the last ~200 log entries are accessible via `window.__logs` for debugging — copy that into a bug report when something breaks.

## Environment

Copy `.env.example` to `.env` and fill in any variables your code needs. Only variables prefixed with `VITE_` are exposed to the client.

## Conventions worth knowing

- **Strict TypeScript**: the project enforces strict mode plus a few extra strictness flags. All code compiles cleanly under these rules.
- **MUI for UI**: every primitive (buttons, inputs, dropdowns, etc.) uses `@mui/material`. Styling uses MUI's `sx` prop and the theme defined in `src/theme.ts`.
- **Forms**: `react-hook-form` for state, `zod` for validation. Validation schemas live in `src/data/<Entity>.ts` next to the entity definition.
- **No tests** ship with this scaffold; the `verify` skill checks build correctness via typecheck, lint, and a few structural invariants.

## Deployment

This is a static React app. The `npm run build` output goes to `dist/`, which can be served by any static host (Netlify, Vercel, GitHub Pages, S3, Cloudflare Pages, etc.). See the `deploy` skill for host-specific setup.
