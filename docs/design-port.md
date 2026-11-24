# Design port guide

How the reference design becomes `@orbit/ui` components. Ports TASK-15.22 to 15.33 follow this guide. TASK-15.20 set it up.

- **Design of record:** the legacy Astro components of `orbit-hub-builder`, pinned at commit `86abe78`: the 9 components in `src/components/catalog/{layout,content,media}/*.astro` and the 4 layouts in `src/layouts/themes/*ThemeLayout.astro`.
- **No Tailwind in `@orbit/ui`.** Each Tailwind utility becomes plain CSS in the component's own stylesheet, written with the `--orbit-*` tokens below. The table in [Tailwind to CSS](#tailwind-to-css) gives the translation for every utility the reference uses.
- **Read the reference** with `git -C <orbit-hub-builder> show 86abe78:<path>`.

## Stylesheet layout

`src/styles/orbit-tokens.css` is the file exported as `@orbit/ui/styles.css`. Consumers import it unchanged (`import '@orbit/ui/styles.css'`, or `?inline` in the Puck editor iframe). Vite, Astro and the browser resolve its `@import` lines.

| File | Holds |
| --- | --- |
| `src/styles/orbit-tokens.css` | The `@import` list first, then `:root` with every default token. An `@import` placed after a rule is ignored, so imports always come first. |
| `src/styles/shell.css` | Document base, `ThemeShell`, `.orbit-container`, `.orbit-section`, `.orbit-heading`, `.orbit-card`, `.orbit-btn-*` and the Appearance alignment overrides. |
| `src/styles/themes.css` | Per-theme structural tokens (`[data-orbit-theme="…"]`) and theme rules that apply to no single component. |
| `src/styles/components/<name>.css` | Everything one component needs, including theme-scoped rules for that component. |

One stylesheet exists per catalog component, plus `fallback.css`: `header`, `hero-banner`, `image-and-text`, `text`, `link`, `image`, `youtube`, `document-download-center`, `interactive-slideshow`, `clinical-study-card-grid`, `medical-inquiry-form`, `restricted-video-player`, `check-in-scanner`, `schedule-timeline`, `user-favorite-tracker`. Two shared sheets sit next to them: `cta.css` (the shared CTA) and `inline-dam-trigger.css` (the editor's inline DAM trigger), both added by TASK-15.21. They are imported right after `themes.css` and before every component sheet, so a component's own rules can adjust them with equal specificity.
All of these sheets are already imported, so **a port edits only its own `components/<name>.css`** and never the entry stylesheet.

`src/styles/__tests__/stylesheet.test.ts` enforces this layout:

- Every file in `components/` is imported exactly once from the entry stylesheet.
- Every `@import` comes before the first rule of its stylesheet.
- `@media` width conditions use only the breakpoints below.
- `--orbit-*` tokens are defined only in `orbit-tokens.css` and `themes.css`. A component stylesheet consumes tokens and never defines them.
- Every rule of `orbit-tokens.css` v0.3.0 is still present and unchanged. The baseline is `src/styles/__tests__/fixtures/orbit-tokens.v0.3.0.css`. A port that deliberately replaces a v0.3.0 rule (for example the theme rules in `header.css` and `hero-banner.css`) removes that rule from the fixture in the same commit.

## Token contract

All tokens are defined on `:root` in `orbit-tokens.css`. The host overrides the colour and font tokens per site (Symfony `css_variables`). The structural tokens change per theme in `themes.css`.

### Colour and font

| Token | Default | Use |
| --- | --- | --- |
| `--orbit-color-background` | `#ffffff` | Page background |
| `--orbit-color-surface` | `#f7f7f8` | Cards, bars, raised areas |
| `--orbit-color-text` | `#111827` | Body text |
| `--orbit-color-accent` | `#111827` | Brand colour: links, filled buttons, hero background |
| `--orbit-color-border` | `#e5e7eb` | Borders and dividers |
| `--orbit-color-on-accent` | `#ffffff` | Text on top of `--orbit-color-accent` |
| `--orbit-font-body` | `'Inter', ui-sans-serif, system-ui, sans-serif` | Body text |
| `--orbit-font-heading` | `'Inter', ui-sans-serif, system-ui, sans-serif` | Headings and brand text |
| `--orbit-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` | Codes and identifiers |

### Structure (per theme)

| Token | Default (`:root`) | `clean` | `editorial` | `clinical` | `bold` |
| --- | --- | --- | --- | --- | --- |
| `--orbit-container-max-width` | `72rem` | `72rem` | `68rem` | `76rem` | `80rem` |
| `--orbit-section-spacing-y` | `4rem` | `4rem` | `5.5rem` | `3.5rem` | `5rem` |
| `--orbit-radius-base` | `0.5rem` | `0.5rem` | `0.125rem` | `0.75rem` | `1rem` |
| `--orbit-radius-lg` | `0.75rem` | `0.75rem` | `0.25rem` | `1rem` | `1.5rem` |
| `--orbit-radius-button` | `0.5rem` | `0.5rem` | `0rem` | `9999px` | `0.75rem` |
| `--orbit-border-width` | `1px` | `1px` | `1px` | `1px` | `2px` |
| `--orbit-card-shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.06)` | (default) | `none` | (default) | (default) |

The source of truth for these values is `SiteTheme::getStructuralTokens()` in `orbit-hub`. They match it except `--orbit-card-shadow`. Symfony defines `0 4px 16px -2px rgb(15 23 42 / 0.08)` for `clinical` and `0 10px 25px -5px rgb(0 0 0 / 0.12)` for `bold`, and `themes.css` does not set them yet. TASK-15.31 aligns them. Ports do not change per-theme values.

### Type scale

Each size is paired with its line height, as in Tailwind v4. Use both together.

| Size token | Value | Line-height token | Value |
| --- | --- | --- | --- |
| `--orbit-font-size-xs` | `0.75rem` | `--orbit-line-height-xs` | `calc(1 / 0.75)` |
| `--orbit-font-size-sm` | `0.875rem` | `--orbit-line-height-sm` | `calc(1.25 / 0.875)` |
| `--orbit-font-size-base` | `1rem` | `--orbit-line-height-base` | `1.5` |
| `--orbit-font-size-lg` | `1.125rem` | `--orbit-line-height-lg` | `calc(1.75 / 1.125)` |
| `--orbit-font-size-xl` | `1.25rem` | `--orbit-line-height-xl` | `calc(1.75 / 1.25)` |
| `--orbit-font-size-2xl` | `1.5rem` | `--orbit-line-height-2xl` | `calc(2 / 1.5)` |
| `--orbit-font-size-3xl` | `1.875rem` | `--orbit-line-height-3xl` | `calc(2.25 / 1.875)` |
| `--orbit-font-size-4xl` | `2.25rem` | `--orbit-line-height-4xl` | `calc(2.5 / 2.25)` |
| `--orbit-font-size-5xl` | `3rem` | `--orbit-line-height-5xl` | `1` |

| Token | Value |
| --- | --- |
| `--orbit-line-height-relaxed` | `1.625` |
| `--orbit-font-weight-medium` | `500` |
| `--orbit-font-weight-semibold` | `600` |
| `--orbit-font-weight-bold` | `700` |
| `--orbit-letter-spacing-tight` | `-0.025em` |
| `--orbit-letter-spacing-wider` | `0.05em` |
| `--orbit-letter-spacing-widest` | `0.1em` |

### Spacing scale

`--orbit-space-N` equals the Tailwind step `N` (steps of `0.25rem`). A `-5` suffix stands for `.5`, so `--orbit-space-2-5` is Tailwind `2.5`.

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `--orbit-space-0-5` | `0.125rem` | `--orbit-space-4` | `1rem` |
| `--orbit-space-1` | `0.25rem` | `--orbit-space-5` | `1.25rem` |
| `--orbit-space-1-5` | `0.375rem` | `--orbit-space-6` | `1.5rem` |
| `--orbit-space-2` | `0.5rem` | `--orbit-space-8` | `2rem` |
| `--orbit-space-2-5` | `0.625rem` | `--orbit-space-10` | `2.5rem` |
| `--orbit-space-3` | `0.75rem` | `--orbit-space-12` | `3rem` |
| `--orbit-space-3-5` | `0.875rem` | `--orbit-space-16` | `4rem` |

### Max widths

| Token | Value |
| --- | --- |
| `--orbit-max-width-2xl` | `42rem` |
| `--orbit-max-width-3xl` | `48rem` |
| `--orbit-max-width-5xl` | `64rem` |
| `--orbit-max-width-6xl` | `72rem` |
| `--orbit-max-width-7xl` | `80rem` |
| `--orbit-container-max-width` | per theme, see above |

### Legacy aliases

`--hub-bg`, `--hub-surface`, `--hub-text`, `--hub-primary`, `--hub-secondary`, `--hub-border`, `--hub-font` and `--hub-font-heading` map to the canonical tokens. They exist for older consumers. New CSS uses the `--orbit-*` names.

The reference's Tailwind theme names map to the same tokens:

| Reference name | Token |
| --- | --- |
| `hub-bg` | `--orbit-color-background` |
| `hub-surface` | `--orbit-color-surface` |
| `hub-text` | `--orbit-color-text` |
| `hub-primary`, `hub-secondary` | `--orbit-color-accent` |
| `hub-border` | `--orbit-color-border` |
| `font-hub`, `font-hub-heading` | `--orbit-font-body`, `--orbit-font-heading` |
| `rounded-hub-base`, `rounded-hub-lg`, `rounded-hub-btn` | `--orbit-radius-base`, `--orbit-radius-lg`, `--orbit-radius-button` |
| `max-w-hub-container` | `--orbit-container-max-width` |
| `shadow-hub-card` | `--orbit-card-shadow` |

## Breakpoints

The Tailwind breakpoints, always `min-width`. CSS variables do not work inside `@media`, so these are constants:

| Name | Query |
| --- | --- |
| `sm` | `@media (min-width: 40rem)` |
| `md` | `@media (min-width: 48rem)` |
| `lg` | `@media (min-width: 64rem)` |
| `xl` | `@media (min-width: 80rem)` |

No other width condition is allowed: no `max-width`, no range syntax (`width >= …`), no other values. Conditions that are not about width, such as `(hover: hover)`, are allowed.

## Class names and inline styles

- **BEM with the `orbit-` prefix:** block `.orbit-<block>`, element `.orbit-<block>__<element>`, variant `.orbit-<block>--<variant>`. The block is the component's stylesheet name: `.orbit-hero-banner`, `.orbit-hero-banner__title`, `.orbit-hero-banner--split`. The reference's `hub-*` hooks become `orbit-*` (`hub-header__logo` becomes `orbit-header__logo`).
- Keep the existing `data-orbit-block="<ComponentName>"` attribute on the component root. Theme rules and Appearance overrides use it.
- **Inline styles only for values that come from a prop**, such as an aspect ratio chosen in the schema or a colour picked in Appearance. Fixed values go in the stylesheet.
- No Tailwind preflight ships with `@orbit/ui`. Reset what the reference silently relied on in the component's own rules: margins on headings, `p`, `ul`, `figure`; `list-style` and padding on lists; `display: block` on `img` and `iframe`; and `box-sizing: border-box` where widths and padding are combined. Scope every reset to the component's own classes. Never write global element selectors.

## Tailwind to CSS

Every utility used by the 13 reference files is listed here. `N` stands for the Tailwind step.

### Variants

| Utility form | CSS |
| --- | --- |
| `hover:<utility>` | `.orbit-x:hover { … }` inside `@media (hover: hover)`, as Tailwind v4 emits it |
| `sm:<utility>` | inside `@media (min-width: 40rem)` |
| `md:<utility>` | inside `@media (min-width: 48rem)` |
| `<colour>/<N>` (opacity modifier) | `color-mix(in oklab, var(<colour token>) N%, transparent)` |

### Layout and position

| Utility | CSS |
| --- | --- |
| `absolute` | `position: absolute` |
| `relative` | `position: relative` |
| `sticky` | `position: sticky` |
| `inset-0` | `inset: 0` |
| `top-0` | `top: 0` |
| `isolate` | `isolation: isolate` |
| `-z-10` | `z-index: -10` |
| `z-40` | `z-index: 40` |
| `overflow-hidden` | `overflow: hidden` |
| `overflow-x-auto` | `overflow-x: auto` |

### Display, flexbox and grid

| Utility | CSS |
| --- | --- |
| `flex` | `display: flex` |
| `inline-flex` | `display: inline-flex` |
| `inline-block` | `display: inline-block` |
| `grid` | `display: grid` |
| `flex-1` | `flex: 1` |
| `flex-col` | `flex-direction: column` |
| `flex-wrap` | `flex-wrap: wrap` |
| `shrink-0` | `flex-shrink: 0` |
| `items-start` | `align-items: flex-start` |
| `items-center` | `align-items: center` |
| `items-end` | `align-items: flex-end` |
| `justify-start` | `justify-content: flex-start` |
| `justify-center` | `justify-content: center` |
| `justify-end` | `justify-content: flex-end` |
| `justify-between` | `justify-content: space-between` |
| `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8` | `gap: var(--orbit-space-N)` |
| `md:grid-cols-2` | `@media (min-width: 48rem) { grid-template-columns: repeat(2, minmax(0, 1fr)) }` |
| `md:order-1`, `md:order-2` | `@media (min-width: 48rem) { order: 1 }` / `{ order: 2 }` |
| `sm:flex-row` | `@media (min-width: 40rem) { flex-direction: row }` |
| `sm:items-center` | `@media (min-width: 40rem) { align-items: center }` |
| `sm:justify-between` | `@media (min-width: 40rem) { justify-content: space-between }` |
| `space-y-1` | `.orbit-x > :not(:last-child) { margin-block-end: var(--orbit-space-1) }` |
| `divide-y` | `.orbit-x > :not(:last-child) { border-bottom: 1px solid <divide colour> }` |
| `divide-hub-border` | divide colour `var(--orbit-color-border)` |

### Sizing and aspect ratio

| Utility | CSS |
| --- | --- |
| `w-full` | `width: 100%` |
| `w-auto` | `width: auto` |
| `w-fit` | `width: fit-content` |
| `w-2.5` | `width: var(--orbit-space-2-5)` |
| `h-2.5` | `height: var(--orbit-space-2-5)` |
| `h-10` | `height: var(--orbit-space-10)` |
| `h-full` | `height: 100%` |
| `min-h-[320px]` | `min-height: 320px` |
| `min-h-screen` | `min-height: 100vh` |
| `max-w-2xl`, `max-w-3xl`, `max-w-5xl`, `max-w-6xl`, `max-w-7xl` | `max-width: var(--orbit-max-width-2xl)` (and so on) |
| `max-w-hub-container` | `max-width: var(--orbit-container-max-width)` |
| `aspect-video` | `aspect-ratio: 16 / 9` |
| `aspect-square` | `aspect-ratio: 1 / 1` |
| `aspect-[4/3]`, `aspect-[3/4]`, `aspect-[9/16]`, `aspect-[21/9]`, `aspect-[16/10]` | `aspect-ratio: 4 / 3` (and so on) |
| `object-cover` | `object-fit: cover` |

When the ratio comes from a prop (`Image` and `Youtube` `aspect_ratio`), set `aspect-ratio` inline. The fixed `aspect-[16/10]` of the split HeroBanner image goes in the stylesheet.

### Spacing

| Utility | CSS |
| --- | --- |
| `m-0` | `margin: 0` |
| `mx-auto` | `margin-inline: auto` |
| `mt-1`, `mt-2`, `mt-3`, `mt-4`, `mt-10`, `mt-12`, `mt-16` | `margin-top: var(--orbit-space-N)` |
| `p-0` | `padding: 0` |
| `px-2.5`, `px-3`, `px-4`, `px-5`, `px-6` | `padding-inline: var(--orbit-space-N)` |
| `py-0.5`, `py-1`, `py-1.5`, `py-2`, `py-2.5`, `py-3`, `py-3.5`, `py-4`, `py-6`, `py-8`, `py-10`, `py-12`, `py-16` | `padding-block: var(--orbit-space-N)` |
| `pt-3`, `pt-4`, `pt-6` | `padding-top: var(--orbit-space-N)` |
| `pb-4` | `padding-bottom: var(--orbit-space-4)` |

### Typography

| Utility | CSS |
| --- | --- |
| `font-hub` | `font-family: var(--orbit-font-body)` |
| `font-hub-heading` | `font-family: var(--orbit-font-heading)` |
| `font-mono` | `font-family: var(--orbit-font-mono)` |
| `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl` | `font-size: var(--orbit-font-size-<size>); line-height: var(--orbit-line-height-<size>)` |
| `md:text-xl`, `md:text-5xl` | the same pair inside `@media (min-width: 48rem)` |
| `text-[11px]` | `font-size: 11px` (line height inherited) |
| `leading-relaxed` | `line-height: var(--orbit-line-height-relaxed)` |
| `font-medium` | `font-weight: var(--orbit-font-weight-medium)` |
| `font-semibold` | `font-weight: var(--orbit-font-weight-semibold)` |
| `font-bold` | `font-weight: var(--orbit-font-weight-bold)` |
| `tracking-tight` | `letter-spacing: var(--orbit-letter-spacing-tight)` |
| `tracking-wider` | `letter-spacing: var(--orbit-letter-spacing-wider)` |
| `tracking-widest` | `letter-spacing: var(--orbit-letter-spacing-widest)` |
| `tracking-[0.14em]`, `tracking-[0.22em]` | `letter-spacing: 0.14em` / `0.22em` |
| `uppercase` | `text-transform: uppercase` |
| `text-left`, `text-center`, `text-right` | `text-align: left` / `center` / `right` |
| `underline` | `text-decoration-line: underline` |
| `no-underline` | `text-decoration-line: none` |
| `underline-offset-4` | `text-underline-offset: 4px` |
| `list-none` | `list-style-type: none` |

When a heading size changes at `md`, put the line height in the same media block. A `leading-*` utility next to a size overrides that size's line height.

### Colour and opacity

| Utility | CSS |
| --- | --- |
| `text-hub-primary`, `text-hub-secondary` | `color: var(--orbit-color-accent)` |
| `text-hub-text` | `color: var(--orbit-color-text)` |
| `text-hub-text/60`, `text-hub-text/70`, `text-hub-text/75`, `text-hub-text/80`, `text-hub-text/85` | `color: color-mix(in oklab, var(--orbit-color-text) N%, transparent)` |
| `text-white` | `color: var(--orbit-color-on-accent)` (the reference uses it only on accent backgrounds) |
| `bg-hub-bg` | `background-color: var(--orbit-color-background)` |
| `bg-hub-surface` | `background-color: var(--orbit-color-surface)` |
| `bg-hub-surface/90`, `bg-hub-surface/95` | `background-color: color-mix(in oklab, var(--orbit-color-surface) N%, transparent)` |
| `bg-hub-primary`, `bg-hub-secondary` | `background-color: var(--orbit-color-accent)` |
| `bg-hub-primary/10` | `background-color: color-mix(in oklab, var(--orbit-color-accent) 10%, transparent)` |
| `bg-black` | `background-color: #000` (video letterbox) |
| `border-hub-border` | `border-color: var(--orbit-color-border)` |
| `border-hub-primary` | `border-color: var(--orbit-color-accent)` |
| `border-hub-text` | `border-color: var(--orbit-color-text)` |
| `border-transparent` | `border-color: transparent` |
| `opacity-90` | `opacity: 0.9` |
| `hover:opacity-80`, `hover:opacity-90` | `opacity: 0.8` / `0.9` on `:hover` |
| `hover:text-hub-primary`, `hover:text-hub-secondary` | `color: var(--orbit-color-accent)` on `:hover` |
| `hover:bg-hub-bg` | `background-color: var(--orbit-color-background)` on `:hover` |
| `hover:bg-hub-primary/5` | `background-color: color-mix(in oklab, var(--orbit-color-accent) 5%, transparent)` on `:hover` |
| `hover:bg-hub-surface/15` | `background-color: color-mix(in oklab, var(--orbit-color-surface) 15%, transparent)` on `:hover` |
| `hover:border-hub-border` | `border-color: var(--orbit-color-border)` on `:hover` |
| `hover:underline` | `text-decoration-line: underline` on `:hover` |

### Borders, radius, shadow and effects

| Utility | CSS |
| --- | --- |
| `border` | `border: var(--orbit-border-width) solid` |
| `border-t` | `border-top: var(--orbit-border-width) solid` |
| `border-b` | `border-bottom: var(--orbit-border-width) solid` |
| `border-2` | `border: 2px solid` |
| `border-t-2` | `border-top: 2px solid` |
| `border-t-4` | `border-top: 4px solid` |
| `border-b-4` | `border-bottom: 4px solid` |
| `rounded-hub-base` | `border-radius: var(--orbit-radius-base)` |
| `rounded-hub-lg` | `border-radius: var(--orbit-radius-lg)` |
| `rounded-hub-btn` | `border-radius: var(--orbit-radius-button)` |
| `rounded-sm` | `border-radius: 0.25rem` |
| `rounded-full` | `border-radius: 9999px` |
| `shadow-hub-card` | `box-shadow: var(--orbit-card-shadow)` |
| `backdrop-blur` | `-webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px)` |
| `backdrop-blur-md` | `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px)` |
| `transition-colors` | `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms` |

The unnumbered border utilities (`border`, `border-t`, `border-b`) are 1px in Tailwind, and that is also the default of `--orbit-border-width`. They use the token so the per-theme border width from `SiteTheme` (2px in `bold`) applies. The numbered widths stay literal. Always write the colour from the matching `border-hub-*` utility in the same declaration or next to it: plain CSS has no `--tw-border-style` default.

### Scroll snap

| Utility | CSS |
| --- | --- |
| `snap-x` + `snap-mandatory` | `scroll-snap-type: x mandatory` |
| `snap-center` | `scroll-snap-align: center` |
| `scroll-smooth` | `scroll-behavior: smooth` |

## Port rules

Ports 15.22 to 15.33 follow these rules.

1. **The Symfony schema wins over the reference.** A prop that is in the schema but ignored by the reference is still honoured, using the shared pattern (for example `cta.variant`). A prop that exists only in the reference is not ported.
2. **Links.** The reference resolves every `href` with `resolveLink(…, siteContext)` (`src/components/catalog/uri.ts`): it turns `hub://` into a URL and marks external links with `target="_blank" rel="noopener noreferrer"`. In `@orbit/ui` this arrives through the `resolveLink` context prop. If it is not passed, the `href` is emitted as is.
3. **Each component owns its vertical padding**, as in the reference. `.orbit-section` stops adding padding by default (TASK-15.31 removes it). The padding the editor picks in Appearance is still applied by `SectionWrapper`.
4. **Fixed text.** Literals that do not come from props (button labels, `aria-label`) keep the values `@orbit/ui` already has. The Spanish literals of the reference are not ported. Localising them is outside EPIC-15.
5. **No invented breakpoints.** If the reference has no width variant for an element, the port has none either.

## Component context props

Hosts pass these to every renderer (`OrbitComponentContextProps` in `src/types.ts`), next to the existing editor and DAM props:

| Prop | Type | Purpose |
| --- | --- | --- |
| `tenantLabel` | `string` (optional) | Display name of the current tenant, where the reference prints `siteContext.tenant` (for example the `bold` HeroBanner badge). |
| `resolveLink` | `(href: string) => { href: string; target?: string; rel?: string }` (optional) | Resolves an authored `href`, `hub://` included, into a navigable link with `target` and `rel`. See rule 2. |

## Cascade note for TASK-15.31

The `@import` lines must precede `:root`, so `:root` now comes after the `[data-orbit-theme]` token rules. The two selectors have the same specificity. On an element that carries both, the `:root` default wins on that element. The builder and the editor iframe put `data-orbit-theme` on `<html>`. `ThemeShell` sets the theme tokens again on its own element, so components inside `ThemeShell` still get the theme values. TASK-15.31 owns the theme values and `ThemeShell`, so it can decide whether `<html>` itself needs them.
