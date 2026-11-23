import React from 'react';
import type { OrbitComponentContextProps } from '../types';

export interface FallbackComponentProps extends OrbitComponentContextProps {
    componentName?: string;
    [key: string]: unknown;
}

export function FallbackComponent({
    componentName = 'UnknownComponent',
}: FallbackComponentProps): React.ReactElement {
    return (
        <div
            data-orbit-block="FallbackComponent"
            data-orbit-missing-component={componentName}
            className="orbit-container"
        >
            <div
                className="orbit-card"
                style={{
                    padding: '1.5rem',
                    borderStyle: 'dashed',
                }}
            >
                <strong className="orbit-heading" style={{ display: 'block' }}>
                    Unsupported or deprecated component: {componentName}
                </strong>
            </div>
        </div>
    );
}
