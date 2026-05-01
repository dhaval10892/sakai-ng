# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Sakai-NG is a purely frontend Angular 21 admin dashboard template using PrimeNG components, Tailwind CSS, and Chart.js. There is no backend — all data is hardcoded/mocked in TypeScript services.

### Prerequisites

- **Node.js 22+** (installed via nvm)
- Git submodule `src/assets` must be initialized: `git submodule update --init --recursive`

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm start` (serves on `http://localhost:4200`) |
| Build | `npm run build` |
| Format check | `npx prettier --check "src/**/*.{ts,html}"` |
| Format fix | `npm run format` |

### Caveats

- **No unit tests exist** — the project has no `*.spec.ts` files. `npm test` will fail with "no spec files found."
- **ESLint config is legacy** — `eslint.config.js` references `@angular-eslint` and `@typescript-eslint` plugins/extensions that are not listed in `package.json`. Running `npx ng lint` or `npx eslint` will fail. Use `npx prettier --check` for code style checks instead.
- **Do not run `npx ng add @angular-eslint/schematics`** — it overwrites `eslint.config.js` and `angular.json` with incompatible changes and fails to install due to peer dependency conflicts.
- **Git submodule for assets** — `src/assets` is a git submodule (sakai-assets repo). If styles/themes are missing, run `git submodule update --init --recursive`.
- **nvm must be sourced** in new shells: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
