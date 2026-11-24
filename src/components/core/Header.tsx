import React from 'react';
import { type CtaProps, renderCtaButton } from '../../internal/cta';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';
import type { OrbitComponentContextProps } from '../../types';

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
