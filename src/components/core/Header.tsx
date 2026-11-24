import React from 'react';
import { isRenderableContent } from '../../internal/content';
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

type LinkResolver = NonNullable<OrbitComponentContextProps['resolveLink']>;
type LinkAttributes = { href: string; target?: string; rel?: string };

const EDITOR_LINK_HREF = '#editor-nav';
const DEFAULT_HOME_HREF = '/';
const LOGO_PROP_PATH = 'logo.dam_asset_id';
const LOGO_DAM_TYPES = ['IMAGE', 'INFOGRAPHIC'];

/** Delivered links go through the host `resolveLink`; editor links never navigate away. */
function linkAttributes(
    href: string,
    editorMode: boolean,
    resolveLink: LinkResolver | undefined,
): LinkAttributes & { onClick?: (event: React.MouseEvent) => void } {
    if (editorMode) {
        return { href: EDITOR_LINK_HREF, onClick: (event) => event.preventDefault() };
    }

    const link = resolveLink ? resolveLink(href) : { href };

    return { href: link.href, target: link.target, rel: link.rel };
}

/** Adds the Header hook class to the shared CTA without changing its variant classes. */
function renderHeaderCta(cta: CtaProps | undefined, editorMode: boolean, resolveLink?: LinkResolver) {
    const element = renderCtaButton(cta, editorMode, { resolveLink });

    if (!React.isValidElement<{ className?: string }>(element)) {
        return null;
    }

    return React.cloneElement(element, { className: `${element.props.className ?? ''} orbit-header__cta` });
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
    resolveLink,
}: HeaderComponentProps): React.ReactElement {
    const navItems = Array.isArray(navigation) ? navigation : [];
    const logoAlt =
        typeof logo?.alt_text === 'string'
            ? logo.alt_text
            : typeof brand_text === 'string'
              ? brand_text
              : 'Logo';

    const homeContent = (
        <>
            {logo?.dam_asset_id && (
                <img
                    className="orbit-header__logo"
                    src={resolveDamAssetUrl(logo.dam_asset_id, resolveAssetUrl)}
                    alt={logoAlt}
                    width={160}
                    height={40}
                    loading="eager"
                    decoding="async"
                    onClick={
                        editorMode && typeof onInlineSelectDamAsset === 'function'
                            ? (event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onInlineSelectDamAsset({
                                      propPath: LOGO_PROP_PATH,
                                      currentAssetId: logo.dam_asset_id,
                                      allowedDamTypes: LOGO_DAM_TYPES,
                                      label: selectAssetLabel,
                                  });
                              }
                            : undefined
                    }
                />
            )}
            {renderInlineDamTrigger({
                editorMode,
                propPath: LOGO_PROP_PATH,
                currentAssetId: logo?.dam_asset_id,
                allowedDamTypes: LOGO_DAM_TYPES,
                label: selectAssetLabel,
                onInlineSelectDamAsset,
            })}
            {isRenderableContent(brand_text) && <span className="orbit-header__brand">{brand_text}</span>}
        </>
    );

    return (
        <header
            data-orbit-block="Header"
            data-orbit-sticky={sticky ? 'true' : 'false'}
            className={sticky ? 'orbit-header orbit-header--sticky' : 'orbit-header'}
        >
            <div className="orbit-header__inner">
                {editorMode ? (
                    // Not a link in the editor: it holds the DAM trigger button, and canvas clicks stay put.
                    <span className="orbit-header__home">{homeContent}</span>
                ) : (
                    <a
                        {...(logo?.href ? linkAttributes(logo.href, false, resolveLink) : { href: DEFAULT_HOME_HREF })}
                        className="orbit-header__home"
                    >
                        {homeContent}
                    </a>
                )}

                {navItems.length > 0 && (
                    <nav className="orbit-header__nav" aria-label="Primary navigation">
                        <ul className="orbit-header__nav-list">
                            {navItems.map((item, index) => {
                                const children = Array.isArray(item.children) ? item.children : [];

                                return (
                                    <li key={`nav-${index}`} className="orbit-header__nav-item">
                                        <a
                                            {...linkAttributes(item.href ?? '#', editorMode, resolveLink)}
                                            className="orbit-header__nav-link"
                                        >
                                            {item.label ?? 'Link'}
                                        </a>
                                        {children.length > 0 && (
                                            <ul className="orbit-header__submenu">
                                                {children.map((child, childIndex) => (
                                                    <li
                                                        key={`nav-${index}-${childIndex}`}
                                                        className="orbit-header__submenu-item"
                                                    >
                                                        <a
                                                            {...linkAttributes(child.href ?? '#', editorMode, resolveLink)}
                                                            className="orbit-header__submenu-link"
                                                        >
                                                            {child.label ?? 'Link'}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                )}

                {renderHeaderCta(cta, editorMode, resolveLink)}
            </div>
        </header>
    );
}
