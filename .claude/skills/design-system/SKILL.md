---
name: design-system
description: "Design system rules for MusicPlayer's UI (HTML/CSS/JS) — typography scale, 8px spacing grid, color tokens, and component patterns. Load before writing or editing any CSS, HTML markup, or inline styles in this project."
---

# MusicPlayer Design System

Read this before touching `style.css`, `index.html`, or any markup/styles in this project. It exists so the UI reads as one deliberate system instead of accumulating one-off pixel values.

The app shell is a fixed, non-scrolling `100vh` viewport (`html, body { height: 100%; overflow: hidden; }`, `.app { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }`) — the page itself never scrolls. Inside it: a `.sidebar` pinned to the left edge (artist filter chips) + `.main` (offset via `margin-left: var(--sidebar-width)`, itself `flex: 1; overflow: hidden;`) containing the fixed-height `.topbar` (search) followed by `.library-scroll` — the *only* element that actually scrolls (`flex: 1; overflow-y: auto;`, wraps `.song-row` list + `.empty-state`) — plus a `.player` bar pinned to the viewport bottom that can expand to a full-screen `.player.expanded` overlay. Sidebar, header, search bar, and player are always fully visible; only the library list scrolls internally when it has more tracks than fit. If you add more content to `.main` (e.g. a new section), it must go inside `.library-scroll` (or a similar internally-scrolling sibling) — anything added directly to `.main` outside that scroll container will be clipped by `.main`'s `overflow: hidden` if it doesn't fit, since `.main` no longer grows with its content. **Both persistent chrome panels (`.sidebar` and `.player`) use `position: fixed`, not `sticky` or CSS Grid placement — this is a hard rule, not a style preference.** Both were originally built with `position: sticky` inside a `display: grid` app shell (grid-template-areas for sidebar/main, sticky+height:100vh for the sidebar column). That combination hit a real Chromium/Brave rendering bug: the browser's compositor would advance the scrollbar correctly but fail to repaint the grid's scrolling content, making the whole page appear frozen mid-scroll (confirmed present in Brave, absent on the equivalent mobile layout which never used sticky/grid for these elements). Do not reintroduce `position: sticky` or CSS Grid for the sidebar/player/app-shell layout — if you need a panel to track viewport edges, use `position: fixed` with an explicit offset (`margin-left`/`padding-bottom`) on the sibling that needs to make room for it, exactly as `.main` does for both `.sidebar` (`margin-left: var(--sidebar-width)`) and `.player` (`padding-bottom: calc(var(--player-height) + var(--space-4))`). Keep those offsets in sync if `--sidebar-width` or `--player-height` change.

## Typography scale

Use a fixed type scale — never pick a font size ad hoc. Base unit is `12px`.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 12px | metadata, timestamps, durations, sidebar labels |
| `--text-sm` | 14px | secondary UI text (artist names in rows, chips) |
| `--text-base` | 16px | body/default text, row titles, mini-player title |
| `--text-md` | 20px | brand name, sidebar section headers |
| `--text-lg` | 25px | expanded-player track title |
| `--text-xl` | 32px | page heading ("Your Songs") |
| `--text-icon` | 22px | secondary control icons (prev/next/shuffle/repeat/like) |
| `--text-icon-lg` | 26px | mini-player's main play/pause icon |

Font family stays `Spartan, sans-serif`. Only weights `400` and `700` are loaded — don't reach for `500`/`600`.

Rule: every new `font-size` must be one of the tokens above.

## Spacing system — 8px grid

All margin, padding, gap, and positional offsets must be multiples of 8px (4px allowed only as a half-step, e.g. icon gaps).

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 16px |
| `--space-4` | 24px |
| `--space-5` | 32px |
| `--space-6` | 40px |
| `--space-8` | 64px |

## Color tokens

No random hex codes in new rules. These are defined once on `:root` in `style.css`:

```css
:root {
  --color-bg: #0a0910;        /* page background */
  --color-surface: #141220;   /* sidebar, player bar, row hover */
  --color-surface-alt: #1c1929; /* active row, icon-btn hover bg */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-text: #f5f3f8;
  --color-text-muted: #9891a8;

  --color-purple: #9b3bf5;
  --color-red: #ef2f5e;
  --gradient-accent: linear-gradient(135deg, var(--color-purple), var(--color-red));

  --color-shadow: rgba(0, 0, 0, 0.4);
  --color-shadow-strong: rgba(0, 0, 0, 0.6);
}
```

- **Neutral**: `--color-bg` / `--color-surface` / `--color-surface-alt` step from darkest (page) to lightest (hover), all near-black — no pure black `#000`, it reads flat against the surfaces above it.
- **Primary/brand**: `--gradient-accent` (purple → red, 135deg) — used on the brand mark, the active filter chip, the mini-player's main play button, and the progress fill. This is the one gradient in the system; don't introduce a second, differently-angled or differently-colored gradient elsewhere.
- **Accent (flat, non-gradient)**: `--color-purple` for active/selected state text (active row title, active icon button), `--color-red` for the liked/heart state specifically — red is reserved for "liked," don't reuse it for generic hover.
- Borders are hairlines (`--color-border`, 8% white) since dark-on-dark surfaces need a stroke to read — this is an intentional exception to "no visible borders," specific to this palette.

Any new UI element's color must map to one of these tokens.

## Component patterns

**Sidebar chip** (`.chip`) — pill-shaped artist filter. Default: muted text, no background. Hover: `--color-surface-alt` bg. Active: `--gradient-accent` bg, white text, `font-weight: 700`.

**Song row** (`.song-row`) — grid of `[art | title/artist | like | duration]`. Hover: `--color-surface` bg. Active (currently loaded track): `--color-surface-alt` bg + title in `--color-purple`. Playing: the row's art thumbnail swaps its hover play-icon overlay for an animated 3-bar equalizer (`.eq`) — bars use `--color-purple`/`--color-red` alternating, `eq-bounce` keyframe, no easing library needed for this, plain CSS `@keyframes`.

**Icon buttons** (`.icon-btn`) — 36px circle, `--color-text-muted` default, hover → `--color-text` + `--color-surface-alt` bg, `.active` state → `--color-purple` (or `--color-red` for `.like-btn.active`). The one exception is `.main-button` (play/pause): always filled with `--gradient-accent`, never just an outline/ghost state, since it's the primary action.

**Player bar** (`.player`) — `position: fixed; bottom: 0`, not `sticky`. It was `sticky` originally and silently failed to stay visible on mobile once the sidebar lost its `height: 100vh` at the responsive breakpoint (sticky only anchors while its own flow position scrolls past the viewport — it does not pull the element into view at initial load if the parent's natural height already places it off-screen). If you ever touch player positioning, keep it `fixed`, and keep `.main`'s `padding-bottom` matched to `--player-height`.

`.player-inner` carries generous, symmetric padding at every breakpoint — `--space-3` top / `--space-5` sides / `--space-4` bottom above 560px, `--space-3` all round at ≤560px — plus `max-width: 1200px; margin: 0 auto` so the row stays centered with breathing room instead of stretching edge-to-edge on wide viewports. `--player-height` (root: `136px`, ≤560px: `120px`) must track the *rendered* height of `.player` — if you change this padding, re-measure the actual DOM height (`document.getElementById('player').getBoundingClientRect().height`) rather than eyeballing it; the token only needs to be `>=` that measured height, and being off by even a couple px reopens the mobile overlap bug described above. Verify at multiple widths (desktop, ~700–860px tablet, ~480px, ~375px) since the padding differs by breakpoint and each needs its own clearance check against `.main`'s `padding-bottom`.

**Expanded player** (`.player.expanded`) — same DOM/JS, no duplicate markup: CSS alone repositions `.player-inner` from a horizontal mini-bar into a centered column overlay (`position: fixed; inset: 0`) with a radial purple/red glow (`radial-gradient(..., transparent 60%)` twice, stacked) over `--color-bg`. Toggle via a single `.expanded` class flip (`expandToggle` click, clicking `.now-playing`, or `Escape` to close) — don't add a second player component for the full-screen state. `toggleExpand()` also toggles `body.scroll-locked` (`overflow: hidden`) in lockstep: with `.sidebar` and `.player` both `position: fixed`, leaving `.main`/`body` scrollable underneath a `position: fixed; inset: 0` overlay reintroduces the same class of Chromium/Brave repaint-freeze bug described above — the fix is to stop the background from scrolling at all while the overlay is open, not to change the overlay off `fixed`.

Watch for **flex-context bleed** when reusing `.player-main`/`.now-playing` between the mini-bar (row) and expanded (column) layouts: `.player-main`'s base rule has `flex: 1` because in the row layout it needs to grow next to the fixed-width `.now-playing`. That same `flex: 1` silently carries into `.player.expanded`'s column layout too, where it instead makes `.player-main` stretch to consume all leftover vertical space in `.player-inner` — which breaks `justify-content: center`'s grouping of `.now-playing` + `.player-main` as a unit, and on short/laptop-height windows can push the progress bar below the viewport with no way to reach it. `.player.expanded .player-main` overrides this back to `flex: none`. If you add more shared elements between the two layouts, check every inherited `flex`/`flex-grow` value makes sense in *both* the row and column context, not just the one you're looking at. `.player.expanded` also carries `overflow-y: auto` as a safety net — on any window short enough that the centered content still doesn't fully fit, it becomes scrollable instead of silently clipping content past the viewport edge (same pattern as `.sidebar`'s internal scroll).

**Search input** (`.search`) — pill shape, `--color-surface` bg, `--color-border` hairline, focus-within → border becomes `--color-purple`. No default browser chrome (`outline: none` on the input itself, rely on the wrapper's focus-within border instead).

**Progress bar** (`.progress-container` / `.progress`) — track: `--color-surface-alt`, 4px, `border-radius: 5px`. Fill: `--gradient-accent`, `transition: width 0.1s linear` (fast/linear, not eased — it has to track real playback position).

**Mobile sidebar dropdown** (`.sidebar-top` / `.menu-toggle` / `.sidebar-section` below 860px) — below the breakpoint, `.sidebar` shows only the brand and a `.menu-toggle` hamburger (`.icon-btn`); the artist filter chips move into `.sidebar-section`, absolutely positioned (`top: 100%`) as a dropdown panel toggled by a `.menu-open` class on `.sidebar`, closing on: selecting a chip, clicking outside, or `Escape`. Two things to watch if you touch this: (1) `.menu-toggle` needs the two-part selector `.sidebar-top .menu-toggle` for its `display: none`/`display: flex` rules — a bare `.menu-toggle { display: none }` gets beaten by `.icon-btn`'s `display: flex` (same specificity, `.icon-btn` declared later in the file), which silently makes the hamburger appear on desktop too. (2) inside the dropdown, `.chip-row` reverts to `flex-direction: column` (vertical list, not the old horizontal scroller) since the whole point is readability over a horizontal scroll.

## Avoid generic AI aesthetic

- **Only one gradient direction/palette** (`--gradient-accent`, purple→red 135deg) — don't add a second unrelated gradient (e.g. a generic blue→teal "SaaS" gradient) anywhere else in the UI.
- **No default system font stacks** — stay on Spartan.
- **No box-shadow soup** — one shadow per element via the shared shadow tokens; the "depth" in this UI comes primarily from surface-color steps (`--color-bg` → `--color-surface` → `--color-surface-alt`) and hairline borders, not stacked shadows.
- **No emoji as UI icons** — stay on Font Awesome (`.fas`/`.far`), matching the existing heart/play/shuffle/repeat icon set.
- **Respect the existing scale**: sidebar `260px`, row art `56px` (`48px` on mobile), card/art radii `8px`–`16px`, pill radii `9999px` — don't introduce a fourth ad hoc radius value.
- **Motion stays functional, not decorative**: progress fill and the equalizer bars are the only continuous animations; the expand/collapse transition and hover states should stay quick and linear/ease — no springy/bouncy easing, no scroll-triggered fade-ins.
