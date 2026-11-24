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

export function Youtube({
    dam_asset_id,
    title = 'YouTube video',
    caption,
    aspect_ratio = '16:9',
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
    const iframeTitle = typeof title === 'string' ? title : 'YouTube video';
    const inlineDamTrigger = renderInlineDamTrigger({
        editorMode,
        propPath: 'dam_asset_id',
        currentAssetId: dam_asset_id,
        allowedDamTypes: ['VIDEO_YOUTUBE'],
        label: selectAssetLabel,
        onInlineSelectDamAsset,
    });
    const showPlaceholder = editorMode && (!showMediaPreview || !embedUrl);

    return (
        <figure
            data-orbit-block="Youtube"
            data-orbit-aspect-ratio={aspect_ratio}
            className="orbit-container"
            style={{ marginTop: 0, marginBottom: 0 }}
        >
            {showPlaceholder ? (
                <div
                    className="orbit-card"
                    style={{
                        padding: '2.5rem',
                        textAlign: 'center',
                    }}
                >
                    <strong className="orbit-heading" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        {title}
                    </strong>
                    <span style={{ fontSize: '0.875rem', opacity: 0.75, display: 'block', marginBottom: '0.75rem' }}>
                        YouTube ({normalizedAssetId || '—'}) · {aspect_ratio}
                    </span>
                    {inlineDamTrigger}
                </div>
            ) : (
                <div>
                    <iframe
                        src={embedUrl}
                        title={iframeTitle}
                        allowFullScreen={allow_fullscreen}
                        style={{
                            width: '100%',
                            aspectRatio: aspect_ratio.replace(':', ' / '),
                            border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                            borderRadius: 'var(--orbit-radius-lg)',
                            pointerEvents: editorMode ? 'none' : undefined,
                        }}
                    />
                    {editorMode && inlineDamTrigger && (
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                            {inlineDamTrigger}
                        </div>
                    )}
                </div>
            )}
            {isRenderableContent(caption) && (
                <figcaption style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.75 }}>
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
