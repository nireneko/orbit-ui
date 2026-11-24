// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Header, type HeaderComponentProps } from '../core/Header';

const HEADER_CSS = resolve(dirname(fileURLToPath(import.meta.url)), '../../styles/components/header.css');

/** Minimal props accepted by the Symfony schema: `navigation` is the only required prop. */
const minimalProps: HeaderComponentProps = {
    navigation: [{ label: 'Home', href: '/' }],
};

const fullProps: HeaderComponentProps = {
    brand_text: 'Company Name',
    logo: { dam_asset_id: 'dam_logo', alt_text: 'Company logo', href: 'hub://home' },
    navigation: [
        {
            label: 'Products',
            href: 'hub://products',
            children: [
                { label: 'Cardiology', href: 'hub://products/cardiology' },
                { label: 'Oncology', href: 'https://example.com/oncology' },
            ],
        },
        { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Sign in', href: 'hub://login', variant: 'primary_button' },
    sticky: false,
};

function render(props: HeaderComponentProps): string {
    return renderToStaticMarkup(<Header {...props} />);
}

/** Test double of the host `resolveLink`: `hub://` becomes a path, `http(s)` opens in a new tab. */
function fakeResolveLink(href: string): { href: string; target?: string; rel?: string } {
    if (href.startsWith('hub://')) {
        return { href: `/resolved/${href.slice('hub://'.length)}` };
    }

    if (/^https?:\/\//.test(href)) {
        return { href, target: '_blank', rel: 'noopener noreferrer' };
    }

    return { href };
}

describe('Header', () => {
    it('T1.1 renders the reference structure from the minimal schema props', () => {
        const html = render(minimalProps);

        expect(html).toMatch(/^<header data-orbit-block="Header" data-orbit-sticky="false" class="orbit-header">/);
        expect(html).toContain('<div class="orbit-header__inner">');
        expect(html).toContain('<a href="/" class="orbit-header__home">');
        expect(html).toContain('<span class="orbit-header__brand">Orbit Hub</span>');
        expect(html).toContain('<nav class="orbit-header__nav" aria-label="Primary navigation">');
        expect(html).toContain('<ul class="orbit-header__nav-list">');
        expect(html).toContain(
            '<li class="orbit-header__nav-item"><a href="/" class="orbit-header__nav-link">Home</a></li>',
        );
        expect(html).not.toContain('orbit-header__logo');
        expect(html).not.toContain('orbit-header__submenu');
        expect(html).not.toContain('orbit-cta');
    });

    it('renders the logo from the DAM with its alt text inside the home link', () => {
        const html = render({ ...fullProps, resolveAssetUrl: (id) => `/assets/${id}.png` });

        expect(html).toContain(
            '<img class="orbit-header__logo" src="/assets/dam_logo.png" alt="Company logo" width="160" height="40" loading="eager" decoding="async"/>',
        );
        expect(html.indexOf('orbit-header__logo')).toBeGreaterThan(html.indexOf('orbit-header__home'));
        expect(html.indexOf('orbit-header__logo')).toBeLessThan(html.indexOf('orbit-header__brand'));
    });

    it('falls back to the brand text, then to "Logo", when the logo has no alt text', () => {
        const logo = { dam_asset_id: 'dam_logo' };

        expect(render({ ...minimalProps, brand_text: 'Acme', logo })).toContain('alt="Acme"');
        expect(render({ ...minimalProps, brand_text: <em>Acme</em>, logo })).toContain('alt="Logo"');
    });

    it('omits the brand span when the brand text is blank', () => {
        expect(render({ ...minimalProps, brand_text: '  ' })).not.toContain('orbit-header__brand');
    });

    it('scenario 1: renders a submenu with every child link of a navigation item', () => {
        const html = render(fullProps);
        const submenu = html.match(/<ul class="orbit-header__submenu">(.*?)<\/ul>/)?.[1] ?? '';

        expect(submenu).toBe(
            '<li class="orbit-header__submenu-item"><a href="hub://products/cardiology" class="orbit-header__submenu-link">Cardiology</a></li>'
                + '<li class="orbit-header__submenu-item"><a href="https://example.com/oncology" class="orbit-header__submenu-link">Oncology</a></li>',
        );
        expect(html.match(/orbit-header__submenu"/g)).toHaveLength(1);
    });

    it.each([
        ['primary_button', 'orbit-cta orbit-cta--primary'],
        ['secondary_button', 'orbit-cta orbit-cta--secondary'],
        ['link', 'orbit-cta orbit-cta--link'],
    ])('T1.2 / scenario 2: renders cta.variant %s with the shared CTA variant class', (variant, className) => {
        const html = render({ ...fullProps, cta: { label: 'Sign in', href: '/login', variant } });

        expect(html).toContain(`<a href="/login" class="${className} orbit-header__cta">Sign in</a>`);
    });

    it('applies the sticky modifier only when sticky is true', () => {
        expect(render({ ...minimalProps, sticky: true })).toMatch(
            /^<header data-orbit-block="Header" data-orbit-sticky="true" class="orbit-header orbit-header--sticky">/,
        );
        expect(render({ ...minimalProps, sticky: false })).not.toContain('orbit-header--sticky');
    });

    it('D4: resolves every href through resolveLink and applies its target and rel', () => {
        const resolveLink = vi.fn(fakeResolveLink);
        const html = render({ ...fullProps, resolveLink });

        expect(html).toContain('<a href="/resolved/home" class="orbit-header__home">');
        expect(html).toContain('<a href="/resolved/products" class="orbit-header__nav-link">Products</a>');
        expect(html).toContain('<a href="/resolved/products/cardiology" class="orbit-header__submenu-link">');
        expect(html).toContain(
            '<a href="https://example.com/oncology" target="_blank" rel="noopener noreferrer" class="orbit-header__submenu-link">',
        );
        expect(html).toContain('<a href="/contact" class="orbit-header__nav-link">Contact</a>');
        expect(html).toContain('<a href="/resolved/login" class="orbit-cta orbit-cta--primary orbit-header__cta">');
        expect(resolveLink).toHaveBeenCalledTimes(6);
    });

    it('D4: emits every href as authored without resolveLink', () => {
        const html = render(fullProps);

        expect(html).toContain('<a href="hub://home" class="orbit-header__home">');
        expect(html).toContain('<a href="hub://products" class="orbit-header__nav-link">');
        expect(html).toContain('<a href="hub://login" class="orbit-cta orbit-cta--primary orbit-header__cta">');
        expect(html).not.toContain('target=');
    });

    it('T1.3 keeps data-orbit-block, the DAM trigger and non-navigable links in editorMode', () => {
        const html = render({
            ...fullProps,
            editorMode: true,
            onInlineSelectDamAsset: () => undefined,
            selectAssetLabel: 'Choose logo',
            resolveLink: fakeResolveLink,
        });

        expect(html).toContain('data-orbit-block="Header"');
        expect(html).toContain('<span class="orbit-header__home">');
        expect(html).toContain('data-orbit-inline-dam-trigger="true"');
        expect(html).toContain('data-orbit-inline-dam-prop="logo.dam_asset_id"');
        expect(html).toContain('data-orbit-inline-dam-current="dam_logo"');
        expect(html).toContain('<span>Choose logo</span>');
        expect(html).toContain('<a href="#editor-nav" class="orbit-header__nav-link">Products</a>');
        expect(html).toContain('<a href="#editor-nav" class="orbit-header__submenu-link">Cardiology</a>');
        expect(html).toContain('<span class="orbit-cta orbit-cta--primary orbit-header__cta">Sign in</span>');
        expect(html).not.toContain('/resolved/');
    });

    it('T1.3 renders the DAM trigger in editorMode even before a logo is chosen', () => {
        const html = render({ ...minimalProps, editorMode: true, onInlineSelectDamAsset: () => undefined });

        expect(html).toContain('data-orbit-inline-dam-current=""');
        expect(html).not.toContain('orbit-header__logo');
    });

    it('T1.3 renders no DAM trigger outside editorMode', () => {
        const html = render({ ...fullProps, editorMode: false, onInlineSelectDamAsset: () => undefined });

        expect(html).not.toContain('data-orbit-inline-dam-trigger');
        expect(html).not.toContain('<button');
    });

    it('keeps ReactNode text props in editorMode', () => {
        const html = render({
            ...fullProps,
            editorMode: true,
            brand_text: <b data-testid="brand">Brand</b>,
            navigation: [{ label: <i>Item</i>, href: '/', children: [{ label: <i>Child</i>, href: '/c' }] }],
        });

        expect(html).toContain('<span class="orbit-header__brand"><b data-testid="brand">Brand</b></span>');
        expect(html).toContain('<i>Item</i>');
        expect(html).toContain('<i>Child</i>');
    });

    it('T1.4 renders no inline styles in delivered and editor markup', () => {
        expect(render(fullProps)).not.toContain('style=');
        expect(render({ ...fullProps, editorMode: true, onInlineSelectDamAsset: () => undefined })).not.toContain(
            'style=',
        );
    });

    it('has no width breakpoints and no theme variants, like the reference', () => {
        const css = readFileSync(HEADER_CSS, 'utf8');

        expect(css).not.toMatch(/@media[^{]*width/);
        expect(css).not.toContain('[data-orbit-theme');
    });
});
