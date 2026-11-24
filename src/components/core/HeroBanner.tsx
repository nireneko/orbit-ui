import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { type CtaProps, renderCtaButton } from '../../internal/cta';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface HeroBannerComponentProps extends OrbitComponentContextProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    alignment?: 'left' | 'center' | 'right' | string;
    dam_background_asset_id?: string;
    cta?: CtaProps;
}

type HeroTheme = 'clean' | 'editorial' | 'clinical' | 'bold';
type HeroAlignment = 'left' | 'center' | 'right';

/** Same fallback as the reference's `resolveThemeName`: anything unknown renders as `clean`. */
function resolveHeroTheme(siteTheme: unknown): HeroTheme {
    const theme = String(siteTheme).toLowerCase();

    return theme === 'editorial' || theme === 'clinical' || theme === 'bold' ? theme : 'clean';
}

function resolveAlignment(alignment: unknown): HeroAlignment {
    return alignment === 'center' || alignment === 'right' ? alignment : 'left';
}

/**
 * Full-width accent band with a DAM background image.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/layout/HeroBanner.astro:
 * the `clean` and `bold` themes put the image full-bleed behind the content, `editorial`
 * and `clinical` put it in a second column (split layout). Styles: `hero-banner.css`.
 */
export function HeroBanner({
    title = 'Hero Banner',
    subtitle,
    alignment = 'left',
    dam_background_asset_id,
    cta,
    editorMode = false,
    siteTheme = 'CLEAN',
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
    tenantLabel,
    resolveLink,
}: HeroBannerComponentProps): React.ReactElement {
    const theme = resolveHeroTheme(siteTheme);
    const isSplitLayout = theme === 'editorial' || theme === 'clinical';
    const hasBackgroundAsset =
        typeof dam_background_asset_id === 'string' && dam_background_asset_id.trim() !== '';
    const imageUrl = hasBackgroundAsset
        ? resolveDamAssetUrl(dam_background_asset_id, resolveAssetUrl)
        : undefined;

    const rootClassName = [
        'orbit-hero-banner',
        `orbit-hero-banner--${theme}`,
        `orbit-hero-banner--align-${resolveAlignment(alignment)}`,
        isSplitLayout ? 'orbit-hero-banner--split' : null,
    ]
        .filter(Boolean)
        .join(' ');

    const damTrigger = renderInlineDamTrigger({
        editorMode,
        propPath: 'dam_background_asset_id',
        currentAssetId: dam_background_asset_id,
        allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
        label: selectAssetLabel,
        onInlineSelectDamAsset,
    });

    const image = imageUrl ? (
        <img
            className={
                isSplitLayout
                    ? 'orbit-hero-banner__image'
                    : 'orbit-hero-banner__image orbit-hero-banner__image--bleed'
            }
            src={imageUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            data-orbit-dam-asset={dam_background_asset_id}
        />
    ) : null;

    return (
        <section
            data-orbit-block="HeroBanner"
            data-orbit-hero-theme={String(siteTheme).toLowerCase()}
            className={rootClassName}
        >
            {!isSplitLayout && image}
            <div className="orbit-hero-banner__inner">
                <div className="orbit-hero-banner__content">
                    {damTrigger && (
                        <div className="orbit-hero-banner__dam" data-orbit-dam-asset={dam_background_asset_id}>
                            {damTrigger}
                        </div>
                    )}
                    {theme === 'bold' && typeof tenantLabel === 'string' && tenantLabel.trim() !== '' && (
                        <span className="orbit-hero-banner__badge">{tenantLabel}</span>
                    )}
                    {isRenderableContent(title) && <h1 className="orbit-hero-banner__title">{title}</h1>}
                    {isRenderableContent(subtitle) && (
                        <p className="orbit-hero-banner__subtitle">{subtitle}</p>
                    )}
                    {renderCtaButton(cta, editorMode, { resolveLink })}
                </div>
                {isSplitLayout && image && <div className="orbit-hero-banner__media">{image}</div>}
            </div>
        </section>
    );
}
