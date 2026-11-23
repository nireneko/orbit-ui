import React from 'react';
import type {
    OrbitComponentContextProps,
    OrbitInlineDamTriggerOptions,
} from '../../types';

export interface CtaProps {
    label?: React.ReactNode;
    href?: string;
    variant?: 'primary_button' | 'secondary_button' | 'link' | string;
}

export function isRenderableContent(value: React.ReactNode): boolean {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim() !== '';
    }

    return true;
}

export function resolveDamAssetUrl(
    damAssetId: string | undefined,
    resolveAssetUrl?: (damId: string) => string,
): string {
    const id = typeof damAssetId === 'string' && damAssetId.trim() !== ''
        ? damAssetId.trim()
        : 'dam_placeholder';

    if (typeof resolveAssetUrl === 'function') {
        return resolveAssetUrl(id);
    }

    return `/api/v1/dam/assets/${encodeURIComponent(id)}/stream`;
}

export function renderCtaButton(
    cta: CtaProps | undefined,
    editorMode = false,
): React.ReactElement | null {
    if (!cta || !isRenderableContent(cta.label)) {
        return null;
    }

    const className =
        cta.variant === 'secondary_button'
            ? 'orbit-btn-secondary'
            : cta.variant === 'link'
              ? 'underline font-medium'
              : 'orbit-btn-primary';

    if (editorMode) {
        return <span className={className}>{cta.label}</span>;
    }

    return (
        <a href={cta.href ?? '#'} className={className}>
            {cta.label}
        </a>
    );
}

export function renderInlineDamTrigger(params: {
    editorMode?: boolean;
    propPath: string;
    currentAssetId?: string;
    allowedDamTypes?: string[];
    label?: string;
    onInlineSelectDamAsset?: (options: OrbitInlineDamTriggerOptions) => void;
}): React.ReactElement | null {
    if (!params.editorMode || typeof params.onInlineSelectDamAsset !== 'function') {
        return null;
    }

    const buttonLabel = params.label ?? 'Select DAM asset';

    return (
        <span
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
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                lineHeight: 1.2,
                color: '#111827',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
                cursor: 'pointer',
                zIndex: 10,
            }}
        >
            <span aria-hidden="true">🖼</span>
            <span>{buttonLabel}</span>
        </span>
    );
}

export interface HeaderComponentProps extends OrbitComponentContextProps {
    brand_text?: React.ReactNode;
    logo?: {
        dam_asset_id?: string;
        alt_text?: string;
        href?: string;
    };
    navigation?: Array<{
        label?: React.ReactNode;
        href?: string;
        children?: Array<{ label?: React.ReactNode; href?: string }>;
    }>;
    cta?: CtaProps;
    sticky?: boolean;
}

export function Header({
    brand_text = 'Orbit Hub',
    logo,
    navigation = [],
    cta,
    sticky = false,
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: HeaderComponentProps): React.ReactElement {
    const navItems = Array.isArray(navigation) ? navigation : [];
    const logoAlt =
        typeof logo?.alt_text === 'string'
            ? logo.alt_text
            : typeof brand_text === 'string'
              ? brand_text
              : 'Logo';

    return (
        <header
            data-orbit-block="Header"
            data-orbit-sticky={sticky ? 'true' : 'false'}
            className="orbit-card"
            style={{ padding: '1rem 1.5rem' }}
        >
            <div
                className="orbit-container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {logo?.dam_asset_id && (
                        <img
                            src={resolveDamAssetUrl(logo.dam_asset_id, resolveAssetUrl)}
                            alt={logoAlt}
                            style={{ height: '2rem', width: 'auto' }}
                            onClick={
                                editorMode && typeof onInlineSelectDamAsset === 'function'
                                    ? (event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          onInlineSelectDamAsset({
                                              propPath: 'logo.dam_asset_id',
                                              currentAssetId: logo.dam_asset_id,
                                              allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                                              label: selectAssetLabel,
                                          });
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {renderInlineDamTrigger({
                        editorMode,
                        propPath: 'logo.dam_asset_id',
                        currentAssetId: logo?.dam_asset_id,
                        allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
                        label: selectAssetLabel,
                        onInlineSelectDamAsset,
                    })}
                    <span className="orbit-heading" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                        {brand_text}
                    </span>
                </div>

                <nav aria-label="Primary navigation">
                    <ul
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                        }}
                    >
                        {navItems.map((item, idx) => (
                            <li key={`nav-${idx}`}>
                                <a
                                    href={editorMode ? '#editor-nav' : (item.href ?? '#')}
                                    onClick={editorMode ? (e) => e.preventDefault() : undefined}
                                >
                                    {item.label ?? 'Link'}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {renderCtaButton(cta, editorMode)}
            </div>
        </header>
    );
}
