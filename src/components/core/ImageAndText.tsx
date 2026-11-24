import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { type CtaProps, renderCtaButton } from '../../internal/cta';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface ImageAndTextComponentProps extends OrbitComponentContextProps {
    dam_asset_id?: string;
    alt_text?: string;
    heading?: React.ReactNode;
    body?: React.ReactNode;
    image_position?: 'left' | 'right' | string;
    background_variant?: 'default' | 'muted' | 'accent' | string;
    cta?: CtaProps;
}

export function ImageAndText({
    dam_asset_id = 'dam_default_image',
    alt_text = 'Image',
    heading = 'Section heading',
    body = '',
    image_position = 'left',
    background_variant = 'default',
    cta,
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: ImageAndTextComponentProps): React.ReactElement {
    const safeAlt = typeof alt_text === 'string' ? alt_text : 'Image';

    const imgElement = (
        <div data-orbit-image-column="true" style={{ position: 'relative' }}>
            <img
                src={resolveDamAssetUrl(dam_asset_id, resolveAssetUrl)}
                alt={safeAlt}
                onClick={
                    editorMode && typeof onInlineSelectDamAsset === 'function'
                        ? (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onInlineSelectDamAsset({
                                  propPath: 'dam_asset_id',
                                  currentAssetId: dam_asset_id,
                                  allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                                  label: selectAssetLabel,
                              });
                          }
                        : undefined
                }
                style={{
                    width: '100%',
                    borderRadius: 'var(--orbit-radius-lg)',
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
                        propPath: 'dam_asset_id',
                        currentAssetId: dam_asset_id,
                        allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                        label: selectAssetLabel,
                        onInlineSelectDamAsset,
                    })}
                </div>
            )}
        </div>
    );

    const textElement = (
        <div data-orbit-text-column="true">
            <h2
                className="orbit-heading"
                style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}
            >
                {heading}
            </h2>
            <p style={{ lineHeight: 1.65, marginBottom: '1.25rem' }}>{body}</p>
            {renderCtaButton(cta, editorMode)}
        </div>
    );

    return (
        <div
            data-orbit-block="ImageAndText"
            data-orbit-variant={background_variant}
            className="orbit-container"
        >
            <div
                className="orbit-card"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '2rem',
                    alignItems: 'center',
                    padding: '2rem',
                }}
            >
                {image_position === 'right' ? (
                    <>
                        {textElement}
                        {imgElement}
                    </>
                ) : (
                    <>
                        {imgElement}
                        {textElement}
                    </>
                )}
            </div>
        </div>
    );
}
