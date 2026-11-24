// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HeroBanner, type HeroBannerComponentProps } from '../core/HeroBanner';

/**
 * TASK-15.23: HeroBanner ported from
 * orbit-hub-builder@86abe78:src/components/catalog/layout/HeroBanner.astro.
 */

const STYLESHEET = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../../styles/components/hero-banner.css'),
    'utf8',
);

/** The props the Symfony schema requires: `title`, `alignment` and `cta`. */
const MINIMAL_PROPS: HeroBannerComponentProps = {
    title: 'Welcome to the hub',
    alignment: 'left',
    cta: { label: 'Learn more', href: 'hub://home', variant: 'primary_button' },
};

const resolveAssetUrl = (damId: string): string => `https://cdn.test/dam/${damId}`;

function render(props: Partial<HeroBannerComponentProps> = {}): string {
    return renderToStaticMarkup(<HeroBanner {...MINIMAL_PROPS} {...props} />);
}

/**
 * React 19 SSR prepends `<link rel="preload" as="image">` for every `<img>` it renders;
 * that hoisted resource is React's, so assertions on the component start after it.
 */
function withoutImagePreload(html: string): string {
    return html.replace(/^(<link rel="preload" as="image"[^>]*\/>)+/, '');
}

function rootTag(html: string): string {
    const markup = withoutImagePreload(html);

    return markup.slice(0, markup.indexOf('>') + 1);
}

describe('HeroBanner', () => {
    describe('band structure (T1.1)', () => {
        it('renders a full-width band section with the reference structure from the minimal schema props', () => {
            const html = render();

            expect(html.startsWith('<section')).toBe(true);
            expect(rootTag(html)).toContain('class="orbit-hero-banner');
            expect(rootTag(html)).toContain('data-orbit-block="HeroBanner"');
            expect(html).toContain('class="orbit-hero-banner__inner"');
            expect(html).toContain('class="orbit-hero-banner__content"');
            expect(html).toContain('<h1 class="orbit-hero-banner__title">Welcome to the hub</h1>');
            expect(html).toContain('Learn more');
        });

        it('renders the subtitle only when it is given', () => {
            expect(render()).not.toContain('orbit-hero-banner__subtitle');
            expect(render({ subtitle: 'Secondary text' })).toContain(
                '<p class="orbit-hero-banner__subtitle">Secondary text</p>',
            );
        });

        it('keeps the data-orbit-hero-theme attribute', () => {
            expect(rootTag(render({ siteTheme: 'EDITORIAL' }))).toContain('data-orbit-hero-theme="editorial"');
        });
    });

    describe('alignment enum (T1.2)', () => {
        it.each(['left', 'center', 'right'])('applies the %s alignment modifier', (alignment) => {
            expect(rootTag(render({ alignment }))).toContain(`orbit-hero-banner--align-${alignment}`);
        });

        it('falls back to left for an unknown alignment', () => {
            expect(rootTag(render({ alignment: 'justify' }))).toContain('orbit-hero-banner--align-left');
        });
    });

    describe('cta.variant enum (T1.2)', () => {
        it.each([
            ['primary_button', 'orbit-cta orbit-cta--primary'],
            ['secondary_button', 'orbit-cta orbit-cta--secondary'],
            ['link', 'orbit-cta orbit-cta--link'],
        ])('renders the %s variant with the shared CTA', (variant, className) => {
            const html = render({ cta: { label: 'Go', href: '/go', variant } });

            expect(html).toContain(`<a href="/go" class="${className}">Go</a>`);
        });

        it('renders no CTA without a label', () => {
            expect(render({ cta: { label: '', href: '/go', variant: 'link' } })).not.toContain('orbit-cta');
        });
    });

    describe('theme layout (siteTheme enum)', () => {
        it('scenario 1: CLEAN renders the DAM image full-bleed behind the content, without the DAM text', () => {
            const html = render({ siteTheme: 'CLEAN', dam_background_asset_id: 'hero_01', resolveAssetUrl });

            expect(html).toMatch(/<img [^>]*src="https:\/\/cdn\.test\/dam\/hero_01"/);
            expect(html).toContain('class="orbit-hero-banner__image orbit-hero-banner__image--bleed"');
            expect(html.indexOf('<img')).toBeLessThan(html.indexOf('orbit-hero-banner__inner'));
            expect(html).not.toContain('orbit-hero-banner__media');
            expect(rootTag(html)).not.toContain('orbit-hero-banner--split');
            expect(html).not.toContain('DAM: hero_01');
        });

        it('scenario 2: EDITORIAL keeps the band root and puts the image in the second column', () => {
            const html = render({ siteTheme: 'EDITORIAL', dam_background_asset_id: 'hero_01', resolveAssetUrl });

            expect(withoutImagePreload(html).startsWith('<section')).toBe(true);
            expect(rootTag(html)).toContain('orbit-hero-banner--split');
            expect(html).not.toContain('orbit-hero-banner__image--bleed');
            expect(html).toMatch(
                /<div class="orbit-hero-banner__media"><img class="orbit-hero-banner__image" src="https:\/\/cdn\.test\/dam\/hero_01"/,
            );
            expect(html.indexOf('orbit-hero-banner__media')).toBeGreaterThan(
                html.indexOf('orbit-hero-banner__content'),
            );
        });

        it.each([
            ['CLEAN', 'clean', false],
            ['EDITORIAL', 'editorial', true],
            ['CLINICAL', 'clinical', true],
            ['BOLD', 'bold', false],
            ['clinical', 'clinical', true],
        ] as const)('renders %s with the %s modifier (split: %s)', (siteTheme, theme, split) => {
            const html = render({ siteTheme, dam_background_asset_id: 'hero_01', resolveAssetUrl });

            expect(rootTag(html)).toContain(`orbit-hero-banner--${theme}`);
            expect(rootTag(html).includes('orbit-hero-banner--split')).toBe(split);
            expect(html.includes('orbit-hero-banner__media')).toBe(split);
        });

        it('falls back to the clean layout for an unknown theme', () => {
            const html = render({ siteTheme: 'NEON' as HeroBannerComponentProps['siteTheme'] });

            expect(rootTag(html)).toContain('orbit-hero-banner--clean');
            expect(rootTag(html)).not.toContain('orbit-hero-banner--split');
        });
    });

    describe('DAM background image', () => {
        it('marks the image as high priority, async decoding and decorative', () => {
            const html = render({ dam_background_asset_id: 'hero_01', resolveAssetUrl });

            expect(html).toMatch(/<img [^>]*alt=""/);
            expect(html).toMatch(/<img [^>]*fetchpriority="high"/i);
            expect(html).toMatch(/<img [^>]*decoding="async"/);
        });

        it('falls back to the Control Plane stream URL without resolveAssetUrl', () => {
            expect(render({ dam_background_asset_id: 'hero_01' })).toContain(
                'src="/api/v1/dam/assets/hero_01/stream"',
            );
        });

        it('renders no image without a background asset', () => {
            expect(render({ resolveAssetUrl })).not.toContain('<img');
            expect(render({ dam_background_asset_id: '  ', resolveAssetUrl })).not.toContain('<img');
        });
    });

    describe('bold tenant badge', () => {
        it('prints tenantLabel in the bold theme', () => {
            expect(render({ siteTheme: 'BOLD', tenantLabel: 'Acme Pharma' })).toContain(
                '<span class="orbit-hero-banner__badge">Acme Pharma</span>',
            );
        });

        it('renders no badge without tenantLabel or outside the bold theme', () => {
            expect(render({ siteTheme: 'BOLD' })).not.toContain('orbit-hero-banner__badge');
            expect(render({ siteTheme: 'BOLD', tenantLabel: '' })).not.toContain('orbit-hero-banner__badge');
            expect(render({ siteTheme: 'CLEAN', tenantLabel: 'Acme Pharma' })).not.toContain(
                'orbit-hero-banner__badge',
            );
        });
    });

    describe('editorMode vs delivered (T1.3)', () => {
        const onInlineSelectDamAsset = vi.fn();

        it('renders the inline DAM trigger and keeps data-orbit-block in editorMode', () => {
            const html = render({
                editorMode: true,
                dam_background_asset_id: 'hero_01',
                resolveAssetUrl,
                onInlineSelectDamAsset,
            });

            expect(html).toContain('data-orbit-block="HeroBanner"');
            expect(html).toContain('data-orbit-inline-dam-trigger="true"');
            expect(html).toContain('data-orbit-inline-dam-prop="dam_background_asset_id"');
            expect(html).toContain('data-orbit-inline-dam-current="hero_01"');
            expect(html).toContain('data-orbit-dam-asset="hero_01"');
            expect(html).toContain('src="https://cdn.test/dam/hero_01"');
            expect(html).toContain('<span class="orbit-cta orbit-cta--primary">Learn more</span>');
        });

        it('renders the trigger in editorMode before any asset is chosen', () => {
            const html = render({ editorMode: true, onInlineSelectDamAsset });

            expect(html).toContain('data-orbit-inline-dam-prop="dam_background_asset_id"');
            expect(html).not.toContain('<img');
        });

        it('renders no trigger when editorMode is false', () => {
            const html = render({
                editorMode: false,
                dam_background_asset_id: 'hero_01',
                resolveAssetUrl,
                onInlineSelectDamAsset,
            });

            expect(html).not.toContain('data-orbit-inline-dam-trigger');
            expect(html).not.toContain('orbit-hero-banner__dam');
        });

        it('accepts React nodes as title and subtitle', () => {
            const html = render({ title: <em>Rich title</em>, subtitle: <strong>Rich subtitle</strong> });

            expect(html).toContain('<h1 class="orbit-hero-banner__title"><em>Rich title</em></h1>');
            expect(html).toContain('<p class="orbit-hero-banner__subtitle"><strong>Rich subtitle</strong></p>');
        });
    });

    describe('links through resolveLink', () => {
        it('applies the href, target and rel returned by resolveLink', () => {
            const resolveLink = vi.fn(() => ({
                href: 'https://example.com/',
                target: '_blank',
                rel: 'noopener noreferrer',
            }));
            const html = render({
                cta: { label: 'External', href: 'https://example.com/', variant: 'primary_button' },
                resolveLink,
            });

            expect(resolveLink).toHaveBeenCalledWith('https://example.com/');
            expect(html).toContain(
                '<a href="https://example.com/" target="_blank" rel="noopener noreferrer" class="orbit-cta orbit-cta--primary">External</a>',
            );
        });

        it('emits the authored href as is without resolveLink', () => {
            expect(render()).toContain('href="hub://home"');
        });
    });

    describe('no fixed inline styles (T1.4)', () => {
        it.each(['CLEAN', 'EDITORIAL', 'CLINICAL', 'BOLD'] as const)('renders %s without any inline style', (siteTheme) => {
            const html = render({
                siteTheme,
                subtitle: 'Secondary text',
                tenantLabel: 'Acme Pharma',
                dam_background_asset_id: 'hero_01',
                resolveAssetUrl,
                editorMode: true,
                onInlineSelectDamAsset: vi.fn(),
            });

            expect(html).not.toContain('style=');
        });
    });

    describe('stylesheet', () => {
        it('declares the accent band with a 320px minimum height', () => {
            expect(STYLESHEET).toMatch(
                /\.orbit-hero-banner \{[^}]*min-height: 320px;[^}]*background-color: var\(--orbit-color-accent\);[^}]*color: var\(--orbit-color-on-accent\);/,
            );
        });

        it('splits into two columns and switches the type scale from 48rem', () => {
            const md = STYLESHEET.slice(STYLESHEET.indexOf('@media (min-width: 48rem)'));

            expect(md).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
            expect(md).toContain('font-size: var(--orbit-font-size-5xl);');
            expect(md).toContain('font-size: var(--orbit-font-size-xl);');
        });

        it('gives the column image a 16/10 ratio and the clinical and bold bands their bottom borders', () => {
            expect(STYLESHEET).toContain('aspect-ratio: 16 / 10;');
            expect(STYLESHEET).toMatch(
                /\.orbit-hero-banner--clinical \{\s*border-bottom: var\(--orbit-border-width\) solid var\(--orbit-color-border\);/,
            );
            expect(STYLESHEET).toMatch(
                /\.orbit-hero-banner--bold \{\s*border-bottom: 4px solid var\(--orbit-color-border\);/,
            );
        });
    });
});
