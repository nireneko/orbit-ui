// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Link, type LinkComponentProps } from '../core/Link';

const MINIMAL_SCHEMA_PROPS: LinkComponentProps = {
    label: 'Read the study',
    href: 'hub://studies',
    variant: 'link',
};

function render(props: Partial<LinkComponentProps> = {}): string {
    return renderToStaticMarkup(<Link {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

function anchorClassList(markup: string): string[] {
    const match = markup.match(/<a [^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

describe('Link', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the root block with the reference structure', () => {
            const markup = render();

            expect(rootClassList(markup)).toContain('orbit-link');
            expect(markup).toContain('data-orbit-block="Link"');
            expect(markup).toBe(
                '<div data-orbit-block="Link" class="orbit-link orbit-link--align-left">' +
                    '<a href="hub://studies" class="orbit-cta orbit-cta--link orbit-link__anchor">' +
                    'Read the study<span class="orbit-link__arrow" aria-hidden="true">→</span>' +
                    '</a></div>',
            );
        });

        it('keeps the React node content of the label', () => {
            const markup = render({ label: <span data-testid="inline-label">Inline label</span> });

            expect(markup).toContain('<span data-testid="inline-label">Inline label</span>');
        });

        it('keeps the root but renders no link when the label is empty', () => {
            const markup = render({ label: '' });

            expect(markup).toContain('data-orbit-block="Link"');
            expect(markup).not.toContain('<a ');
        });
    });

    describe('variant', () => {
        it.each([
            ['primary_button', 'orbit-cta--primary'],
            ['secondary_button', 'orbit-cta--secondary'],
            ['link', 'orbit-cta--link'],
        ])('%s: the anchor carries the shared cta variant and the link hook', (variant, variantClass) => {
            const classes = anchorClassList(render({ variant }));

            expect(classes).toEqual(['orbit-cta', variantClass, 'orbit-link__anchor']);
        });

        it('link without icon: appends the reference arrow', () => {
            const markup = render({ variant: 'link' });

            expect(markup).toContain('<span class="orbit-link__arrow" aria-hidden="true">→</span>');
        });

        it.each(['primary_button', 'secondary_button'])('%s without icon: renders no arrow', (variant) => {
            expect(render({ variant })).not.toContain('orbit-link__arrow');
        });
    });

    describe('icon', () => {
        it.each(['primary_button', 'secondary_button', 'link'])(
            '%s: renders the icon after the label instead of the arrow',
            (variant) => {
                const markup = render({ variant, icon: 'arrow-right' });

                expect(markup).toContain(
                    'Read the study<span class="orbit-link__icon" aria-hidden="true">arrow-right</span></a>',
                );
                expect(markup).not.toContain('orbit-link__arrow');
            },
        );
    });

    describe('alignment', () => {
        it.each(['left', 'center', 'right'])('%s: the root carries its alignment variant', (alignment) => {
            const classes = rootClassList(render({ alignment }));

            expect(classes).toEqual(['orbit-link', `orbit-link--align-${alignment}`]);
        });

        it('falls back to left for an unknown alignment', () => {
            expect(rootClassList(render({ alignment: 'justify' }))).toContain('orbit-link--align-left');
        });
    });

    describe('links', () => {
        it('emits the href as is without resolveLink', () => {
            expect(render({ href: '/contact' })).toContain('href="/contact"');
        });

        it('resolves the href and applies target and rel from resolveLink', () => {
            const markup = render({
                href: 'https://example.test/trial',
                resolveLink: (href) => ({ href: `${href}?ref=hub`, target: '_blank', rel: 'noopener noreferrer' }),
            });

            expect(markup).toContain(
                '<a href="https://example.test/trial?ref=hub" target="_blank" rel="noopener noreferrer"',
            );
        });

        it('open_in_new_tab = true: the link opens in a new tab with noopener noreferrer', () => {
            const markup = render({ open_in_new_tab: true, editorMode: false });

            expect(markup).toContain('target="_blank"');
            expect(markup).toContain('rel="noopener noreferrer"');
        });

        it('open_in_new_tab = false: the link stays in the same tab', () => {
            const markup = render({ open_in_new_tab: false });

            expect(markup).not.toContain('target=');
            expect(markup).not.toContain('rel=');
        });
    });

    describe('editorMode', () => {
        it('is not a navigable link and keeps data-orbit-block', () => {
            const markup = render({ editorMode: true, open_in_new_tab: true });

            expect(markup).toContain('data-orbit-block="Link"');
            expect(markup).not.toContain('<a ');
            expect(markup).not.toContain('href=');
            expect(markup).toContain(
                '<span class="orbit-cta orbit-cta--link orbit-link__anchor">Read the study' +
                    '<span class="orbit-link__arrow" aria-hidden="true">→</span></span>',
            );
        });

        it.each([true, false])('editorMode=%s: renders no DAM trigger (Link has no DAM field)', (editorMode) => {
            const markup = render({ editorMode, onInlineSelectDamAsset: () => undefined });

            expect(markup).not.toContain('<button');
            expect(markup).not.toContain('orbit-inline-dam-trigger');
        });
    });

    it('sets no fixed font size, padding or width inline', () => {
        for (const props of [
            {},
            { variant: 'primary_button', alignment: 'center', icon: 'download' },
            { variant: 'secondary_button', alignment: 'right', editorMode: true },
        ] satisfies Partial<LinkComponentProps>[]) {
            expect(render(props)).not.toContain('style=');
        }
    });
});
