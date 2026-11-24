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

const BLOCK = 'orbit-restricted-video-player';
const RESTRICTION_PREFIX = 'HCP Restricted · ';
const DURATION_UNIT = ' min';
const DEFAULT_GATE_MESSAGE = 'HCP authentication required.';
const DEFAULT_GATE_CTA_LABEL = 'Sign in';

/**
 * HCP-restricted video card. It never embeds the video: unauthorized visitors see the
 * `fallback_unauthorized` gate, and the host decides whether to play it.
 */
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
            className={BLOCK}
        >
            <div className={`${BLOCK}__inner`}>
                <div className={`${BLOCK}__card`}>
                    <div className={`${BLOCK}__meta`}>
                        <span className={`${BLOCK}__restriction`}>
                            {RESTRICTION_PREFIX}
                            {provider} ({vimeo_video_id})
                        </span>
                        <span className={`${BLOCK}__duration`}>
                            {duration_minutes}
                            {DURATION_UNIT}
                        </span>
                    </div>

                    <h3 className={`${BLOCK}__title`}>{title}</h3>

                    {isRenderableContent(disclaimer_text) && (
                        <p className={`${BLOCK}__disclaimer`}>{disclaimer_text}</p>
                    )}

                    {fallback_unauthorized && (
                        <div className={`${BLOCK}__gate`}>
                            <span className={`${BLOCK}__gate-message`}>
                                {fallback_unauthorized.message ?? DEFAULT_GATE_MESSAGE}
                            </span>
                            <span className={`${BLOCK}__gate-cta`}>
                                {fallback_unauthorized.login_cta_label ?? DEFAULT_GATE_CTA_LABEL}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
