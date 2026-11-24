import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';

export interface TextComponentProps extends OrbitComponentContextProps {
    heading?: React.ReactNode;
    body?: React.ReactNode;
    alignment?: 'left' | 'center' | 'right' | string;
    tone?: 'default' | 'muted' | 'accent' | string;
}

const ALIGNMENTS = ['left', 'center', 'right'] as const;
const TONES = ['default', 'muted', 'accent'] as const;

function pickVariant<Variant extends string>(
    value: string,
    variants: readonly [Variant, ...Variant[]],
): Variant {
    return (variants as readonly string[]).includes(value) ? (value as Variant) : variants[0];
}

/**
 * Text block. Ported from orbit-hub-builder@86abe78:src/components/catalog/content/Text.astro.
 * The heading is always an `<h2>`: the Symfony schema has no heading level.
 */
export function Text({
    heading,
    body = '',
    alignment = 'left',
    tone = 'default',
}: TextComponentProps): React.ReactElement {
    const alignmentVariant = pickVariant(alignment, ALIGNMENTS);
    const toneVariant = pickVariant(tone, TONES);

    return (
        <div
            className={`orbit-text orbit-text--align-${alignmentVariant} orbit-text--tone-${toneVariant}`}
            data-orbit-block="Text"
            data-orbit-tone={tone}
        >
            <div className="orbit-text__inner">
                {isRenderableContent(heading) && <h2 className="orbit-text__heading">{heading}</h2>}
                {isRenderableContent(body) && <p className="orbit-text__body">{body}</p>}
            </div>
        </div>
    );
}
