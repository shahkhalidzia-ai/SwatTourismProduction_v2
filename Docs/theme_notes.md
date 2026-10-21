# Theme 1 (Swat Lake) & Theme 2 (Glass Alpine) Architecture & Notes

## 1. Overview
This document details the multi-theme architecture implemented for the Swat Tourism platform. The system introduces **Theme 2 ("Glass Alpine")** while keeping **Theme 1 ("Swat Lake")** as the 100% pixel-perfect baseline default.

- **Theme 1 ("Swat Lake")**: The default, calm, clean baseline look. Features crisp water-blue palette (`#E8F1FA` light / `#0D1A26` dark), flat solid headers, standard card borders, and no mountain scene or snow particles.
- **Theme 2 ("Glass Alpine")**: A luxury mountain alpine aesthetic matching `Docs/theme2_reference.html`. Features dynamic deep alpine gradients (`#0B2545` to `#14538F`), subtle radial glows, frosted glass surfaces (`backdrop-filter: blur(20px)`), layered SVG mountain silhouettes with faint clouds, and vertical falling snow particles fading smoothly before the header bottom. Cards, tables, and forms strictly maintain solid `#FFFFFF` backgrounds and 18px radii for readability and WCAG contrast.

---

## 2. Technical Architecture

### 2.1 Tokens & Stylesheets
- **Theme 1 Tokens**: [`frontend/src/themes/lake.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/themes/lake.css)
- **Theme 2 Tokens**: [`frontend/src/themes/glass.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/themes/glass.css)
- **Geometry & Layout**: [`frontend/src/design/tokens.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/design/tokens.css)
- **Unified Portal Classes**: [`frontend/src/index.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/index.css)

Both themes expose identical variable names (`--bg`, `--card`, `--ink`, `--mute`, `--pri`, `--soft`, `--acc`, `--ok`, `--bad`, `--line`, `--shadow-card`, `--radius-card`, etc.), ensuring zero template coupling.

### 2.2 Zero-Flicker Pre-Paint Script
To eliminate Flash of Unstyled Content (FOUC), an inline synchronous script is embedded in `<head>` of [`frontend/index.html`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/index.html). It reads `localStorage.getItem('swat_theme')` and immediately assigns `data-theme` and `data-reduce-effects` to `document.documentElement` before any DOM elements are painted.

### 2.3 State Management & Backend Synchronization
- **Context**: [`frontend/src/context/ThemeContext.tsx`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/context/ThemeContext.tsx) provides `useTheme()` with `theme`, `reduceEffects`, `setTheme()`, and `setReduceEffects()`.
- **Backend Schema & Migration**: Added `theme` (VARCHAR(20), default `'lake'`) and `reduce_effects` (BOOLEAN, default `False`) columns to the `users` table via Alembic migration `e58b1c4021fa`.
- **API Persistence**: [`/api/v1/auth/profile`](file:///f:/Antigravity/SwatTourismProduction_v2/backend/app/modules/accounts/router.py) receives and persists updates to the user account, which are restored on subsequent logins.
- **Local Storage Fallback**: Visitors and unauthenticated users have their choices persisted in `localStorage` until authenticated.

### 2.4 Visual Scenery & Accessibility
- **Header Scene**: [`frontend/src/components/HeaderScene.tsx`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/components/HeaderScene.tsx) renders realistic mountain vector silhouettes, gentle clouds, and drifting snow particles only when `data-theme="glass"`. When in Theme 1 ("Swat Lake"), it renders nothing.
- **Motion & Visual Effect Reduction**: Fully respects both the OS-level `prefers-reduced-motion` media query and the user-controlled "Reduce visual effects" switch, which replaces glass blurs with solid fallbacks and halts particle animations.
- **Contrast**: All cards, tables, inputs, and forms maintain solid `#FFFFFF` backgrounds and minimum 4.5:1 text contrast.

---

## 3. Screen Status & Verification Matrix

| Screen / Component | Theme 1 (Swat Lake) Status | Theme 2 (Glass Alpine) Status | Anything That Still Needs Work |
| :--- | :--- | :--- | :--- |
| **Login & Register Screen** (`LoginPage.tsx`) | ✅ Complete (Original calm blue, full persona switcher) | ✅ Complete (Alpine backdrop, frosted glass card, live Theme Appearance picker) | None |
| **Tourist Portal Shell** (`TouristShell.tsx`) | ✅ Complete (Baseline look, flat lake header) | ✅ Complete (Mountain header scene, frosted tab bar, solid white cards) | None |
| **Tourist Explore & Trips** (`explore_trips.test.tsx`) | ✅ Complete (Verified listing cards, Rule 4 trip pricing) | ✅ Complete (18px radius cards, alpine token accents) | None |
| **Business Portal Shell** (`BusinessShell.tsx`) | ✅ Complete (Baseline operational view) | ✅ Complete (Mountain header banner, frosted action bar, Theme Appearance section in Profile) | None |
| **Restaurant & Menu Manager** | ✅ Complete (Original trout & kebab cards, dishes showcase) | ✅ Complete (Solid white food cards, high-contrast typography) | None |
| **Transport Provider Portal** | ✅ Complete (Fleet management, order confirmation) | ✅ Complete (Glass header, tokenized vehicle status chips) | None |
| **Hotel Management Portal** | ✅ Complete (Room rates, amenity badges) | ✅ Complete (Solid white room listings, luxury alpine badges) | None |
| **Community Portal Shell** (`CommunityShell.tsx`) | ✅ Complete (Stories, crafts, local services) | ✅ Complete (Mountain banner, frosted tabs, Theme Appearance section) | None |
| **Authority Portal Shell** (`AuthorityShell.tsx`) | ✅ Complete (Command hub KPIs, approval queue) | ✅ Complete (Frosted command header, Theme Appearance section under Overview KPIs) | None |
| **Web & Phone Responsive View** (`ViewSwitch.tsx`) | ✅ Complete (Seamless toggle across all 4 portals) | ✅ Complete (Adaptive phone frame with frosted header and bottom bar) | None |
| **Role Switcher Bar** (`RoleSwitcherBar.tsx`) | ✅ Complete (Accessible in universal demo mode) | ✅ Complete (Frosted glass floating pill with theme toggle) | None |
| **Modals, Drawers & Popovers** (`Card.tsx`, `DataTable.tsx`) | ✅ Complete (Solid white cards, standard shadows) | ✅ Complete (Solid `#FFFFFF` cards, 18px radius, frosted glass modal backdrop) | None |

---

## 4. Verification & Testing Evidence
1. **Linter**: `npm run lint:colors` passes with 0 violations across all CSS stylesheets outside `frontend/src/themes/`.
2. **Unit Tests (Frontend)**: 20 test files and 101 tests pass (`vitest run`).
5. **Production Build**: `npm run build` succeeds cleanly (`tsc -b && vite build`) with 0 errors.

---

## 5. Header Contrast & Non-Faded Architecture Resolution

### Root Cause of the Faded Header:
1. **White-on-White Bleaching**: Controls in `App.tsx` (`ViewSwitch`, user persona badge, and `Log Out`) and `TourismAnimatedBanner.tsx` had hardcoded `color: '#FFFFFF'` and semi-transparent white backgrounds (`rgba(255, 255, 255, 0.12)`). When rendered against a light page background (`#E8F1FA` in Theme 1 or an unanchored light header in Theme 2), white text on white was washed out and virtually illegible.
2. **Stacked Translucent Overlays in Theme 2**: The banner had multiple overlapping white gradient layers (sunbeam sweep at 45% white, cloud blur at 20% white, and mountain polygons with white opacity) without a deep alpine backdrop, causing an opaque milky white haze across the entire banner.

### Fix Implemented:
1. **Semantic Header Tokens**: Introduced `--header-bg`, `--header-border`, `--header-shadow`, `--header-ink`, `--header-mute`, `--header-pill-bg`, `--header-pill-ink`, `--header-pill-active-bg`, and `--header-logout-*` into both [`lake.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/themes/lake.css) and [`glass.css`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/themes/glass.css).
2. **Theme 1 ("Swat Lake")**: The header card is now rendered with solid pure white background (`var(--header-bg)`), crisp dark navy text (`#12324A`), muted blue subtitle (`#5E7A92`), soft blue spotlight ticker, and solid pill buttons with high-contrast ink text. Zero fading!
3. **Theme 2 ("Glass Alpine")**: The header card is anchored with a rich, deep alpine night sky gradient (`#091D36` to `#103F6E` to `#19588F` with glowing cyan/amber radial flares). Layered mountain peaks (`HeaderScene.tsx`) now use dark alpine bases with snow-capped peaks, making snow particles and white Playfair typography razor-sharp with 100% WCAG AAA contrast.
4. **Header Action Controls**: Updated [`ViewSwitch.tsx`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/design/ViewSwitch.tsx) and [`App.tsx`](file:///f:/Antigravity/SwatTourismProduction_v2/frontend/src/App.tsx) to use `--header-pill-*` tokens so the Web/Phone switcher, user identity badge, and Log Out button are crisp and clear in both themes.

