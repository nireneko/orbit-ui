import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { renderCtaButton } from './Header';

export interface LinkComponentProps extends OrbitComponentContextProps {
    label?: React.ReactNode;
    href?: string;
    variant?: 'primary_button' | 'secondary_button' | 'link' | string;
    open_in_new_tab?: boolean;
    icon?: string;
    alignment?: 'left' | 'center' | 'right' | string;
}

export function Link({
    label = 'Learn more',
    href = '#',
    variant = 'link',
    alignment = 'left',
    editorMode = false,
}: LinkComponentProps): React.ReactElement {
    const textAlign =
        alignment === 'center' || alignment === 'right' ? alignment : 'left';

    return (
        <div
            data-orbit-block="Link"
            className="orbit-container"
            style={{ textAlign }}
        >
            {renderCtaButton({ label, href, variant }, editorMode)}
        </div>
    );
}
