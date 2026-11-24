// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    getAutoplayIntervalMs,
    InteractiveSlideshow,
    type InteractiveSlideshowComponentProps,
    type SlideshowSlide,
} from '../core/InteractiveSlideshow';

const MINIMAL_SCHEMA_PROPS: InteractiveSlideshowComponentProps = {
    aria_live_mode: 'polite',
    slides: [{ dam_asset_id: 'dam_slide_one', alt_text: 'Patients in the waiting room.' }],
};

const THREE_SLIDES: SlideshowSlide[] = [
    { dam_asset_id: 'dam_slide_one', alt_text: 'First slide image.', caption: 'First caption.' },
    { dam_asset_id: 'dam_slide_two', alt_text: 'Second slide image.' },
    { dam_asset_id: 'dam_slide_three', alt_text: 'Third slide image.', caption: 'Third caption.' },
];

function render(props: Partial<InteractiveSlideshowComponentProps> = {}): string {
    return renderToStaticMarkup(<InteractiveSlideshow {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

function count(markup: string, needle: string): number {
    return markup.split(needle).length - 1;
}

function trackTag(markup: string): string {
    const match = markup.match(/<div class="orbit-interactive-slideshow__track"[^>]*>/);

    return match ? match[0] : '';
}

describe('InteractiveSlideshow', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the root region with the reference structure', () => {
            const markup = render();

            expect(markup).toMatch(
                /<div class="orbit-interactive-slideshow" data-orbit-block="InteractiveSlideshow" role="region" aria-roledescription="carousel" aria-label="Slideshow">/,
            );
            expect(trackTag(markup)).not.toBe('');
            expect(markup).toContain(
                '<figure class="orbit-interactive-slideshow__slide" aria-roledescription="slide" aria-label="1 of 1">',
            );
            expect(markup).toMatch(
                /<img class="orbit-interactive-slideshow__image" src="[^"]+" alt="Patients in the waiting room\." loading="lazy" decoding="async"\/>/,
            );
        });

        it('makes the scrollable track reachable with the keyboard', () => {
            expect(trackTag(render())).toContain('tabindex="0"');
        });

        it('places the slides inside the track', () => {
            const markup = render();

            expect(markup.indexOf('orbit-interactive-slideshow__track')).toBeLessThan(
                markup.indexOf('orbit-interactive-slideshow__slide'),
            );
        });

        it('renders no controls for a single slide', () => {
            const markup = render();

            expect(markup).not.toContain('orbit-interactive-slideshow__controls');
            expect(markup).not.toContain('<button');
        });

        it('renders no caption element without a caption', () => {
            expect(render()).not.toContain('<figcaption');
        });

        it('renders the caption below the image', () => {
            const markup = render({
                slides: [{ dam_asset_id: 'dam_slide_one', alt_text: 'Alt text.', caption: 'Our clinic.' }],
            });

            expect(markup).toContain(
                '<figcaption class="orbit-interactive-slideshow__caption">Our clinic.</figcaption>',
            );
            expect(markup.indexOf('orbit-interactive-slideshow__image')).toBeLessThan(
                markup.indexOf('orbit-interactive-slideshow__caption'),
            );
        });

        it('keeps the React node content of the caption', () => {
            const markup = render({
                slides: [
                    {
                        dam_asset_id: 'dam_slide_one',
                        alt_text: 'Alt text.',
                        caption: <span data-testid="inline-caption">Inline caption</span>,
                    },
                ],
            });

            expect(markup).toContain('<span data-testid="inline-caption">Inline caption</span>');
        });

        it('falls back to one placeholder slide when there are no slides', () => {
            const markup = render({ slides: [] });

            expect(count(markup, '<figure class="orbit-interactive-slideshow__slide"')).toBe(1);
            expect(markup).toContain('src="/api/v1/dam/assets/dam_default_slide/stream"');
            expect(markup).toContain('alt="Slide"');
        });
    });

    describe('track with three slides', () => {
        const markup = render({ slides: THREE_SLIDES });

        it('contains the three slides in the track', () => {
            expect(count(markup, '<figure class="orbit-interactive-slideshow__slide"')).toBe(3);
            expect(markup).toContain('aria-label="1 of 3"');
            expect(markup).toContain('aria-label="2 of 3"');
            expect(markup).toContain('aria-label="3 of 3"');
        });

        it('renders the previous and next controls after the track', () => {
            expect(markup).toContain(
                '<div class="orbit-interactive-slideshow__controls"><button type="button" class="orbit-interactive-slideshow__prev" aria-label="Previous">‹</button><button type="button" class="orbit-interactive-slideshow__next" aria-label="Next">›</button></div>',
            );
            expect(markup.lastIndexOf('orbit-interactive-slideshow__slide')).toBeLessThan(
                markup.indexOf('orbit-interactive-slideshow__controls'),
            );
        });

        it('renders the same markup with and without autoplay, so hydration matches', () => {
            expect(render({ slides: THREE_SLIDES, autoplay: true, autoplay_interval_seconds: 8 })).toBe(markup);
        });
    });

    describe('aria_live_mode', () => {
        it.each(['polite', 'assertive', 'off'] as const)('sets aria-live="%s" on the track', (mode) => {
            expect(trackTag(render({ aria_live_mode: mode }))).toContain(`aria-live="${mode}"`);
        });

        it('defaults to polite', () => {
            expect(trackTag(render({ aria_live_mode: undefined }))).toContain('aria-live="polite"');
        });
    });

    describe('images from the DAM', () => {
        it('resolves every slide dam_asset_id through resolveAssetUrl', () => {
            const markup = render({
                slides: THREE_SLIDES,
                resolveAssetUrl: (damId) => `https://cdn.example.test/media/${damId}`,
            });

            expect(markup).toContain('src="https://cdn.example.test/media/dam_slide_one"');
            expect(markup).toContain('src="https://cdn.example.test/media/dam_slide_two"');
            expect(markup).toContain('src="https://cdn.example.test/media/dam_slide_three"');
        });

        it('falls back to the Control Plane stream endpoint without resolveAssetUrl', () => {
            expect(render()).toContain('src="/api/v1/dam/assets/dam_slide_one/stream"');
        });
    });

    describe('autoplay', () => {
        it('schedules no automatic advance in editorMode', () => {
            expect(getAutoplayIntervalMs({ autoplay: true, intervalSeconds: 5, editorMode: true, slideCount: 3 })).toBeNull();
        });

        it('schedules no automatic advance when autoplay is off', () => {
            expect(getAutoplayIntervalMs({ autoplay: false, intervalSeconds: 5, editorMode: false, slideCount: 3 })).toBeNull();
        });

        it('schedules no automatic advance for a single slide', () => {
            expect(getAutoplayIntervalMs({ autoplay: true, intervalSeconds: 5, editorMode: false, slideCount: 1 })).toBeNull();
        });

        it('advances every autoplay_interval_seconds', () => {
            expect(getAutoplayIntervalMs({ autoplay: true, intervalSeconds: 8, editorMode: false, slideCount: 3 })).toBe(8000);
        });

        it.each([undefined, 2, 31, 4.5, Number.NaN])('falls back to 5 seconds for interval %s', (intervalSeconds) => {
            expect(getAutoplayIntervalMs({ autoplay: true, intervalSeconds, editorMode: false, slideCount: 3 })).toBe(5000);
        });
    });

    describe('editorMode', () => {
        const onInlineSelectDamAsset = () => undefined;

        it('renders one inline DAM trigger per slide and keeps data-orbit-block', () => {
            const markup = render({ slides: THREE_SLIDES, editorMode: true, onInlineSelectDamAsset });

            expect(markup).toContain('data-orbit-block="InteractiveSlideshow"');
            expect(count(markup, 'data-orbit-inline-dam-trigger="true"')).toBe(3);
            expect(markup).toContain('data-orbit-inline-dam-prop="slides[0].dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-prop="slides[1].dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-prop="slides[2].dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-current="dam_slide_two"');
            expect(count(markup, 'class="orbit-interactive-slideshow__dam-trigger"')).toBe(3);
            expect(markup).toContain(
                'class="orbit-interactive-slideshow__image orbit-interactive-slideshow__image--selectable"',
            );
        });

        it('never nests the trigger inside a link or another button', () => {
            const markup = render({ slides: THREE_SLIDES, editorMode: true, onInlineSelectDamAsset });

            expect(markup).not.toContain('<a ');
            expect(markup).not.toMatch(/<button[^>]*>[^<]*<button/);
        });

        it('renders no trigger outside editorMode', () => {
            const markup = render({ slides: THREE_SLIDES, editorMode: false, onInlineSelectDamAsset });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('orbit-interactive-slideshow__dam-trigger');
            expect(markup).not.toContain('orbit-interactive-slideshow__image--selectable');
        });
    });

    describe('inline styles', () => {
        it('sets no inline style at all', () => {
            const markup = render({
                slides: THREE_SLIDES,
                autoplay: true,
                editorMode: true,
                onInlineSelectDamAsset: () => undefined,
            });

            expect(markup).not.toContain('style=');
        });
    });
});
