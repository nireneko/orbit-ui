import React from 'react';
import type { OrbitSiteTheme } from '../types';

export interface ThemeShellProps {
    theme?: OrbitSiteTheme | string;
    preset?: string;
    /**
     * Tenant design tokens as CSS declarations (`'--orbit-color-accent: #0a6e84; …'`),
     * the `css_variables` string Symfony delivers. Each custom property is written
     * inline on the shell root; declarations whose name is not a custom property
     * are dropped.
     */
    cssVariables?: string;
    className?: string;
    children?: React.ReactNode;
}

function normalizeThemeKey(rawTheme?: string): 'clean' | 'editorial' | 'clinical' | 'bold' {
    const lower = (rawTheme ?? 'clean').toLowerCase();
    if (lower === 'editorial' || lower === 'clinical' || lower === 'bold') {
        return lower;
    }

    return 'clean';
}

const CUSTOM_PROPERTY_NAME = /^--[A-Za-z0-9_-]+$/;

/** Parses a declaration list into custom properties only, never raw style text. */
function parseCustomProperties(cssVariables?: string): Record<string, string> {
    const properties: Record<string, string> = {};

    for (const declaration of (cssVariables ?? '').split(';')) {
        const colon = declaration.indexOf(':');
        if (colon === -1) {
            continue;
        }
        const name = declaration.slice(0, colon).trim();
        const value = declaration.slice(colon + 1).trim();
        if (CUSTOM_PROPERTY_NAME.test(name) && value !== '') {
            properties[name] = value;
        }
    }

    return properties;
}

export function ThemeShell({
    theme = 'CLEAN',
    preset,
    cssVariables,
    className,
    children,
}: ThemeShellProps): React.ReactElement {
    const normalizedTheme = normalizeThemeKey(theme);
    const normalizedPreset =
        typeof preset === 'string' && preset.trim() !== ''
            ? preset.trim().toLowerCase()
            : undefined;

    const shellClasses = [
        'orbit-theme-shell',
        `orbit-theme-shell--${normalizedTheme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const customProperties = parseCustomProperties(cssVariables);
    const inlineStyle =
        Object.keys(customProperties).length > 0
            ? (customProperties as React.CSSProperties)
            : undefined;

    return (
        <div
            data-orbit-theme={normalizedTheme}
            data-orbit-preset={normalizedPreset}
            className={shellClasses}
            style={inlineStyle}
        >
            <div className="orbit-theme-shell__content">{children}</div>
        </div>
    );
}
