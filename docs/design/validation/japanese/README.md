# Japanese localization verification

Japanese is available at `/ja/` and in the shared English / Español / 日本語 language picker. `src/data/ja.json` contains **327 translated strings**. Unit tests enforce matching keys, non-empty values, and identical interpolation placeholders across all three dictionaries.

## Results

| Check | Result |
| --- | --- |
| `npm test` | 24 tests passed. |
| `npm run build` | Three static routes generated: `/`, `/es/`, `/ja/`. |
| `git diff --check` | Passed; only Git's existing LF/CRLF conversion warnings. |
| Production browser validation | 42 checks passed, no page errors. See [results.json](results.json). |
| Responsive matrix | 30 combinations: three languages × two themes × 360, 390, 768, 1024 and 1440 CSS pixels. No horizontal overflow or clipped headings/controls; one h1 and circular clock dial. |
| README images | All ten image targets resolve to existing local files. |

## Verified behavior

- Correct document language, metadata, headings, work-history dates, widget labels and fresh Kanban sample tasks on each route.
- Three-option language dropdown, active/selected states, Home/End/arrow keys and Escape at each viewport width.
- Keyboard navigation EN → ES → JA → EN at mobile and desktop widths, retaining `#projects`, manual/Auto theme mode and saved task titles.
- Conway editing, Play/Pause, generation updates, empty-board message, Random, Reset and resizing, including translated runtime announcements and cell labels.
- Japanese task input, localized validation, movement with Enter, deletion, Undo, reset, persistence and recovery after reload.
- Theme changes retain widget node identity, paused board, selected city and unfinished input.
- Localized clipboard success and failure feedback.
- Japanese content and three language fallback links with JavaScript disabled, with controls correctly unavailable.

Fresh Kanban sample tasks use the selected language. Existing saved titles remain unchanged when switching languages. The Japanese page retains the original profile, companies, technology names, education and spoken-language claims.

## Screenshots

| View | Light | Dark |
| --- | --- | --- |
| Desktop home | [1440 px](ja-light-1440-home.png) | [1440 px](ja-dark-1440-home.png) |
| Mobile home | [390 px](ja-light-390-home.png) | [390 px](ja-dark-390-home.png) |
| Desktop Lab | [1440 px](ja-light-1440-lab.png) | [1440 px](ja-dark-1440-lab.png) |
| Mobile Lab | [390 px](ja-light-390-lab.png) | [390 px](ja-dark-390-lab.png) |

Screenshots use saved theme preferences and wait for fonts and transitions. Isolated Lab captures make the header static and hide the offscreen skip link to avoid fixed-element capture artifacts; the application itself is unchanged.

## Reproduce

```sh
npm test
npm run build
node docs/design/validation/run.cjs japanese.cjs
git diff --check
```

Browser checks require Chrome and an existing Playwright installation. Set `PLAYWRIGHT_PATH` to its package path if the default local cache path is unavailable. The runner serves the production build on a temporary local port and closes that server afterward. Browser contexts are isolated from personal browsing data.

Validation used Chrome with emulated viewport sizes. Physical devices, native Japanese IME composition and other browser engines were not tested. No standalone TypeScript checker is configured; the build is not a complete type check. The original design validation in the parent directory predates this localization; this folder records the new checks without replacing its historical captures/results.
