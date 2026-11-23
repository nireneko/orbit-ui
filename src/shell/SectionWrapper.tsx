import React from 'react';
import type { OrbitSectionStyle, OrbitSpacingScale } from '../types';

export interface SectionWrapperProps {
    sectionId?: string;
    componentName?: string;
    style?: OrbitSectionStyle;
    className?: string;
    children?: React.ReactNode;
}

const SPACING_MAP: Record<OrbitSpacingScale, string> = {
    none: '0rem',
    sm: '1.5rem',
    md: '3rem',
    lg: '4.5rem',
    xl: '6rem',
};

function resolveSpacingValue(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    if (value in SPACING_MAP) {
        return SPACING_MAP[value as OrbitSpacingScale];
    }

    return value;
}

export function SectionWrapper({
    sectionId,
    componentName,
    style,
    className,
    children,
}: SectionWrapperProps): React.ReactElement {
    const inlineStyle: React.CSSProperties = {};

    if (style?.background?.color) {
        inlineStyle.backgroundColor = style.background.color;
    }

    const horizontalAlign =
        style?.alignment?.horizontal === 'left' ||
        style?.alignment?.horizontal === 'center' ||
        style?.alignment?.horizontal === 'right'
            ? style.alignment.horizontal
            : undefined;

    if (horizontalAlign) {
        inlineStyle.textAlign = horizontalAlign;
    }

    const paddingTop = resolveSpacingValue(style?.spacing?.paddingTop);
    if (paddingTop !== undefined) {
        inlineStyle.paddingTop = paddingTop;
    }

    const paddingBottom = resolveSpacingValue(style?.spacing?.paddingBottom);
    if (paddingBottom !== undefined) {
        inlineStyle.paddingBottom = paddingBottom;
    }

    if (typeof style?.maxWidth === 'string' && style.maxWidth.trim() !== '') {
        inlineStyle.maxWidth = style.maxWidth.trim();
        inlineStyle.marginLeft = 'auto';
        inlineStyle.marginRight = 'auto';
    }

    const borderWidth = style?.border?.width?.trim();
    const borderColor = style?.border?.color?.trim();
    const borderRadius = style?.border?.radius?.trim();

    if (borderWidth || borderColor) {
        inlineStyle.borderWidth = borderWidth || '1px';
        inlineStyle.borderStyle = 'solid';
        inlineStyle.borderColor = borderColor || 'var(--orbit-color-border)';
    }

    if (borderRadius) {
        inlineStyle.borderRadius = borderRadius;
        inlineStyle.overflow = 'hidden';
    }

    const wrapperClasses = ['orbit-section', className].filter(Boolean).join(' ');

    return (
        <section
            data-orbit-section-id={sectionId}
            data-orbit-component={componentName}
            data-orbit-align={horizontalAlign}
            className={wrapperClasses}
            style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
        >
            {children}
        </section>
    );
}
