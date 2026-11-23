import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import {
    type CtaProps,
    isRenderableContent,
    renderCtaButton,
    renderInlineDamTrigger,
    resolveDamAssetUrl,
} from './Header';

export interface HeroBannerComponentProps extends OrbitComponentContextProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    alignment?: 'left' | 'center' | 'right' | string;
    dam_background_asset_id?: string;
    cta?: CtaProps;
}

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
}: HeroBannerComponentProps): React.ReactElement {
    const textAlign =
        alignment === 'center' || alignment === 'right' ? alignment : 'left';
    const backgroundUrl = dam_background_asset_id
        ? resolveDamAssetUrl(dam_background_asset_id, resolveAssetUrl)
        : undefined;

    return (
        <div
            data-orbit-block="HeroBanner"
            data-orbit-hero-theme={String(siteTheme).toLowerCase()}
            className="orbit-card"
            style={{
                padding: '3.5rem 2rem',
                textAlign,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div className="orbit-container">
                {(backgroundUrl || editorMode) && (
                    <div
                        data-orbit-dam-asset={dam_background_asset_id}
                        style={{
                            fontSize: '0.75rem',
                            opacity: 0.9,
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            justifyContent:
                                textAlign === 'center'
                                    ? 'center'
                                    : textAlign === 'right'
                                      ? 'flex-end'
                                      : 'flex-start',
                        }}
                    >
                        {backgroundUrl && (
                            <span style={{ opacity: 0.75 }}>
                                DAM: {dam_background_asset_id}
                            </span>
                        )}
                        {renderInlineDamTrigger({
                            editorMode,
                            propPath: 'dam_background_asset_id',
                            currentAssetId: dam_background_asset_id,
                            allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                            label: selectAssetLabel,
                            onInlineSelectDamAsset,
                        })}
                    </div>
                )}
                <h1
                    className="orbit-heading"
                    style={{
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                    }}
                >
                    {title}
                </h1>
                {isRenderableContent(subtitle) && (
                    <p
                        style={{
                            fontSize: '1.125rem',
                            opacity: 0.85,
                            marginBottom: '1.5rem',
                        }}
                    >
                        {subtitle}
                    </p>
                )}
                {renderCtaButton(cta, editorMode)}
            </div>
        </div>
    );
}
