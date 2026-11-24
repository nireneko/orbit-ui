import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

export interface DocumentDownloadItem {
    dam_asset_id?: string;
    title?: React.ReactNode;
    file_size?: React.ReactNode;
    format?: string;
    veeva_approval_code?: React.ReactNode;
    download_url?: string;
}

export interface DocumentDownloadCenterComponentProps extends OrbitComponentContextProps {
    category?: React.ReactNode;
    documents?: DocumentDownloadItem[];
}

type LinkAttributes = { href: string; target?: string; rel?: string };

const BLOCK = 'orbit-document-download-center';
const EDITOR_LINK_HREF = '#editor-download';
const DOCUMENT_DAM_TYPES = ['DOCUMENT_PDF', 'DOCUMENT_WORD', 'ARCHIVE_ZIP'];
const DEFAULT_FORMAT = 'PDF';
const DEFAULT_TITLE = 'Document';
const DOWNLOAD_LABEL = 'Download';
const APPROVAL_CODE_PREFIX = 'MLR: ';

function hasDownloadUrl(downloadUrl: string | undefined): downloadUrl is string {
    return typeof downloadUrl === 'string' && downloadUrl.trim() !== '';
}

/**
 * The document link: `download_url` through the host `resolveLink`, otherwise the DAM asset URL.
 * Editor links never navigate away from the canvas.
 */
function documentLink(
    doc: DocumentDownloadItem,
    editorMode: boolean,
    resolveAssetUrl: OrbitComponentContextProps['resolveAssetUrl'],
    resolveLink: OrbitComponentContextProps['resolveLink'],
): LinkAttributes {
    if (editorMode) {
        return { href: EDITOR_LINK_HREF };
    }

    if (hasDownloadUrl(doc.download_url)) {
        const link = resolveLink ? resolveLink(doc.download_url) : { href: doc.download_url };

        return { href: link.href, target: link.target, rel: link.rel };
    }

    return { href: resolveDamAssetUrl(doc.dam_asset_id, resolveAssetUrl) };
}

/**
 * List of downloadable documents with their format, size and approval code.
 * Ported from orbit-hub-builder@86abe78:src/components/catalog/media/DocumentDownloadCenter.astro.
 */
export function DocumentDownloadCenter({
    category = 'Documents',
    documents = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
    resolveLink,
}: DocumentDownloadCenterComponentProps): React.ReactElement {
    const items = Array.isArray(documents) ? documents : [];
    const preventNavigation = editorMode ? (event: React.MouseEvent) => event.preventDefault() : undefined;

    return (
        <div data-orbit-block="DocumentDownloadCenter" className={BLOCK}>
            <div className={`${BLOCK}__inner`}>
                {isRenderableContent(category) && <h2 className={`${BLOCK}__heading`}>{category}</h2>}
                <ul className={`${BLOCK}__list`}>
                    {items.map((doc, idx) => {
                        const link = documentLink(doc, editorMode, resolveAssetUrl, resolveLink);

                        return (
                            <li key={`${doc.dam_asset_id ?? 'doc'}-${idx}`} className={`${BLOCK}__item`}>
                                <div>
                                    <a {...link} className={`${BLOCK}__link`} download onClick={preventNavigation}>
                                        {doc.title ?? DEFAULT_TITLE}
                                    </a>
                                    <p className={`${BLOCK}__details`}>
                                        <span className={`${BLOCK}__meta`}>
                                            [{doc.format ?? DEFAULT_FORMAT}, {doc.file_size ?? ''}]
                                        </span>
                                        {isRenderableContent(doc.veeva_approval_code) && (
                                            <span className={`${BLOCK}__code`}>
                                                {' · '}
                                                {APPROVAL_CODE_PREFIX}
                                                {doc.veeva_approval_code}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {renderInlineDamTrigger({
                                    editorMode,
                                    propPath: `documents[${idx}].dam_asset_id`,
                                    currentAssetId: doc.dam_asset_id,
                                    allowedDamTypes: DOCUMENT_DAM_TYPES,
                                    label: selectAssetLabel,
                                    onInlineSelectDamAsset,
                                })}
                                <a {...link} className={`${BLOCK}__action`} download onClick={preventNavigation}>
                                    {DOWNLOAD_LABEL}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
