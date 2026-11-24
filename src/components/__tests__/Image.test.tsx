// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Image, type ImageComponentProps } from '../core/Image';

const MINIMAL_SCHEMA_PROPS: ImageComponentProps = {
    dam_asset_id: 'dam_lab_photo',
    alt_text: 'Laboratory team at work.',
};

function render(props: Partial<ImageComponentProps> = {}): string {
    return renderToStaticMarkup(<Image {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

function frameTag(markup: string): string {
    const match = markup.match(/<div class="orbit-image__frame"[^>]*>/);

    return match ? match[0] : '';
}

function styleAttributes(markup: string): string[] {
    return [...markup.matchAll(/style="([^"]*)"/g)].map((match) => match[1]);
}

describe('Image', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the root figure with the reference structure', () => {
            const markup = render();

            expect(markup).toMatch(/<figure class="orbit-image" data-orbit-block="Image"[^>]*>/);
            expect(frameTag(markup)).not.toBe('');
            expect(markup).toMatch(
                /<img class="orbit-image__img" src="[^"]+" alt="Laboratory team at work\." loading="lazy" decoding="async"\/>/,
            );
        });

        it('places the image inside the frame', () => {
            const markup = render();

            expect(markup.indexOf('orbit-image__frame')).toBeLessThan(markup.indexOf('orbit-image__img'));
        });

        it('renders no caption element without a caption', () => {
            expect(render()).not.toContain('<figcaption');
        });

        it('renders the caption below the frame', () => {
            const markup = render({ caption: 'Our lab in Madrid.' });

            expect(markup).toContain('<figcaption class="orbit-image__caption">Our lab in Madrid.</figcaption>');
            expect(markup.indexOf('orbit-image__frame')).toBeLessThan(markup.indexOf('orbit-image__caption'));
        });

        it('keeps the React node content of the caption', () => {
            const markup = render({ caption: <span data-testid="inline-caption">Inline caption</span> });

            expect(markup).toContain('<span data-testid="inline-caption">Inline caption</span>');
        });
    });

    describe('aspect_ratio', () => {
        it.each([
            ['16:9', '16 / 9'],
            ['4:3', '4 / 3'],
            ['1:1', '1 / 1'],
            ['3:4', '3 / 4'],
        ])('reserves a %s box', (ratio, cssRatio) => {
            const markup = render({ aspect_ratio: ratio });

            expect(frameTag(markup)).toContain(`style="aspect-ratio:${cssRatio}"`);
            expect(markup).toContain(`data-orbit-aspect-ratio="${ratio}"`);
        });

        it('reserves no box for auto', () => {
            const markup = render({ aspect_ratio: 'auto' });

            expect(frameTag(markup)).toBe('<div class="orbit-image__frame">');
            expect(markup).toContain('data-orbit-aspect-ratio="auto"');
        });

        it('defaults to a 16:9 box', () => {
            expect(frameTag(render({ aspect_ratio: undefined }))).toContain('style="aspect-ratio:16 / 9"');
        });

        it('reserves no box for a ratio outside the schema enum', () => {
            expect(frameTag(render({ aspect_ratio: '21:9' }))).toBe('<div class="orbit-image__frame">');
        });
    });

    describe('image from the DAM', () => {
        it('resolves dam_asset_id through resolveAssetUrl', () => {
            const markup = render({ resolveAssetUrl: (damId) => `https://cdn.example.test/media/${damId}` });

            expect(markup).toContain('src="https://cdn.example.test/media/dam_lab_photo"');
        });

        it('falls back to the Control Plane stream endpoint without resolveAssetUrl', () => {
            expect(render()).toContain('src="/api/v1/dam/assets/dam_lab_photo/stream"');
        });
    });

    describe('link', () => {
        it('wraps the image in a link that opens in a new tab', () => {
            const markup = render({ href: 'https://example.test/study', open_in_new_tab: true });

            expect(markup).toMatch(
                /<a href="https:\/\/example\.test\/study" target="_blank" rel="noopener noreferrer"><img class="orbit-image__img"[^>]*\/><\/a>/,
            );
        });

        it('wraps the image in a same-tab link when open_in_new_tab is false', () => {
            const markup = render({ href: '/contact', open_in_new_tab: false });

            expect(markup).toMatch(/<a href="\/contact"><img class="orbit-image__img"/);
        });

        it('resolves the href and applies the target and rel from resolveLink', () => {
            const markup = render({
                href: 'hub://home',
                resolveLink: (href) => ({
                    href: href.replace('hub://', '/live/acme/site/'),
                    target: '_self',
                    rel: 'bookmark',
                }),
            });

            expect(markup).toMatch(/<a href="\/live\/acme\/site\/home" target="_self" rel="bookmark"><img/);
        });

        it('renders no link without an href', () => {
            expect(render({ open_in_new_tab: true })).not.toContain('<a ');
        });

        it('renders no link in editorMode so the canvas never navigates away', () => {
            expect(render({ href: 'https://example.test/study', editorMode: true })).not.toContain('<a ');
        });
    });

    describe('editorMode', () => {
        const onInlineSelectDamAsset = () => undefined;

        it('renders the inline DAM trigger and keeps data-orbit-block', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset, href: 'hub://home' });

            expect(markup).toContain('data-orbit-block="Image"');
            expect(markup).toContain('data-orbit-inline-dam-trigger="true"');
            expect(markup).toContain('data-orbit-inline-dam-prop="dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-current="dam_lab_photo"');
            expect(markup).toContain('class="orbit-image__dam-trigger"');
            expect(markup).toContain('class="orbit-image__img orbit-image__img--selectable"');
        });

        it('renders no trigger outside editorMode', () => {
            const markup = render({ editorMode: false, onInlineSelectDamAsset });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('orbit-image__dam-trigger');
            expect(markup).not.toContain('orbit-image__img--selectable');
        });
    });

    describe('inline styles', () => {
        it('sets no fixed font size, padding, margin or width inline', () => {
            const markup = render({
                caption: 'Caption',
                href: '/contact',
                aspect_ratio: '4:3',
                editorMode: true,
                onInlineSelectDamAsset: () => undefined,
            });

            expect(styleAttributes(markup)).toEqual(['aspect-ratio:4 / 3']);
        });
    });
});
