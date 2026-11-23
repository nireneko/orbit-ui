import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent, renderInlineDamTrigger } from './Header';

export interface YoutubeComponentProps extends OrbitComponentContextProps {
    dam_asset_id?: string;
    video_id?: string;
    title?: React.ReactNode;
    caption?: React.ReactNode;
    aspect_ratio?: string;
    start_seconds?: number;
    privacy_mode?: boolean;
    allow_fullscreen?: boolean;
}

export function Youtube({
    dam_asset_id,
    video_id = 'dQw4w9WgXcQ',
    title = 'YouTube video',
    caption,
    aspect_ratio = '16:9',
    start_seconds = 0,
    privacy_mode = true,
    allow_fullscreen = true,
    editorMode = false,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: YoutubeComponentProps): React.ReactElement {
    const domain = privacy_mode
        ? 'https://www.youtube-nocookie.com'
        : 'https://www.youtube.com';
    const safeVideoId = typeof video_id === 'string' ? video_id : 'dQw4w9WgXcQ';
    const embedUrl = `${domain}/embed/${encodeURIComponent(safeVideoId)}?start=${start_seconds}`;
    const iframeTitle = typeof title === 'string' ? title : 'YouTube video';

    return (
        <figure
            data-orbit-block="Youtube"
            data-orbit-aspect-ratio={aspect_ratio}
            className="orbit-container"
            style={{ marginTop: 0, marginBottom: 0 }}
        >
            {editorMode ? (
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
                        YouTube ({dam_asset_id ?? safeVideoId}) · {aspect_ratio}
                    </span>
                    {renderInlineDamTrigger({
                        editorMode,
                        propPath: 'dam_asset_id',
                        currentAssetId: dam_asset_id,
                        allowedDamTypes: ['VIDEO_YOUTUBE'],
                        label: selectAssetLabel,
                        onInlineSelectDamAsset,
                    })}
                </div>
            ) : (
                <iframe
                    src={embedUrl}
                    title={iframeTitle}
                    allowFullScreen={allow_fullscreen}
                    style={{
                        width: '100%',
                        aspectRatio: aspect_ratio.replace(':', ' / '),
                        border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                        borderRadius: 'var(--orbit-radius-lg)',
                    }}
                />
            )}
            {isRenderableContent(caption) && (
                <figcaption style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.75 }}>
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
