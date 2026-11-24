// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Youtube, type YoutubeComponentProps } from '../core/Youtube';

const DAM_ASSET_ID = 'dam_launch_video';
const VIDEO_ID = 'dQw4w9WgXcQ';

const MINIMAL_SCHEMA_PROPS: YoutubeComponentProps = {
    dam_asset_id: DAM_ASSET_ID,
    title: 'Product launch keynote',
};

const resolveExternalReference = (damId: string): string | undefined =>
    damId === DAM_ASSET_ID ? VIDEO_ID : undefined;

function render(props: Partial<YoutubeComponentProps> = {}): string {
    return renderToStaticMarkup(
        <Youtube {...MINIMAL_SCHEMA_PROPS} resolveExternalReference={resolveExternalReference} {...props} />,
    );
}

function rootTag(markup: string): string {
    const match = markup.match(/<figure[^>]*>/);

    return match ? match[0] : '';
}

function frameTag(markup: string): string {
    const match = markup.match(/<div class="orbit-youtube__frame"[^>]*>/);

    return match ? match[0] : '';
}

function inlineStyles(markup: string): string[] {
    return Array.from(markup.matchAll(/style="([^"]*)"/g), (match) => match[1] ?? '');
}

describe('Youtube', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the figure root, the frame and the iframe of the reference', () => {
            const markup = render();

            expect(rootTag(markup)).toContain('class="orbit-youtube"');
            expect(rootTag(markup)).toContain('data-orbit-block="Youtube"');
            expect(frameTag(markup)).not.toBe('');
            expect(markup).toMatch(
                /<iframe class="orbit-youtube__iframe" src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?start=0" title="Product launch keynote" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen=""><\/iframe>/,
            );
            expect(markup.indexOf('orbit-youtube__frame')).toBeLessThan(markup.indexOf('<iframe'));
        });

        it('renders the caption under the frame with the reference class', () => {
            const markup = render({ caption: 'Recorded at the 2026 summit.' });

            expect(markup).toContain(
                '<figcaption class="orbit-youtube__caption">Recorded at the 2026 summit.</figcaption>',
            );
            expect(markup.indexOf('orbit-youtube__frame')).toBeLessThan(markup.indexOf('<figcaption'));
        });

        it('omits the caption when it is empty', () => {
            expect(render({ caption: '  ' })).not.toContain('<figcaption');
        });

        it('falls back to the fixed iframe title when the title is blank', () => {
            expect(render({ title: '   ' })).toContain('title="YouTube video"');
        });
    });

    describe('aspect_ratio', () => {
        it.each([
            ['16:9', '16 / 9'],
            ['4:3', '4 / 3'],
            ['9:16', '9 / 16'],
        ])('renders %s as an inline aspect ratio on the frame', (aspectRatio, cssRatio) => {
            const markup = render({ aspect_ratio: aspectRatio });

            expect(rootTag(markup)).toContain(`data-orbit-aspect-ratio="${aspectRatio}"`);
            expect(frameTag(markup)).toContain(`style="aspect-ratio:${cssRatio}"`);
        });

        it('falls back to 16:9 for a ratio outside the schema enum', () => {
            const markup = render({ aspect_ratio: '21:9' });

            expect(frameTag(markup)).toContain('style="aspect-ratio:16 / 9"');
        });
    });

    describe('embed options', () => {
        it('uses the standard domain when privacy_mode is false', () => {
            expect(render({ privacy_mode: false })).toContain(
                'src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=0"',
            );
        });

        it('passes start_seconds to the embed URL', () => {
            expect(render({ start_seconds: 42 })).toContain('/embed/dQw4w9WgXcQ?start=42"');
        });

        it('drops the fullscreen permission when allow_fullscreen is false', () => {
            expect(render({ allow_fullscreen: false })).not.toMatch(/allowfullscreen/i);
        });

        it('encodes the resolved video id in the embed URL', () => {
            const markup = render({ resolveExternalReference: () => ' a/b?c ' });

            expect(markup).toContain('/embed/a%2Fb%3Fc?start=0"');
        });
    });

    describe('delivered page', () => {
        it('renders nothing when the video does not resolve', () => {
            expect(render({ resolveExternalReference: () => undefined })).toBe('');
        });

        it('renders nothing without a DAM asset id', () => {
            expect(render({ dam_asset_id: '' })).toBe('');
        });

        it('renders no DAM trigger and an interactive iframe outside editorMode', () => {
            const markup = render({ onInlineSelectDamAsset: vi.fn() });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('orbit-youtube__iframe--inert');
            expect(markup).not.toContain('orbit-youtube__placeholder');
        });
    });

    describe('editorMode', () => {
        it('shows the placeholder with the DAM trigger by default', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset: vi.fn() });

            expect(rootTag(markup)).toContain('data-orbit-block="Youtube"');
            expect(markup).not.toContain('<iframe');
            expect(markup).toContain('class="orbit-card orbit-youtube__placeholder"');
            expect(markup).toContain('<strong class="orbit-youtube__placeholder-title">Product launch keynote</strong>');
            expect(markup).toContain(
                `<span class="orbit-youtube__placeholder-meta">YouTube (${DAM_ASSET_ID}) · 16:9</span>`,
            );
            expect(markup).toContain('data-orbit-inline-dam-trigger="true"');
            expect(markup).toContain('data-orbit-inline-dam-prop="dam_asset_id"');
        });

        it('shows the placeholder when the preview is on but the video does not resolve', () => {
            const markup = render({
                editorMode: true,
                showMediaPreview: true,
                resolveExternalReference: () => undefined,
            });

            expect(markup).not.toContain('<iframe');
            expect(markup).toContain(`YouTube (${DAM_ASSET_ID})`);
        });

        it('shows an inert iframe and the DAM trigger when the preview is on', () => {
            const markup = render({
                editorMode: true,
                showMediaPreview: true,
                onInlineSelectDamAsset: vi.fn(),
            });

            expect(markup).toContain('class="orbit-youtube__iframe orbit-youtube__iframe--inert"');
            expect(markup).toContain('<div class="orbit-youtube__dam-trigger"><button');
            expect(markup.indexOf('orbit-youtube__frame')).toBeLessThan(markup.indexOf('orbit-youtube__dam-trigger'));
        });

        it('keeps React node content of title and caption', () => {
            const markup = render({
                editorMode: true,
                title: <span data-testid="inline-title">Inline title</span>,
                caption: <span data-testid="inline-caption">Inline caption</span>,
            });

            expect(markup).toContain('<span data-testid="inline-title">Inline title</span>');
            expect(markup).toContain('<span data-testid="inline-caption">Inline caption</span>');
        });

        it('renders no DAM trigger with editorMode false', () => {
            const markup = render({ editorMode: false, showMediaPreview: true, onInlineSelectDamAsset: vi.fn() });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('orbit-youtube__dam-trigger');
        });
    });

    describe('inline styles', () => {
        it.each([
            ['delivered page', {}],
            ['editor placeholder', { editorMode: true, onInlineSelectDamAsset: vi.fn() }],
            ['editor preview', { editorMode: true, showMediaPreview: true, onInlineSelectDamAsset: vi.fn() }],
        ])('sets no fixed font size, padding, margin or width inline (%s)', (_label, props) => {
            const markup = render({ caption: 'Caption', ...props });

            for (const style of inlineStyles(markup)) {
                expect(style).not.toMatch(/font-size|padding|margin|width|border/);
            }
        });
    });
});
