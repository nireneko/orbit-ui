import type React from 'react';

/** `true` when the value renders visible content (non-blank strings, numbers, elements). */
export function isRenderableContent(value: React.ReactNode): boolean {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim() !== '';
    }

    return true;
}
