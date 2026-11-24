# Changelog

All notable changes to `@orbit/ui` are recorded here. Versions follow [Semantic Versioning](https://semver.org/); prereleases carry an `-rc.N` suffix and are tagged on the integration branch before the final release is tagged on `main`.

## [0.4.0-rc.3]

Install from `#v0.4.0-rc.3`; everything else in 0.4.0-rc.1 and rc.2 applies unchanged.

### Fixed

- Primary CTA label: inside `ThemeShell` the shell link rule (`.orbit-theme-shell a`) painted it in the accent colour, so the label was invisible on the accent background. It now uses `--orbit-color-on-accent` (it used `--orbit-color-background`) with enough specificity to win inside the shell: the rule is now `.orbit-cta.orbit-cta--primary` (0,2,0), so a host or component override of the primary label colour needs two classes.
- CTA hover effects apply only under `@media (hover: hover)`, so touch devices no longer keep a stuck hover state; the secondary hover tint mixes in `oklab`, as the reference does.
- Header submenu links keep the muted text colour inside `ThemeShell` instead of the accent colour.

Found by the parity verification against the legacy `.astro` catalog (TASK-15.43).

## [0.4.0-rc.2]

### Fixed

- `Text` type-checks under `noUncheckedIndexedAccess`. The package ships TypeScript source, so a consumer whose `tsconfig.json` enables that flag (the Astro builder does) compiled `Text.tsx` with it and failed its typecheck; `skipLibCheck` does not cover `.ts` files. The package now type-checks with the flag itself, so such errors fail its own build.
- Install from `#v0.4.0-rc.2`; everything else in 0.4.0-rc.1 applies unchanged.

## [0.4.0-rc.1]

First prerelease of EPIC-15 phase 2 (one render engine): the reference design from the legacy Astro components is ported into every catalog component. Markup, class names and styles change; the public JavaScript API stays compatible with v0.3.0.

### What you must do

- **Install from the tag:** `"@orbit/ui": "https://github.com/nireneko/orbit-ui.git#v0.4.0-rc.1"`.
- **Import the stylesheet:** `import '@orbit/ui/styles.css'`. Catalog components no longer carry inline styles (Image and Youtube keep only `aspect-ratio`), so without the stylesheet they render unstyled. The entry sheet imports one sheet per component.
- **Overriding theme tokens on `<html>`:** theme blocks now use `:root[data-orbit-theme="x"]`, so a host override written on plain `:root` loses to them. Write it as `html:root[data-orbit-theme]`, or pass the tokens through `ThemeShell` `cssVariables`.
- **Section spacing:** `.orbit-section` no longer adds default vertical padding; each component carries its own. Host CSS that compensated for the old padding must drop that compensation. Appearance padding from `SectionWrapper` still applies.
- **Styling hooks:** host CSS that targeted the old markup (Tailwind classes on CTAs, the inline `<span>` DAM trigger, the v0.3.0 `[data-orbit-theme] [data-orbit-block=Header|HeroBanner]` rules) must move to the new `orbit-*` classes. See [`docs/design-port.md`](docs/design-port.md) for the class naming and token contract.

### Added

- `tenantLabel` (optional) on `OrbitComponentContextProps`: tenant display name, shown where the reference prints it (the BOLD HeroBanner badge). ([#17])
- `resolveLink` (optional) on `OrbitComponentContextProps`: resolves an authored `href` (including `hub://`) into `{ href, target?, rel? }`; without it, components emit `href` as written. ([#17])
- `renderCtaButton` takes an optional third options argument (`resolveLink`, `openInNewTab`, `trailing`). ([#16])
- Token contract: on-accent colour, mono font, type scale `xs`–`5xl` with line heights, weights, tracking, spacing `0.5`–`16`, max widths `2xl`–`7xl`. Existing `--orbit-*` and `--hub-*` tokens are unchanged. ([#17])
- Docker development harness (`compose.yaml`) and [`docs/design-port.md`](docs/design-port.md). ([#17])

### Changed

- **`ThemeShell` applies `cssVariables`.** The prop was accepted but ignored in v0.3.0; it now writes each `--name: value` declaration inline on the shell root and drops anything that is not a custom property. Children are now wrapped in `.orbit-theme-shell__content`, which EDITORIAL limits to `64rem`; the other themes keep it full width. ([#27])
- **Per-theme tokens mirror `SiteTheme`.** Container width, section spacing, radii, border width and card shadow for `clean`, `editorial`, `clinical` and `bold` match `SiteTheme::getStructuralTokens()` in orbit-hub. ([#27])
- **Stylesheet split per component.** `orbit-tokens.css` is the `@import` list plus `:root` defaults; rules live in `shell.css`, `themes.css` and `components/<name>.css`. ([#17])
- **Shared internals and CTA.** Every CTA renders through one token-based `orbit-cta`; the inline DAM trigger in editor mode is a keyboard-accessible `<button type="button" class="orbit-inline-dam-trigger">` with the same data attributes and callback payload. ([#16])
- **Core components ported to the reference design**, each with `orbit-<block>` classes, tokens and min-width breakpoints, and `data-orbit-*` attributes kept:
  - ImageAndText: image left/right modifiers, `background_variant` `default|muted|accent`, lazy image. ([#18])
  - Header: nav items with `children` now render their submenu; `sticky` now makes the header sticky (`orbit-header--sticky`). ([#19])
  - HeroBanner: the DAM image now renders (full-bleed on CLEAN, side column on EDITORIAL and CLINICAL); theme variants come from the `siteTheme` prop; BOLD shows the `tenantLabel` badge. ([#20])
  - Text: alignment and tone modifiers; the body keeps line breaks (`white-space: pre-wrap`). ([#21])
  - Link: shared CTA with alignment modifiers; `open_in_new_tab` gives `target="_blank" rel="noopener noreferrer"`. ([#22])
  - Image: `href` and `open_in_new_tab` are now honoured; `aspect_ratio` `16:9|4:3|1:1|3:4|auto`. ([#23])
  - DocumentDownloadCenter: list layout with format and size metadata; links use `download_url` when present, otherwise the DAM URL. ([#24])
  - Youtube: `<figure>` layout, `loading="lazy"` and a strict referrer policy; embed logic unchanged. ([#25])
  - InteractiveSlideshow: scroll-snap track with previous/next buttons, carousel ARIA labels; autoplay off in editor mode and for a single slide, stops for good on the first hover or focus. ([#26])
- **Interactive bundle** (CheckInScanner, ScheduleTimeline, UserFavoriteTracker) moved onto tokens and breakpoints with no inline styles; props and behaviour unchanged. ([#28])
- **Pharma bundle** moved onto tokens with no inline styles; props and behaviour unchanged:
  - ClinicalStudyCardGrid: responsive grid (1 column, 2 from `48rem`, `columns` 2/3/4 from `64rem`; out-of-range falls back to 3). ([#29])
  - MedicalInquiryForm: every label is linked to its control and controls show a visible focus ring. ([#30])
  - RestrictedVideoPlayer: the sign-in gate stacks on small screens; the video is still never embedded. ([#31])

### Notes

- The `orbit-tokens.v0.3.0.css` test fixture is no longer a literal v0.3.0 snapshot: rules that this release changes on purpose (Header and HeroBanner theme rules, theme blocks, `.orbit-section` padding) were removed from it. ([#19], [#20], [#27])

[0.4.0-rc.3]: https://github.com/nireneko/orbit-ui/compare/v0.4.0-rc.2...v0.4.0-rc.3
[0.4.0-rc.2]: https://github.com/nireneko/orbit-ui/compare/v0.4.0-rc.1...v0.4.0-rc.2
[0.4.0-rc.1]: https://github.com/nireneko/orbit-ui/compare/v0.3.0...v0.4.0-rc.1
[#16]: https://github.com/nireneko/orbit-ui/pull/16
[#17]: https://github.com/nireneko/orbit-ui/pull/17
[#18]: https://github.com/nireneko/orbit-ui/pull/18
[#19]: https://github.com/nireneko/orbit-ui/pull/19
[#20]: https://github.com/nireneko/orbit-ui/pull/20
[#21]: https://github.com/nireneko/orbit-ui/pull/21
[#22]: https://github.com/nireneko/orbit-ui/pull/22
[#23]: https://github.com/nireneko/orbit-ui/pull/23
[#24]: https://github.com/nireneko/orbit-ui/pull/24
[#25]: https://github.com/nireneko/orbit-ui/pull/25
[#26]: https://github.com/nireneko/orbit-ui/pull/26
[#27]: https://github.com/nireneko/orbit-ui/pull/27
[#28]: https://github.com/nireneko/orbit-ui/pull/28
[#29]: https://github.com/nireneko/orbit-ui/pull/29
[#30]: https://github.com/nireneko/orbit-ui/pull/30
[#31]: https://github.com/nireneko/orbit-ui/pull/31
