import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import {
    isRenderableContent,
    renderInlineDamTrigger,
    resolveDamAssetUrl,
} from '../core/Header';

export interface ClinicalStudyItem {
    dam_asset_id?: string;
    badge?: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    link_uri?: string;
}

export interface ClinicalStudyCardGridComponentProps extends OrbitComponentContextProps {
    columns?: number;
    items?: ClinicalStudyItem[];
}

export function ClinicalStudyCardGrid({
    columns = 3,
    items = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: ClinicalStudyCardGridComponentProps): React.ReactElement {
    const cards = Array.isArray(items) ? items : [];
    const safeColumns = columns === 2 || columns === 4 ? columns : 3;

    return (
        <div
            data-orbit-block="ClinicalStudyCardGrid"
            data-orbit-columns={String(safeColumns)}
            className="orbit-container"
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
                    gap: '1.5rem',
                }}
            >
                {cards.map((item, idx) => (
                    <article
                        key={`${item.dam_asset_id ?? 'study'}-${idx}`}
                        className="orbit-card"
                        style={{ padding: '1.5rem' }}
                    >
                        {item.badge && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {item.badge}
                            </span>
                        )}
                        <h3
                            className="orbit-heading"
                            style={{
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                            }}
                        >
                            {item.title ?? 'Clinical Study'}
                        </h3>
                        {isRenderableContent(item.description) && (
                            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                                {item.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <a
                                href={
                                    editorMode
                                        ? '#editor-study'
                                        : (item.link_uri ??
                                          resolveDamAssetUrl(item.dam_asset_id, resolveAssetUrl))
                                }
                                onClick={editorMode ? (e) => e.preventDefault() : undefined}
                                className="orbit-btn-secondary"
                            >
                                View study
                            </a>
                            {renderInlineDamTrigger({
                                editorMode,
                                propPath: `items[${idx}].dam_asset_id`,
                                currentAssetId: item.dam_asset_id,
                                allowedDamTypes: [
                                    'DOCUMENT_PDF',
                                    'DOCUMENT_WORD',
                                    'ARCHIVE_ZIP',
                                ],
                                label: selectAssetLabel,
                                onInlineSelectDamAsset,
                            })}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
