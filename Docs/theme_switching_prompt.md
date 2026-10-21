# Prompt: Add Theme 2 and a Theme Switcher (Theme 1 Stays As It Is)

Put these two files in the repo's `docs` folder first:
- `docs/theme1_reference.html` (Theme 1, the existing look)
- `docs/theme2_reference.html` (Theme 2, the new glass look with the mountain header, clouds and light snow)

This prompt is complete on its own. It does not depend on any other document, and it must not change `docs/build_prompt.md` or `docs/data_dictionary.md`.

Paste the prompt below into Antigravity.

---

Add a second theme to the whole application, and a way for each user to choose between the two themes. **Show me a plan first and wait for my approval before writing code.** Change only the look. Do not change any behaviour, data, API or layout logic, except for the two small additions listed under "Saving the choice".

## The two themes

- **Theme 1, "Swat Lake"**, is the existing look. It stays the default and must look exactly as the app looks today. Extract its current values into tokens. Do not redesign it.
- **Theme 2, "Glass Alpine"**, is the new look. It must match `docs/theme2_reference.html` and the specification below.
- The chosen theme applies to **every screen in every portal** (Tourist, Business, Community, Authority), in phone and web layouts, in light and dark mode.

### Theme 1 tokens (existing look)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#E8F1FA` | `#0F1E2B` | page background |
| `--card` | `#FFFFFF` | `#172C3D` | cards |
| `--ink` | `#12324A` | `#E6F1FA` | main text |
| `--mute` | `#5E7A92` | `#93AEC4` | secondary text |
| `--pri` | `#2F7FC1` | `#2F7FC1` | primary buttons, active tab |
| `--soft` | `#D3E6F7` | `#1F3B52` | chips, tags, soft buttons |
| `--acc` | `#F2A33A` | `#F2A33A` | main call to action |
| `--ok` | `#2E9D6B` | `#2E9D6B` | verified, open, available |
| `--bad` | `#D6564A` | `#D6564A` | SOS, closed, danger |
| `--line` | `#D5E3F0` | `#2A4659` | borders |

Cards: 16px radius, 1px border, no heavy shadows. Buttons: 11px radius. Font: Figtree. Headers are plain (title and subtitle on the page background, no scenery, no blur). If any value above differs from what the app currently does, keep what the app does and tell me.

### Theme 2 specification (Glass Alpine)

- **Page background:** `linear-gradient(160deg, #0B2545, #14538F 55%, #3A8FD0)` with two soft glows, `radial-gradient(620px 420px at 88% 6%, rgba(110,205,255,.38), transparent 62%)` and `radial-gradient(520px 420px at 6% 92%, rgba(242,163,58,.24), transparent 62%)`, and a fallback colour `#14538F`. Dark mode uses `#050F1F`, `#0A2B4D`, `#16507F` and weaker glows.
- **Glass surfaces** (only for the page header, tab bar, portal switch, bottom bar, phone frame and popovers): `background: rgba(255,255,255,.15)`, `backdrop-filter: blur(20px) saturate(150%)`, `border: 1px solid rgba(255,255,255,.32)`, 18px radius, `box-shadow: 0 10px 30px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.28)`. Use a solid `rgba(20,60,100,.82)` when `backdrop-filter` is not supported or the user prefers reduced transparency.
- **Cards, tables and forms are always solid white:** `#FFFFFF`, 18px radius, `border: 1px solid #D5E3F0`, `box-shadow: 0 8px 24px rgba(6,24,48,.28)`. Never put glass behind a table or a form.
- **Colours:**

| Token | Value | Use |
|---|---|---|
| `--ink` | `#12324A` | main text on white cards |
| `--mute` | `#5E7A92` | secondary text on white cards |
| `--on-glass` | `#FFFFFF` | text on the gradient and on glass |
| `--on-glass-mute` | `rgba(255,255,255,.76)` | secondary text on glass |
| `--line` | `#D5E3F0` | borders and progress tracks on white |
| `--cta-from` / `--cta-to` | `#FFC96B` / `#F2A33A` | main call to action, 135deg gradient, text `#3A2500`, glow `0 4px 14px rgba(242,163,58,.4)` |
| `--btn-soft` | `#D3E6F7` | secondary button on white, text `--ink` |
| `--ok` / `--ok-bg` | `#17694A` / `#D5F0E3` | confirmed, open, verified, rooms free (3 or more) |
| `--warn` / `--warn-bg` | `#7A4A00` / `#FFE7BD` | waiting, few left (1 or 2), in progress |
| `--bad` / `--bad-bg` | `#8E2A21` / `#FADAD6` | declined, full, SOS, new case |
| `--info` / `--info-bg` | `#0C447C` / `#D3E6F7` | neutral information |
| progress done | `linear-gradient(90deg, #34D399, #2E9D6B)` | completed step |
| progress current | `linear-gradient(90deg, #FBBF24, #F2A33A)` | current step |
| avatar | `linear-gradient(135deg, #6FB2E5, #2F7FC1)` | user avatar |

- **Fonts:** Figtree for all text. Page titles may use Playfair Display.
- **Header scenery:** every portal header is a glass strip over a mountain scene drawn as inline SVG at about 50% opacity, with two faint still clouds in the sky and light snow falling straight down from under each cloud. The snow fades out before the bottom of the strip and never covers text. Destination cards show a scene or photo on top with one faint still cloud. Copy the SVG scenes and the cloud and snow CSS from `docs/theme2_reference.html`. In Theme 1 the header scene renders nothing.

## How to build it

1. **Audit first.** List every place that uses a hardcoded colour, radius, shadow, font or blur outside a shared token. Report the count per portal.
2. **Token layer.** Define all design values as CSS variables per theme under `html[data-theme="lake"]` and `html[data-theme="glass"]`, each with light and dark values that follow `prefers-color-scheme`. Put them in `frontend/src/themes/lake.css` and `glass.css`, with a typed `themes/index.ts` that lists the themes and their flags.
3. **Components read tokens only.** No hex colours and no theme names inside components. Where the structure differs between themes, read a flag such as `theme.hasScenery` or `theme.glassHeader`. Refactor the shared components first: Header, TabBar, BottomBar, Sidebar, Card, Button, Tag, Chip, ProgressBar, DataTable, Modal, Toast, Banner, EmptyState, form fields, ListingCard, DestinationCard, StatCard and the availability grid.
4. **ThemeProvider and `useTheme()`** set `data-theme` on `<html>`. Apply the saved theme in a small inline script in `index.html` before the first paint, so the page never flashes the wrong theme.
5. **Header scene components.** Build a `HeaderScene` (scene, clouds, snow) and a `DestinationScene`, used in all four portals.
6. **Switcher.** Add an **Appearance** section to the Profile screen of every role, with two preview cards (Theme 1 Swat Lake and Theme 2 Glass Alpine, each a small mock of a header and a card) and a radio choice. Choosing one applies at once with no page reload. Add a **Reduce effects** switch that turns off blur, snow and animation. Put the same switcher on the login and register screens, saved in local storage until the user is logged in.

## Saving the choice (the only data change)

- Add two columns to `users`: `theme` (text, `lake` or `glass`, not null, default `lake`) and `reduce_effects` (boolean, not null, default false). Add a migration.
- Accept both fields in the profile update request and return them in the profile response.
- Also keep the choice in local storage. On login, the account value wins. New accounts start on `lake`. A `VITE_DEFAULT_THEME` setting can change the default for new visitors.

## Rules for both themes

- Text contrast of at least 4.5:1 in light and dark mode. Check every status tag and every glass header.
- Colour is never the only signal: status uses colour plus a word or number.
- At most two glass layers stacked, blur at most 20px.
- Snow and clouds respect `prefers-reduced-motion` and the Reduce effects switch.
- Focus rings visible, touch targets at least 44px, and no change in layout or behaviour between themes.
- Maps keep their normal tiles. Charts and tables take their colours from the tokens.

## Screens to cover

Every screen must work in both themes: login and register, all four portal shells in phone and web layouts, every tab, every detail page, modals, toasts, empty states, error pages, and the Profile Appearance section.

## Done when

- The theme can be switched from any role, applies at once everywhere, and survives a page reload and a new login.
- `npm run lint:colors` (add it) fails if a hex colour, `rgb()` or `hsl()` value appears outside `frontend/src/themes/`.
- Tests: the theme is saved and restored through the API, the inline script applies it before paint, and Playwright screenshots exist for each portal's main screen in each theme at phone and desktop width.
- Theme 1 screenshots match the current app. Theme 2 screenshots match `docs/theme2_reference.html`.
- No file other than the theme work, the two new columns, and a short `docs/theme_notes.md` is changed.
- Report back with a table: screen, Theme 1 status, Theme 2 status, and anything that still needs work. Then stop and wait for me.
