import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface YoutubeComponentProps extends OrbitComponentContextProps {
    dam_asset_id?: string;
    title?: React.ReactNode;
    caption?: React.ReactNode;
    aspect_ratio?: string;
    start_seconds?: number;
    privacy_mode?: boolean;
    allow_fullscreen?: boolean;
}

const BLOCK = 'orbit-youtube';
const DEFAULT_IFRAME_TITLE = 'YouTube video';
const DEFAULT_ASPECT_RATIO = '16:9';
const ASPECT_RATIOS: Record<string, string> = {
    '16:9': '16 / 9',
    '4:3': '4 / 3',
    '9:16': '9 / 16',
};
const VIDEO_DAM_TYPES = ['VIDEO_YOUTUBE'];
const VIDEO_PROP_PATH = 'dam_asset_id';

/**
 * Embedded YouTube video resolved from a `VIDEO_YOUTUBE` DAM asset.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/media/Youtube.astro.
 */
export function Youtube({
    dam_asset_id,
    title = DEFAULT_IFRAME_TITLE,
    caption,
    aspect_ratio = DEFAULT_ASPECT_RATIO,
    start_seconds = 0,
    privacy_mode = true,
    allow_fullscreen = true,
    editorMode = false,
    showMediaPreview = false,
    resolveExternalReference,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: YoutubeComponentProps): React.ReactElement | null {
    const normalizedAssetId = typeof dam_asset_id === 'string' ? dam_asset_id.trim() : '';
    const resolvedVideoId =
        normalizedAssetId !== ''
            ? resolveExternalReference?.(normalizedAssetId)?.trim() || undefined
            : undefined;

    if (!editorMode && !resolvedVideoId) {
        return null;
    }

    const domain = privacy_mode
        ? 'https://www.youtube-nocookie.com'
        : 'https://www.youtube.com';
    const embedUrl = resolvedVideoId
        ? `${domain}/embed/${encodeURIComponent(resolvedVideoId)}?start=${start_seconds}`
        : undefined;
    const iframeTitle = (typeof title === 'string' ? title.trim() : '') || DEFAULT_IFRAME_TITLE;
    const cssAspectRatio = ASPECT_RATIOS[aspect_ratio] ?? ASPECT_RATIOS[DEFAULT_ASPECT_RATIO];
    const inlineDamTrigger = renderInlineDamTrigger({
        editorMode,
        propPath: VIDEO_PROP_PATH,
        currentAssetId: dam_asset_id,
        allowedDamTypes: VIDEO_DAM_TYPES,
        label: selectAssetLabel,
        onInlineSelectDamAsset,
    });
    const showPlaceholder = editorMode && (!showMediaPreview || !embedUrl);
    const iframeClassName = editorMode ? `${BLOCK}__iframe ${BLOCK}__iframe--inert` : `${BLOCK}__iframe`;

    return (
        <figure data-orbit-block="Youtube" data-orbit-aspect-ratio={aspect_ratio} className={BLOCK}>
            {showPlaceholder ? (
                <div className={`orbit-card ${BLOCK}__placeholder`}>
                    <strong className={`${BLOCK}__placeholder-title`}>{title}</strong>
                    <span className={`${BLOCK}__placeholder-meta`}>
                        YouTube ({normalizedAssetId || '—'}) · {aspect_ratio}
                    </span>
                    {inlineDamTrigger}
                </div>
            ) : (
                <>
                    <div className={`${BLOCK}__frame`} style={{ aspectRatio: cssAspectRatio }}>
                        <iframe
                            className={iframeClassName}
                            src={embedUrl}
                            title={iframeTitle}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen={allow_fullscreen}
                        />
                    </div>
                    {inlineDamTrigger && <div className={`${BLOCK}__dam-trigger`}>{inlineDamTrigger}</div>}
                </>
            )}
            {isRenderableContent(caption) && <figcaption className={`${BLOCK}__caption`}>{caption}</figcaption>}
        </figure>
    );
}
