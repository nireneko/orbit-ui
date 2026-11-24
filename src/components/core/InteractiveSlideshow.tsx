import React, { useCallback, useEffect, useRef } from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface SlideshowSlide {
    dam_asset_id?: string;
    alt_text?: string;
    caption?: React.ReactNode;
}

export interface InteractiveSlideshowComponentProps extends OrbitComponentContextProps {
    autoplay?: boolean;
    autoplay_interval_seconds?: number;
    aria_live_mode?: 'polite' | 'assertive' | 'off';
    slides?: SlideshowSlide[];
}

export interface AutoplayOptions {
    autoplay: boolean;
    intervalSeconds: number | undefined;
    editorMode: boolean;
    slideCount: number;
}

const BLOCK = 'orbit-interactive-slideshow';
const SLIDE_DAM_TYPES = ['IMAGE', 'INFOGRAPHIC'];
const DEFAULT_SLIDE_ALT = 'Slide';
const PLACEHOLDER_SLIDE: SlideshowSlide = { dam_asset_id: 'dam_default_slide', alt_text: DEFAULT_SLIDE_ALT, caption: '' };
const REGION_ROLE_DESCRIPTION = 'carousel';
const REGION_LABEL = 'Slideshow';
const SLIDE_ROLE_DESCRIPTION = 'slide';
const PREVIOUS_LABEL = 'Previous';
const NEXT_LABEL = 'Next';
/** Bounds and fallback of `autoplay_interval_seconds` in the Symfony schema. */
const MIN_INTERVAL_SECONDS = 3;
const MAX_INTERVAL_SECONDS = 30;
const DEFAULT_INTERVAL_SECONDS = 5;

/**
 * Milliseconds between automatic advances, or `null` when nothing is scheduled:
 * autoplay off, the editor canvas (a moving track blocks editing) or a single slide.
 * An interval outside the schema range falls back to 5 seconds, as in the reference.
 */
export function getAutoplayIntervalMs({ autoplay, intervalSeconds, editorMode, slideCount }: AutoplayOptions): number | null {
    if (!autoplay || editorMode || slideCount < 2) {
        return null;
    }

    const seconds =
        typeof intervalSeconds === 'number' &&
        Number.isInteger(intervalSeconds) &&
        intervalSeconds >= MIN_INTERVAL_SECONDS &&
        intervalSeconds <= MAX_INTERVAL_SECONDS
            ? intervalSeconds
            : DEFAULT_INTERVAL_SECONDS;

    return seconds * 1000;
}

/**
 * Scroll-snap track holding every slide, with previous/next controls and optional autoplay.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/media/InteractiveSlideshow.astro.
 *
 * The markup never depends on client state, so the server render matches the first client
 * render (`client:visible`) and the track still scrolls natively without JavaScript.
 * The controls and the autoplay only move the track, after mount.
 */
export function InteractiveSlideshow({
    autoplay = false,
    autoplay_interval_seconds,
    aria_live_mode = 'polite',
    slides = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: InteractiveSlideshowComponentProps): React.ReactElement {
    const safeSlides = Array.isArray(slides) && slides.length > 0 ? slides : [PLACEHOLDER_SLIDE];
    const slideCount = safeSlides.length;
    const canSelectAsset = editorMode && typeof onInlineSelectDamAsset === 'function';
    const imageClassName = canSelectAsset ? `${BLOCK}__image ${BLOCK}__image--selectable` : `${BLOCK}__image`;

    const rootRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const indexRef = useRef(0);

    const goTo = useCallback(
        (next: number) => {
            const track = trackRef.current;

            if (!track) {
                return;
            }

            indexRef.current = (next + slideCount) % slideCount;
            const slide = track.children.item(indexRef.current);

            if (!(slide instanceof HTMLElement)) {
                return;
            }

            // Scrolls only the track (centred, as the reference's scrollIntoView), never the page.
            const trackRect = track.getBoundingClientRect();
            const slideRect = slide.getBoundingClientRect();
            const left = track.scrollLeft + slideRect.left - trackRect.left - (trackRect.width - slideRect.width) / 2;

            track.scrollTo({ left, behavior: 'smooth' });
        },
        [slideCount],
    );

    const intervalMs = getAutoplayIntervalMs({
        autoplay,
        intervalSeconds: autoplay_interval_seconds,
        editorMode,
        slideCount,
    });

    useEffect(() => {
        const root = rootRef.current;

        if (intervalMs === null || !root) {
            return undefined;
        }

        const timer = window.setInterval(() => goTo(indexRef.current + 1), intervalMs);
        // As in the reference, pointer or focus inside the slideshow stops the autoplay for good.
        const stop = (): void => window.clearInterval(timer);

        root.addEventListener('mouseenter', stop);
        root.addEventListener('focusin', stop);

        return () => {
            stop();
            root.removeEventListener('mouseenter', stop);
            root.removeEventListener('focusin', stop);
        };
    }, [intervalMs, goTo]);

    return (
        <div
            ref={rootRef}
            className={BLOCK}
            data-orbit-block="InteractiveSlideshow"
            role="region"
            aria-roledescription={REGION_ROLE_DESCRIPTION}
            aria-label={REGION_LABEL}
        >
            {/* tabIndex lets keyboard users scroll the track, which holds no focusable content outside the editor. */}
            <div ref={trackRef} className={`${BLOCK}__track`} aria-live={aria_live_mode} tabIndex={0}>
                {safeSlides.map((slide, index) => {
                    const propPath = `slides[${index}].dam_asset_id`;
                    const alt = typeof slide.alt_text === 'string' ? slide.alt_text : DEFAULT_SLIDE_ALT;

                    return (
                        <figure
                            key={index}
                            className={`${BLOCK}__slide`}
                            aria-roledescription={SLIDE_ROLE_DESCRIPTION}
                            aria-label={`${index + 1} of ${slideCount}`}
                        >
                            <img
                                className={imageClassName}
                                src={resolveDamAssetUrl(slide.dam_asset_id, resolveAssetUrl)}
                                alt={alt}
                                loading="lazy"
                                decoding="async"
                                onClick={
                                    canSelectAsset
                                        ? (event) => {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              onInlineSelectDamAsset({
                                                  propPath,
                                                  currentAssetId: slide.dam_asset_id,
                                                  allowedDamTypes: SLIDE_DAM_TYPES,
                                                  label: selectAssetLabel,
                                              });
                                          }
                                        : undefined
                                }
                            />
                            {canSelectAsset && (
                                <div className={`${BLOCK}__dam-trigger`}>
                                    {renderInlineDamTrigger({
                                        editorMode,
                                        propPath,
                                        currentAssetId: slide.dam_asset_id,
                                        allowedDamTypes: SLIDE_DAM_TYPES,
                                        label: selectAssetLabel,
                                        onInlineSelectDamAsset,
                                    })}
                                </div>
                            )}
                            {isRenderableContent(slide.caption) && (
                                <figcaption className={`${BLOCK}__caption`}>{slide.caption}</figcaption>
                            )}
                        </figure>
                    );
                })}
            </div>

            {slideCount > 1 && (
                <div className={`${BLOCK}__controls`}>
                    <button
                        type="button"
                        className={`${BLOCK}__prev`}
                        aria-label={PREVIOUS_LABEL}
                        onClick={() => goTo(indexRef.current - 1)}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        className={`${BLOCK}__next`}
                        aria-label={NEXT_LABEL}
                        onClick={() => goTo(indexRef.current + 1)}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
