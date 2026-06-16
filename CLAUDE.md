# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run build        # compile TS → dist/ via esbuild, then web-ext lint
npm run pack         # lint + zip dist/ into web-ext-artifacts/
npm start:firefox    # load extension in Firefox for manual testing
```

There is no test suite. Type-check only (no emit) via `npx tsc --noEmit`.

## Architecture

NotExp is a **Manifest V3 browser extension** (Firefox/Chrome/Edge) that converts a live OneNote web page to open-source note formats — entirely client-side, no server calls.

### Two entry points (both bundled by `build.js` with esbuild)

- **`src/content.ts`** — content script injected into `onenote.officeapps.live.com`. Listens for `convert` and `ping` messages from the popup, then calls `convertNote()`.
- **`src/notexp.ts`** — popup / sidebar UI script. Handles settings persistence (`browser.storage.local` key `o2x-settings`), sends a `ConvertMessage` to the content script when the user clicks Export, and receives `progress` messages back.

### Conversion pipeline (`src/adapters/converter.ts`)

1. `convertNote()` finds the `#WACViewPanel` DOM element (OneNote's page container).
2. Wraps it in a `OneNote` class (`src/onenote/onenote.ts`) that exposes generators (`getStrokes()`, `getImages()`, `getParagraphs()`, `getMath()`) — each walks specific CSS classes in the live DOM to extract positioned elements.
3. Selects an adapter based on `DocumentFormat` enum and calls it:
   - `src/adapters/xournalpp/xournalpp-adapter.ts` → `.xopp`
   - `src/adapters/rnote/rnote-adapter.ts` → `.rnote`
   - `src/adapters/excalidraw/excalidraw-adapter.ts` → `.excalidraw`
4. Each adapter serialises elements using format-specific builder modules under `src/xournalpp/`, `src/rnote/`, `src/excalidraw/`.
5. The resulting `Blob` is downloaded via a synthetic `<a>` click.

### Build pipeline (`build.js`)

`build.js` is the entire build script (not `tsc`):
1. Parses `public/popup.html` for `[nex-i18n]` attributes and auto-populates `_locales/en/messages.json`; marks missing keys in other locales.
2. Bundles `src/content.ts` and `src/notexp.ts` with esbuild (minified ESM).
3. Minifies `public/popup.css` and `public/popup.html` into `dist/`.
4. Copies static assets from `public/` to `dist/`.
5. Strips empty translation strings and writes processed `_locales/` into `dist/`.

### Internationalisation

Translation keys come from `nex-i18n` HTML attributes in `public/popup.html`. The build script auto-generates `_locales/en/messages.json` from those. Other locales live under `_locales/<lang>/messages.json` and are maintained via Weblate. **Do not edit `dist/_locales/` directly** — it is regenerated each build.

## Code style

- All source code comments must be written in **English**.

### Cross-browser compatibility

`webextension-polyfill` normalises Firefox/Chrome APIs. Firefox-only APIs (e.g. `browser.sidebarAction`) are guarded with `if(browser["sidebarAction"])` checks; Chrome-only APIs (e.g. `chrome.sidePanel`) with `if(chrome["sidePanel"])`. The manifest includes both `sidebar_action` (Firefox) and `action` (Chrome/Edge).
