// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ImageAndText, type ImageAndTextComponentProps } from '../core/ImageAndText';

const MINIMAL_SCHEMA_PROPS: ImageAndTextComponentProps = {
    dam_asset_id: 'dam_lab_photo',
    alt_text: 'Laboratory team at work.',
    heading: 'Research that matters',
    body: 'Our teams publish every study we run.',
    image_position: 'left',
};

function render(props: Partial<ImageAndTextComponentProps> = {}): string {
    return renderToStaticMarkup(<ImageAndText {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

/** The shared CTA stylesheet: ImageAndText adds no colour of its own to `.orbit-cta`. */
const CTA_CSS = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../../styles/components/cta.css'),
    'utf8',
);

/** Top-level rules of a flat stylesheet, comments removed, with the `@media` block each sits in. */
function cssRules(css: string): Array<{ media: string | null; selector: string; body: string }> {
    const rules: Array<{ media: string | null; selector: string; body: string }> = [];
    const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const blocks = source.matchAll(/(@media[^{]+)\{((?:[^{}]*\{[^}]*\})*)\s*\}|([^{}@]+)\{([^}]*)\}/g);

    for (const [, media, inner, selector, body] of blocks) {
        if (media !== undefined) {
            for (const [, nestedSelector, nestedBody] of (inner ?? '').matchAll(/([^{}]+)\{([^}]*)\}/g)) {
                rules.push({ media: media.trim(), selector: (nestedSelector ?? '').trim(), body: nestedBody ?? '' });
            }
        } else {
            rules.push({ media: null, selector: (selector ?? '').trim(), body: body ?? '' });
        }
    }

    return rules;
}

/** Class, attribute and pseudo-class count of a simple selector (no ids in these stylesheets). */
function classSpecificity(selector: string): number {
    return (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;
}

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

describe('ImageAndText', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the root block with the reference structure', () => {
            const markup = render();

            expect(rootClassList(markup)).toContain('orbit-image-and-text');
            expect(markup).toContain('data-orbit-block="ImageAndText"');
            expect(markup).toContain('class="orbit-image-and-text__inner"');
            expect(markup).toContain('class="orbit-image-and-text__media" data-orbit-image-column="true"');
            expect(markup).toContain('class="orbit-image-and-text__content" data-orbit-text-column="true"');
            expect(markup).toContain('<h2 class="orbit-image-and-text__heading">Research that matters</h2>');
            expect(markup).toContain('<p class="orbit-image-and-text__body">Our teams publish every study we run.</p>');
        });

        it('places the image before the text in the markup so narrow screens stack it first', () => {
            const markup = render({ image_position: 'right' });

            expect(markup.indexOf('orbit-image-and-text__media')).toBeLessThan(
                markup.indexOf('orbit-image-and-text__content'),
            );
        });

        it('renders the image with the reference classes, alt text and loading hints', () => {
            const markup = render();

            expect(markup).toMatch(
                /<img class="orbit-image-and-text__image" src="[^"]+" alt="Laboratory team at work\." loading="lazy" decoding="async"\/>/,
            );
        });

        it('omits the heading and body elements when they are empty', () => {
            const markup = render({ heading: '', body: '' });

            expect(markup).not.toContain('orbit-image-and-text__heading');
            expect(markup).not.toContain('orbit-image-and-text__body');
        });

        it('keeps the React node content of heading and body', () => {
            const markup = render({
                heading: <span data-testid="inline-heading">Inline heading</span>,
                body: <span data-testid="inline-body">Inline body</span>,
            });

            expect(markup).toContain('<span data-testid="inline-heading">Inline heading</span>');
            expect(markup).toContain('<span data-testid="inline-body">Inline body</span>');
        });
    });

    describe('image from the DAM', () => {
        it('resolves dam_asset_id through resolveAssetUrl', () => {
            const markup = render({ resolveAssetUrl: (damId) => `https://cdn.example.test/media/${damId}` });

            expect(markup).toContain('src="https://cdn.example.test/media/dam_lab_photo"');
        });

        it('falls back to the Control Plane stream endpoint without resolveAssetUrl', () => {
            const markup = render();

            expect(markup).toContain('src="/api/v1/dam/assets/dam_lab_photo/stream"');
        });
    });

    describe('image_position', () => {
        it('left: the root carries the left image variant', () => {
            const classes = rootClassList(render({ image_position: 'left' }));

            expect(classes).toContain('orbit-image-and-text--image-left');
            expect(classes).not.toContain('orbit-image-and-text--image-right');
        });

        it('right: the root carries the right image variant', () => {
            const classes = rootClassList(render({ image_position: 'right' }));

            expect(classes).toContain('orbit-image-and-text--image-right');
            expect(classes).not.toContain('orbit-image-and-text--image-left');
        });
    });

    describe('background_variant', () => {
        it.each(['default', 'muted', 'accent'])('%s: the root carries its background variant', (variant) => {
            const markup = render({ background_variant: variant });

            expect(rootClassList(markup)).toContain(`orbit-image-and-text--background-${variant}`);
            expect(markup).toContain(`data-orbit-variant="${variant}"`);
        });

        it('falls back to the default background when the variant is missing', () => {
            const markup = render();

            expect(rootClassList(markup)).toContain('orbit-image-and-text--background-default');
        });
    });

    describe('cta', () => {
        it.each([
            ['primary_button', 'orbit-cta orbit-cta--primary'],
            ['secondary_button', 'orbit-cta orbit-cta--secondary'],
            ['link', 'orbit-cta orbit-cta--link'],
        ])('%s: renders the shared CTA with its variant', (variant, className) => {
            const markup = render({ cta: { label: 'Read the study', href: '/studies', variant } });

            expect(markup).toContain(`<a href="/studies" class="${className}">Read the study</a>`);
        });

        it('TASK-15.43: gives the primary CTA the on-accent label colour of the reference, over `.orbit-theme-shell a`', () => {
            const colourRules = cssRules(CTA_CSS).filter(
                ({ selector, body }) => selector.includes('orbit-cta--primary') && /(^|;|\s)color:/.test(body),
            );

            expect(colourRules.length).toBeGreaterThan(0);
            for (const { selector, body } of colourRules) {
                // text-white on bg-hub-primary in the reference.
                expect(body).toContain('color: var(--orbit-color-on-accent);');
                // `.orbit-theme-shell a` (shell.css) is (0,1,1); the label colour must outrank it.
                expect(classSpecificity(selector)).toBeGreaterThanOrEqual(2);
            }
        });

        it('TASK-15.43: applies the CTA hover states only on hover-capable devices, mixing colours in oklab', () => {
            const hoverRules = cssRules(CTA_CSS).filter(({ selector }) => selector.includes(':hover'));

            expect(hoverRules.length).toBeGreaterThan(0);
            for (const { media } of hoverRules) {
                expect(media).toBe('@media (hover: hover)');
            }
            expect(CTA_CSS).not.toContain('in srgb');
            expect(CTA_CSS).toContain(
                'background-color: color-mix(in oklab, var(--orbit-color-accent) 5%, transparent);',
            );
        });

        it('resolves the href through resolveLink and applies its target and rel', () => {
            const markup = render({
                cta: { label: 'Read the study', href: 'hub://studies', variant: 'primary_button' },
                resolveLink: (href) => ({
                    href: href.replace('hub://', 'https://site.example.test/'),
                    target: '_blank',
                    rel: 'noopener noreferrer',
                }),
            });

            expect(markup).toContain(
                '<a href="https://site.example.test/studies" target="_blank" rel="noopener noreferrer" class="orbit-cta orbit-cta--primary">Read the study</a>',
            );
        });

        it('emits the href as is without resolveLink', () => {
            const markup = render({ cta: { label: 'Read the study', href: 'hub://studies', variant: 'primary_button' } });

            expect(markup).toContain('<a href="hub://studies" class="orbit-cta orbit-cta--primary">Read the study</a>');
        });

        it('renders no CTA without a label', () => {
            const markup = render({ cta: { label: '', href: '/studies', variant: 'primary_button' } });

            expect(markup).not.toContain('orbit-cta');
        });
    });

    describe('editorMode', () => {
        const onInlineSelectDamAsset = (): void => undefined;

        it('renders the inline DAM trigger and keeps data-orbit-block in editorMode', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset, selectAssetLabel: 'Pick image' });

            expect(markup).toContain('data-orbit-block="ImageAndText"');
            expect(markup).toContain('class="orbit-image-and-text__dam-trigger"');
            expect(markup).toContain('data-orbit-inline-dam-trigger="true"');
            expect(markup).toContain('data-orbit-inline-dam-prop="dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-current="dam_lab_photo"');
            expect(markup).toContain('Pick image');
            expect(markup).toContain('orbit-image-and-text__image orbit-image-and-text__image--selectable');
        });

        it('renders the CTA as a non-navigable element in editorMode', () => {
            const markup = render({
                editorMode: true,
                cta: { label: 'Read the study', href: '/studies', variant: 'secondary_button' },
            });

            expect(markup).toContain('<span class="orbit-cta orbit-cta--secondary">Read the study</span>');
            expect(markup).not.toContain('href="/studies"');
        });

        it('renders no DAM trigger when editorMode is false', () => {
            const markup = render({ editorMode: false, onInlineSelectDamAsset });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('orbit-image-and-text__dam-trigger');
            expect(markup).not.toContain('orbit-image-and-text__image--selectable');
        });
    });

    describe('inline styles', () => {
        it('sets no fixed font size, padding or width inline', () => {
            const markups = [
                render({ cta: { label: 'Read the study', href: '/studies', variant: 'primary_button' } }),
                render({ editorMode: true, onInlineSelectDamAsset: () => undefined, image_position: 'right' }),
            ];

            for (const markup of markups) {
                expect(markup).not.toMatch(/style="[^"]*(font-size|padding|width)/);
            }
        });
    });
});
