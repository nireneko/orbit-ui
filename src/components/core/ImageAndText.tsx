import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
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

const BLOCK = 'orbit-image-and-text';
const BACKGROUND_VARIANTS = ['default', 'muted', 'accent'];
const DEFAULT_BACKGROUND_VARIANT = 'default';
const IMAGE_DAM_TYPES = ['IMAGE', 'INFOGRAPHIC'];
const IMAGE_PROP_PATH = 'dam_asset_id';

/**
 * Image next to a heading, body and optional CTA.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/layout/ImageAndText.astro.
 */
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
    resolveLink,
}: ImageAndTextComponentProps): React.ReactElement {
    const safeAlt = typeof alt_text === 'string' ? alt_text : 'Image';
    const imageSide = image_position === 'right' ? 'right' : 'left';
    const background = BACKGROUND_VARIANTS.includes(background_variant)
        ? background_variant
        : DEFAULT_BACKGROUND_VARIANT;
    const canSelectAsset = editorMode && typeof onInlineSelectDamAsset === 'function';

    const rootClassName = [BLOCK, `${BLOCK}--image-${imageSide}`, `${BLOCK}--background-${background}`].join(' ');
    const imageClassName = canSelectAsset ? `${BLOCK}__image ${BLOCK}__image--selectable` : `${BLOCK}__image`;

    return (
        <div data-orbit-block="ImageAndText" data-orbit-variant={background_variant} className={rootClassName}>
            <div className={`${BLOCK}__inner`}>
                <div className={`${BLOCK}__media`} data-orbit-image-column="true">
                    <img
                        className={imageClassName}
                        src={resolveDamAssetUrl(dam_asset_id, resolveAssetUrl)}
                        alt={safeAlt}
                        loading="lazy"
                        decoding="async"
                        onClick={
                            canSelectAsset
                                ? (event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onInlineSelectDamAsset({
                                          propPath: IMAGE_PROP_PATH,
                                          currentAssetId: dam_asset_id,
                                          allowedDamTypes: IMAGE_DAM_TYPES,
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
                                propPath: IMAGE_PROP_PATH,
                                currentAssetId: dam_asset_id,
                                allowedDamTypes: IMAGE_DAM_TYPES,
                                label: selectAssetLabel,
                                onInlineSelectDamAsset,
                            })}
                        </div>
                    )}
                </div>
                <div className={`${BLOCK}__content`} data-orbit-text-column="true">
                    {isRenderableContent(heading) && <h2 className={`${BLOCK}__heading`}>{heading}</h2>}
                    {isRenderableContent(body) && <p className={`${BLOCK}__body`}>{body}</p>}
                    {renderCtaButton(cta, editorMode, { resolveLink })}
                </div>
            </div>
        </div>
    );
}
