import React, { useState } from 'react';
import type { OrbitComponentContextProps } from '../../types';
import {
    isRenderableContent,
    renderInlineDamTrigger,
    resolveDamAssetUrl,
} from './Header';

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

export function InteractiveSlideshow({
    aria_live_mode = 'polite',
    slides = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: InteractiveSlideshowComponentProps): React.ReactElement {
    const safeSlides = Array.isArray(slides) && slides.length > 0
        ? slides
        : [{ dam_asset_id: 'dam_default_slide', alt_text: 'Slide', caption: '' }];

    const [activeIndex, setActiveIndex] = useState(0);
    const activeSlide: SlideshowSlide = safeSlides[activeIndex] ??
        safeSlides[0] ?? { dam_asset_id: 'dam_default_slide', alt_text: 'Slide', caption: '' };
    const safeAlt =
        typeof activeSlide.alt_text === 'string' ? activeSlide.alt_text : 'Slide';

    return (
        <div
            data-orbit-block="InteractiveSlideshow"
            aria-live={aria_live_mode}
            className="orbit-container"
        >
            <div className="orbit-card" style={{ padding: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={resolveDamAssetUrl(activeSlide.dam_asset_id, resolveAssetUrl)}
                        alt={safeAlt}
                        onClick={
                            editorMode && typeof onInlineSelectDamAsset === 'function'
                                ? (event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onInlineSelectDamAsset({
                                          propPath: `slides[${activeIndex}].dam_asset_id`,
                                          currentAssetId: activeSlide.dam_asset_id,
                                          allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                                          label: selectAssetLabel,
                                      });
                                  }
                                : undefined
                        }
                        style={{
                            width: '100%',
                            borderRadius: 'var(--orbit-radius-base)',
                            display: 'block',
                            cursor:
                                editorMode && typeof onInlineSelectDamAsset === 'function'
                                    ? 'pointer'
                                    : undefined,
                        }}
                    />
                    {editorMode && typeof onInlineSelectDamAsset === 'function' && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '0.75rem',
                                right: '0.75rem',
                            }}
                        >
                            {renderInlineDamTrigger({
                                editorMode,
                                propPath: `slides[${activeIndex}].dam_asset_id`,
                                currentAssetId: activeSlide.dam_asset_id,
                                allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                                label: selectAssetLabel,
                                onInlineSelectDamAsset,
                            })}
                        </div>
                    )}
                </div>
                {isRenderableContent(activeSlide.caption) && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                        {activeSlide.caption}
                    </p>
                )}
                {safeSlides.length > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                        }}
                    >
                        <button
                            type="button"
                            className="orbit-btn-secondary"
                            onClick={() =>
                                setActiveIndex(
                                    (prev) => (prev - 1 + safeSlides.length) % safeSlides.length,
                                )
                            }
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>
                            {activeIndex + 1} / {safeSlides.length}
                        </span>
                        <button
                            type="button"
                            className="orbit-btn-secondary"
                            onClick={() =>
                                setActiveIndex((prev) => (prev + 1) % safeSlides.length)
                            }
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
