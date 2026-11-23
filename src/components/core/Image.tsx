import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import {
    isRenderableContent,
    renderInlineDamTrigger,
    resolveDamAssetUrl,
} from './Header';

export interface ImageComponentProps extends OrbitComponentContextProps {
    dam_asset_id?: string;
    alt_text?: string;
    caption?: React.ReactNode;
    href?: string;
    open_in_new_tab?: boolean;
    aspect_ratio?: string;
}

export function Image({
    dam_asset_id = 'dam_default_image',
    alt_text = 'Image',
    caption,
    aspect_ratio = '16:9',
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: ImageComponentProps): React.ReactElement {
    const safeAlt = typeof alt_text === 'string' ? alt_text : 'Image';

    return (
        <figure
            data-orbit-block="Image"
            data-orbit-aspect-ratio={aspect_ratio}
            className="orbit-container"
            style={{ margin: 0, position: 'relative' }}
        >
            <div style={{ position: 'relative' }}>
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
                        border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
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
            {isRenderableContent(caption) && (
                <figcaption
                    style={{
                        marginTop: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: 0.75,
                    }}
                >
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
