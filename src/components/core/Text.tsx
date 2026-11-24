import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';

export interface TextComponentProps extends OrbitComponentContextProps {
    heading?: React.ReactNode;
    body?: React.ReactNode;
    alignment?: 'left' | 'center' | 'right' | string;
    tone?: 'default' | 'muted' | 'accent' | string;
}

export function Text({
    heading,
    body = '',
    alignment = 'left',
    tone = 'default',
}: TextComponentProps): React.ReactElement {
    const textAlign =
        alignment === 'center' || alignment === 'right' ? alignment : 'left';

    return (
        <div
            data-orbit-block="Text"
            data-orbit-tone={tone}
            className="orbit-container"
            style={{ textAlign }}
        >
            {isRenderableContent(heading) && (
                <h2
                    className="orbit-heading"
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                    }}
                >
                    {heading}
                </h2>
            )}
            <div style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{body}</div>
        </div>
    );
}
