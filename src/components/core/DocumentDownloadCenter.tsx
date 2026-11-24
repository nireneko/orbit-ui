import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
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

export function DocumentDownloadCenter({
    category = 'Documents',
    documents = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: DocumentDownloadCenterComponentProps): React.ReactElement {
    const items = Array.isArray(documents) ? documents : [];

    return (
        <div data-orbit-block="DocumentDownloadCenter" className="orbit-container">
            <div className="orbit-card" style={{ padding: '1.75rem' }}>
                <h2
                    className="orbit-heading"
                    style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '1rem' }}
                >
                    {category}
                </h2>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((doc, idx) => {
                        const href = editorMode
                            ? '#editor-download'
                            : (doc.download_url ??
                              resolveDamAssetUrl(doc.dam_asset_id, resolveAssetUrl));

                        return (
                            <li
                                key={`${doc.dam_asset_id ?? 'doc'}-${idx}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 0',
                                    borderTop:
                                        idx > 0
                                            ? 'var(--orbit-border-width) solid var(--orbit-color-border)'
                                            : undefined,
                                }}
                            >
                                <div>
                                    <strong style={{ display: 'block' }}>
                                        {doc.title ?? 'Document'}
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                                        {doc.format ?? 'PDF'} · {doc.file_size ?? ''}
                                        {doc.veeva_approval_code
                                            ? <> · MLR: {doc.veeva_approval_code}</>
                                            : ''}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {renderInlineDamTrigger({
                                        editorMode,
                                        propPath: `documents[${idx}].dam_asset_id`,
                                        currentAssetId: doc.dam_asset_id,
                                        allowedDamTypes: [
                                            'DOCUMENT_PDF',
                                            'DOCUMENT_WORD',
                                            'ARCHIVE_ZIP',
                                        ],
                                        label: selectAssetLabel,
                                        onInlineSelectDamAsset,
                                    })}
                                    <a
                                        href={href}
                                        onClick={editorMode ? (e) => e.preventDefault() : undefined}
                                        className="orbit-btn-secondary"
                                    >
                                        {doc.format ?? 'Download'}
                                    </a>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
