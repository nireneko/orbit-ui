import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';

export interface RestrictedVideoPlayerComponentProps extends OrbitComponentContextProps {
    provider?: string;
    vimeo_video_id?: React.ReactNode;
    title?: React.ReactNode;
    duration_minutes?: number;
    disclaimer_text?: React.ReactNode;
    fallback_unauthorized?: {
        message?: React.ReactNode;
        login_cta_label?: React.ReactNode;
    };
}

export function RestrictedVideoPlayer({
    provider = 'vimeo_enterprise',
    vimeo_video_id = '123456789',
    title = 'Restricted medical training',
    duration_minutes = 10,
    disclaimer_text,
    fallback_unauthorized,
    editorMode = false,
}: RestrictedVideoPlayerComponentProps): React.ReactElement {
    return (
        <div
            data-orbit-block="RestrictedVideoPlayer"
            data-orbit-editor-mode={editorMode ? 'true' : 'false'}
            className="orbit-container"
        >
            <div className="orbit-card" style={{ padding: '2rem' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        HCP Restricted · {provider} ({vimeo_video_id})
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                        {duration_minutes} min
                    </span>
                </div>

                <h3
                    className="orbit-heading"
                    style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}
                >
                    {title}
                </h3>

                {isRenderableContent(disclaimer_text) && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                        {disclaimer_text}
                    </p>
                )}

                {fallback_unauthorized && (
                    <div
                        style={{
                            padding: '1rem',
                            border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                            borderRadius: 'var(--orbit-radius-base)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                        }}
                    >
                        <span style={{ fontSize: '0.875rem' }}>
                            {fallback_unauthorized.message ?? 'HCP authentication required.'}
                        </span>
                        <span className="orbit-btn-primary">
                            {fallback_unauthorized.login_cta_label ?? 'Sign in'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
