# AGENTS.md — edhen-erp-front

Textile-manufacturing ERP (Spanish UI): standalone React 19 + TypeScript + Vite 8 SPA. Its
backend is **Google Apps Script + Google Sheets**, not the sibling `edhen-pos-back` Spring app.
`../AGENTS.md` is stale for this folder: it is a normal tracked repo, not mock-only/untracked.

`README.md` is inherited from the POS project and is wrong here (mentions H2, Lucide, backend
folders). Trust `package.json`, `vite.config.ts`, and `src/`.

## Commands (verified)

```powershell
.\run.bat              # npm install if needed, then npm run dev -> :5173
npm run dev
npx tsc -b             # real typecheck; `npx tsc --noEmit` checks nothing (solution-style tsconfig)
npm run build          # tsc -b && vite build (succeeds; warns about a >500 kB chunk)
npm run lint           # always fails today, see below
```

- `npm run lint` exits 1 before linting: `eslint.config.js:15` passes
  `reactHooks.configs['recommended-latest']` (legacy format) into ESLint 10 flat config. Verify
  changes with `npx tsc -b`; fixing lint is a separate change.
- There is no test runner, test script, or test file. CI uses Node 22.
- Push to `main` deploys via `.github/workflows/deploy.yml` (`npm ci` + `npm run build` with the
  `VITE_API_URL` repo variable, copies `index.html` to `404.html`, deploys Pages). `npm run deploy`
  also exists but pushes a `gh-pages` branch; prefer the workflow.
- `.env.development` is tracked on purpose and holds the default GAS URL. `.gitignore` ignores
  `node_modules`, `dist`, `*.local`, `.env`, and `.DS_Store`.

## Architecture / data flow

- `src/main.tsx` mounts `BrowserRouter` with `basename={import.meta.env.BASE_URL}` and
  `ErpStoreProvider`. `src/App.tsx` routes `/resumen`, `/rollos`, `/articulos`, `/carga-capas`,
  `/cortes`, `/talleres`, `/pagos`, `/ajustes`; `/`, `/stock`, and unknown paths redirect to
  `/resumen`.
- Feature code lives in `src/features/<dominio>/{pages,components}`; reusable UI in
  `src/shared/{layout,components}`. There is no features barrel or shared API layer beyond
  `gasClient.ts`.
- Business state lives in `src/data/erpStore.tsx` (`useErpStore`). On boot it reads localStorage
  `edhen_erp_data_v1`, falls back to `src/data/mock.ts` demo data per entity, then asynchronously
  replaces **non-empty** arrays from Sheets.
- Writes are local-first and fire-and-forget: mutations update state then call `postGasAction`
  (batched via `postGasBatch` where available); failures only log. "Sincronizar Sheets" pulls
  `?action=bootstrap` and **overwrites** local state — it never pushes. Manual sync also accepts
  empty arrays, so syncing can clear an entity that is empty in Sheets.
- `src/api/client.ts` (axios) is unused dead code. All HTTP is `fetch` in `gasClient.ts`; do not
  add calls to `client.ts`.
- GAS URL resolution: localStorage `edhen_erp_gas_url` → `VITE_API_URL` → hardcoded
  `DEFAULT_GAS_URL` in `gasClient.ts`. Ajustes can override it per browser.
- Ajustes backup/restore, "limpiar todo", and "restablecer demo" only change local state +
  localStorage; they do **not** write to Sheets. A later sync or reload re-imports Sheet data.
- Fabric/color/model catalogs are hardcoded in `src/data/mock.ts` (`mockTelas`, `mockColores`,
  `mockModelos`) and rendered as form selects. Sheets' `Telas`/`Colores` tabs are read but ignored
  by the store; adding a new tela/color/modelo requires editing code.
- Styling is Tailwind v4 through `@tailwindcss/vite`; global CSS is `src/index.css`
  (`@import "tailwindcss"`). There is no `tailwind.config.js`. UI copy is Spanish; reuse
  `formatARS` for money and `fechaISO`/`toISODate` for dates.

## Google Sheets backend (manual deploy)

- `google-apps-script/Codigo.gs` is the live API (`doGet`, `doPost`; actions: `bootstrap`,
  `guardarArticulo`, `guardarCorte`, `guardarEncimada`, `guardarCompra`, `guardarPago`,
  `guardarTaller`, `guardarProveedor`, `actualizarEstadoCorte`, `eliminarArticulo`,
  `eliminarEncimada`, `eliminarTaller`, `guardarVarios`, `migrarTodo`). npm never builds or tests
  it: paste into the Apps Script editor and redeploy the Web App after changes.
- `google-apps-script/README.md` documents first-time setup. The Web App must run as the owner
  with access "Cualquiera" or browser fetches fail.
- Nested objects are persisted as `<field>_json` columns and parsed back on read; IDs are
  stringified so strict `===` comparisons work. `upsertFila` appends missing columns, but keep
  `inicializarHojas()` and the seed script in sync so fresh sheets have the expected schema.
- `CargarDatosReales.gs` and `src/data/datosReales.ts` are seed/import data for
  `2026-TEXTIL.xlsx`, not runtime data. `datosReales.ts` is not imported anywhere.

## Non-obvious behavior to preserve

- Stock is never stored; derive it via
  `stockDesdeCompras(compras, usosStockDesdeDatos(encimadas, articulos))`. Lotes are keyed
  `${compra.codigo}-${lote.id}`; usage without a matching lote is applied FIFO by tela/color,
  oldest `compra.fecha` first. `mockStock` is only the demo-data fallback.
- `saveEncimada` regenerates/updates the `Articulo`s linked to that encimada (`encimadaId` +
  `encimadaItemId`) and pushes them to Sheets; deleting an encimada renumbers the rest.
- `erpStore` renumbers `ART-`/`ENC-` codes consecutively on delete/sync
  (`normalizarCodigos` + `renumerarConsecutivos`) and repairs descriptions like
  `Encimada ENC-…`. It also auto-creates a `Corte` for an article with `tallerId` but no
  `corteId`. These are deliberate.
- `deletePagoTaller` removes the payment only locally — there is no GAS delete action for pagos.
- Dates are stored as `YYYY-MM-DD` (`fechaISO`, `toISODate`), not UTC ISO strings. Sheets returns
  full ISO timestamps; `toISOString()` shifts the day and breaks `<input type="date">`.
- Build `base` is `/edhen-erp-front/` (dev is `/`), and CI copies `index.html` to `404.html` for
  SPA deep links. Do not hardcode absolute asset or route paths.
- Sources mix CRLF and LF; match the file you edit instead of normalizing line endings.
- Do not commit `dist/` or local `.env` files; `.env.development` is the checked-in default.
