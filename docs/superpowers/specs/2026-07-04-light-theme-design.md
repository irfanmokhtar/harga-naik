# Light theme — design

Date: 2026-07-04

## Goal

Add a light "paper terminal" theme to Harga Naik. Dark stays the current look; light is a warm paper variant with the same terminal character. User can toggle; default follows OS preference; choice persists.

## Activation

- `data-theme="light"` / `data-theme="dark"` attribute on `<html>`.
- Inline script in `layout.tsx` `<head>` runs before paint: reads `localStorage.theme`, falls back to `prefers-color-scheme`, sets the attribute. No flash of wrong theme.
- `suppressHydrationWarning` on `<html>` since the script mutates it before hydration.
- Toggle button in Header (terminal-style text label) flips the attribute and writes `localStorage.theme`.
- If no stored preference, follow live OS changes via `matchMedia("(prefers-color-scheme: light)")` listener.

## Palette (light overrides)

All colors already flow through Tailwind `@theme` CSS variables in `app/globals.css`; components use token classes only. Light theme is a `html[data-theme="light"]` block overriding:

| Token | Dark (current) | Light |
|---|---|---|
| `--color-bg` | `#0a0a0a` | `#f4f2ec` warm paper |
| `--color-panel` | `#111111` | `#eceade` |
| `--color-ink` | `#ededed` | `#111111` |
| `--color-dim` | `#8a8a8a` | `#6b6b60` |
| `--color-faint` | `#555555` | `#a3a396` |
| `--color-hairline` | `#262626` | `#d8d5c8` |
| `--color-acid` | `#c6f432` | `#5a7a00` olive (contrast-safe as text) |
| `--color-naik` | `#ff5c5c` | `#c93838` |
| `--color-turun` | `#c6f432` | `#5a7a00` |

Hardcoded bits made theme-aware:

- `::selection` text color (currently hardcoded `#0a0a0a`) → new `--color-selection-ink` var.
- `<select>` arrow SVG fill (hardcoded `%238a8a8a`) → per-theme `background-image` override.

## Out of scope

- Share card canvas (`lib/shareCard.ts`) stays dark always — consistent shared image.
- No new dependencies (no next-themes).

## Testing

- Visual check of home, item, and bakul pages in both themes.
- Toggle persists across reload; system preference respected when nothing stored.
