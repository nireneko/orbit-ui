import React from 'react';
import { isRenderableContent } from './content';

export interface CtaProps {
    label?: React.ReactNode;
    href?: string;
    variant?: 'primary_button' | 'secondary_button' | 'link' | string;
}

/**
 * Same signature as the `resolveLink` context prop that TASK-15.20 adds to
 * `OrbitComponentContextProps`; replace with that type once both branches are merged.
 */
export type OrbitLinkResolver = (href: string) => { href: string; target?: string; rel?: string };

export interface CtaRenderOptions {
    /** Resolves `hub://` and external links; without it the `href` is emitted as is. */
    resolveLink?: OrbitLinkResolver;
    /** Opens the link in a new tab when `resolveLink` does not decide the target. */
    openInNewTab?: boolean;
    /** Optional content rendered after the label, such as an icon or an arrow. */
    trailing?: React.ReactNode;
}

const NEW_TAB_TARGET = '_blank';
const NEW_TAB_REL = 'noopener noreferrer';

function ctaClassName(variant: CtaProps['variant']): string {
    if (variant === 'secondary_button') {
        return 'orbit-cta orbit-cta--secondary';
    }

    if (variant === 'link') {
        return 'orbit-cta orbit-cta--link';
    }

    return 'orbit-cta orbit-cta--primary';
}

/**
 * Renders a call to action with the shared `.orbit-cta` classes. In `editorMode` it is
 * not a navigable link, so clicks on the canvas never leave the editor.
 */
export function renderCtaButton(
    cta: CtaProps | undefined,
    editorMode = false,
    options: CtaRenderOptions = {},
): React.ReactElement | null {
    if (!cta || !isRenderableContent(cta.label)) {
        return null;
    }

    const className = ctaClassName(cta.variant);

    if (editorMode) {
        return (
            <span className={className}>
                {cta.label}
                {options.trailing}
            </span>
        );
    }

    const rawHref = cta.href ?? '#';
    const link = options.resolveLink ? options.resolveLink(rawHref) : { href: rawHref };
    const target = link.target ?? (options.openInNewTab ? NEW_TAB_TARGET : undefined);
    const rel = link.rel ?? (target === NEW_TAB_TARGET ? NEW_TAB_REL : undefined);

    return (
        <a href={link.href} target={target} rel={rel} className={className}>
            {cta.label}
            {options.trailing}
        </a>
    );
}
