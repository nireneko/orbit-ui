import type React from 'react';

export type OrbitSiteTheme =
    | 'CLEAN'
    | 'EDITORIAL'
    | 'CLINICAL'
    | 'BOLD'
    | 'clean'
    | 'editorial'
    | 'clinical'
    | 'bold';

export type OrbitSpacingScale = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type OrbitHorizontalAlignment = 'left' | 'center' | 'right';

export interface OrbitSectionStyle {
    spacing?: {
        paddingTop?: OrbitSpacingScale | string;
        paddingBottom?: OrbitSpacingScale | string;
    };
    background?: {
        color?: string;
    };
    alignment?: {
        horizontal?: OrbitHorizontalAlignment;
    };
    border?: {
        width?: string;
        color?: string;
        radius?: string;
    };
    maxWidth?: string;
    [key: string]: unknown;
}

export interface OrbitInlineDamTriggerOptions {
    propPath: string;
    currentAssetId?: string;
    allowedDamTypes?: string[];
    label?: string;
}

export interface OrbitComponentContextProps {
    editorMode?: boolean;
    showMediaPreview?: boolean;
    siteTheme?: OrbitSiteTheme;
    resolveAssetUrl?: (damAssetId: string) => string;
    resolveExternalReference?: (damAssetId: string) => string | undefined;
    onInlineSelectDamAsset?: (options: OrbitInlineDamTriggerOptions) => void;
    selectAssetLabel?: string;
    /** Display name of the current tenant, shown where the reference design prints it (e.g. the bold HeroBanner badge). */
    tenantLabel?: string;
    /**
     * Resolves an authored `href` (including `hub://` URIs) into a navigable link.
     * Mirrors the builder's `resolveLink(href, siteContext)`: external links come back with
     * `target="_blank"` and `rel="noopener noreferrer"`. When omitted, components emit `href` as is.
     */
    resolveLink?: (href: string) => { href: string; target?: string; rel?: string };
}

export type OrbitComponentRenderer<P = Record<string, unknown>> = React.ComponentType<
    P & OrbitComponentContextProps
>;
