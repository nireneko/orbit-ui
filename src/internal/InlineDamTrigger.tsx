import React from 'react';
import type { OrbitInlineDamTriggerOptions } from '../types';

const DEFAULT_TRIGGER_LABEL = 'Select DAM asset';

export interface InlineDamTriggerParams {
    editorMode?: boolean;
    propPath: string;
    currentAssetId?: string;
    allowedDamTypes?: string[];
    label?: string;
    onInlineSelectDamAsset?: (options: OrbitInlineDamTriggerOptions) => void;
}

/**
 * Renders the canvas control that opens the DAM picker for `propPath`.
 *
 * It is a native `<button type="button">` so it takes focus and activates with Enter and
 * Space. The `data-*` attributes and the callback payload are read by the OrbitHub editor
 * and must not change. Nothing is rendered outside `editorMode`.
 */
export function renderInlineDamTrigger(params: InlineDamTriggerParams): React.ReactElement | null {
    if (!params.editorMode || typeof params.onInlineSelectDamAsset !== 'function') {
        return null;
    }

    const buttonLabel = params.label ?? DEFAULT_TRIGGER_LABEL;

    return (
        <button
            type="button"
            className="orbit-inline-dam-trigger"
            data-puck-overlay-portal="true"
            data-orbit-inline-dam-trigger="true"
            data-orbit-inline-dam-prop={params.propPath}
            data-orbit-inline-dam-current={params.currentAssetId ?? ''}
            onMouseOver={(event) => {
                event.stopPropagation();
            }}
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                params.onInlineSelectDamAsset?.({
                    propPath: params.propPath,
                    currentAssetId: params.currentAssetId,
                    allowedDamTypes: params.allowedDamTypes,
                    label: buttonLabel,
                });
            }}
        >
            <span aria-hidden="true">🖼</span>
            <span>{buttonLabel}</span>
        </button>
    );
}
