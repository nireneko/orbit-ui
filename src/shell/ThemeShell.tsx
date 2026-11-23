import React from 'react';
import type { OrbitSiteTheme } from '../types';

export interface ThemeShellProps {
    theme?: OrbitSiteTheme | string;
    preset?: string;
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

export function ThemeShell({
    theme = 'CLEAN',
    preset,
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

    return (
        <div
            data-orbit-theme={normalizedTheme}
            data-orbit-preset={normalizedPreset}
            className={shellClasses}
        >
            {children}
        </div>
    );
}
