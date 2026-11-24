import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { renderCtaButton } from '../../internal/cta';

export interface LinkComponentProps extends OrbitComponentContextProps {
    label?: React.ReactNode;
    href?: string;
    variant?: 'primary_button' | 'secondary_button' | 'link' | string;
    open_in_new_tab?: boolean;
    icon?: string;
    alignment?: 'left' | 'center' | 'right' | string;
}

const ALIGNMENTS = ['left', 'center', 'right'] as const;
const DEFAULT_ALIGNMENT = 'left';
const LINK_VARIANT = 'link';
const ARROW = '→';

function alignmentClassName(alignment: string): string {
    const value = (ALIGNMENTS as readonly string[]).includes(alignment) ? alignment : DEFAULT_ALIGNMENT;

    return `orbit-link--align-${value}`;
}

function renderTrailing(variant: string, icon: string | undefined): React.ReactNode {
    if (icon && icon.trim() !== '') {
        return (
            <span className="orbit-link__icon" aria-hidden="true">
                {icon}
            </span>
        );
    }

    if (variant === LINK_VARIANT) {
        return (
            <span className="orbit-link__arrow" aria-hidden="true">
                {ARROW}
            </span>
        );
    }

    return null;
}

/**
 * Single link or button.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/content/Link.astro.
 */
export function Link({
    label = 'Learn more',
    href = '#',
    variant = LINK_VARIANT,
    open_in_new_tab = false,
    icon,
    alignment = DEFAULT_ALIGNMENT,
    editorMode = false,
    resolveLink,
}: LinkComponentProps): React.ReactElement {
    const cta = renderCtaButton({ label, href, variant }, editorMode, {
        resolveLink,
        openInNewTab: open_in_new_tab,
        trailing: renderTrailing(variant, icon),
    });

    return (
        <div data-orbit-block="Link" className={`orbit-link ${alignmentClassName(alignment)}`}>
            {React.isValidElement<{ className?: string }>(cta) &&
                React.cloneElement(cta, { className: `${cta.props.className ?? ''} orbit-link__anchor` })}
        </div>
    );
}
