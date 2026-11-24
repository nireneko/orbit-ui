import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface ImageComponentProps extends OrbitComponentContextProps {
    dam_asset_id?: string;
    alt_text?: string;
    caption?: React.ReactNode;
    href?: string;
    open_in_new_tab?: boolean;
    aspect_ratio?: string;
}

const BLOCK = 'orbit-image';
const IMAGE_DAM_TYPES = ['IMAGE', 'INFOGRAPHIC'];
const IMAGE_PROP_PATH = 'dam_asset_id';
const NEW_TAB_TARGET = '_blank';
const NEW_TAB_REL = 'noopener noreferrer';

/** CSS `aspect-ratio` for each ratio of the schema enum; `auto` reserves no box. */
const ASPECT_RATIOS: Record<string, string> = {
    '16:9': '16 / 9',
    '4:3': '4 / 3',
    '1:1': '1 / 1',
    '3:4': '3 / 4',
};

/**
 * Single image with an optional link and caption.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/media/Image.astro.
 */
export function Image({
    dam_asset_id = 'dam_default_image',
    alt_text = 'Image',
    caption,
    href,
    open_in_new_tab = false,
    aspect_ratio = '16:9',
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
    resolveLink,
}: ImageComponentProps): React.ReactElement {
    const safeAlt = typeof alt_text === 'string' ? alt_text : 'Image';
    const cssAspectRatio = ASPECT_RATIOS[aspect_ratio];
    const canSelectAsset = editorMode && typeof onInlineSelectDamAsset === 'function';
    const imageClassName = canSelectAsset ? `${BLOCK}__img ${BLOCK}__img--selectable` : `${BLOCK}__img`;

    const image = (
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
    );

    // The editor canvas never navigates away, so the link exists only outside editorMode.
    const hasLink = !editorMode && typeof href === 'string' && href.trim() !== '';
    let linkedImage = image;

    if (hasLink) {
        const link = resolveLink ? resolveLink(href) : { href };
        const target = link.target ?? (open_in_new_tab ? NEW_TAB_TARGET : undefined);
        const rel = link.rel ?? (target === NEW_TAB_TARGET ? NEW_TAB_REL : undefined);

        linkedImage = (
            <a href={link.href} target={target} rel={rel}>
                {image}
            </a>
        );
    }

    return (
        <figure className={BLOCK} data-orbit-block="Image" data-orbit-aspect-ratio={aspect_ratio}>
            <div
                className={`${BLOCK}__frame`}
                style={cssAspectRatio ? { aspectRatio: cssAspectRatio } : undefined}
            >
                {linkedImage}
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
            {isRenderableContent(caption) && <figcaption className={`${BLOCK}__caption`}>{caption}</figcaption>}
        </figure>
    );
}
