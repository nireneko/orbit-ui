import React from 'react';
import type { OrbitComponentContextProps } from '../../types';
import { isRenderableContent } from '../../internal/content';
import { resolveDamAssetUrl } from '../../internal/dam';
import { renderInlineDamTrigger } from '../../internal/InlineDamTrigger';

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

const BLOCK = 'orbit-clinical-study-card-grid';
const EDITOR_LINK_HREF = '#editor-study';
const STUDY_DAM_TYPES = ['DOCUMENT_PDF', 'DOCUMENT_WORD', 'ARCHIVE_ZIP'];
const DEFAULT_COLUMNS = 3;
const DEFAULT_TITLE = 'Clinical Study';
const VIEW_STUDY_LABEL = 'View study';

/** The schema enum is 2, 3 or 4; anything else renders the default. */
function safeColumns(columns: number | undefined): number {
    return columns === 2 || columns === 4 ? columns : DEFAULT_COLUMNS;
}

/**
 * Grid of clinical study cards. One column on small screens, two from `48rem` and
 * the `columns` value from `64rem` (the modifier class drives the stylesheet).
 */
export function ClinicalStudyCardGrid({
    columns = DEFAULT_COLUMNS,
    items = [],
    editorMode = false,
    resolveAssetUrl,
    onInlineSelectDamAsset,
    selectAssetLabel,
}: ClinicalStudyCardGridComponentProps): React.ReactElement {
    const cards = Array.isArray(items) ? items : [];
    const columnCount = safeColumns(columns);
    const preventNavigation = editorMode ? (event: React.MouseEvent) => event.preventDefault() : undefined;

    return (
        <div
            data-orbit-block="ClinicalStudyCardGrid"
            data-orbit-columns={String(columnCount)}
            className={`${BLOCK} ${BLOCK}--columns-${columnCount}`}
        >
            <div className={`${BLOCK}__inner`}>
                <div className={`${BLOCK}__grid`}>
                    {cards.map((item, idx) => (
                        <article key={`${item.dam_asset_id ?? 'study'}-${idx}`} className={`${BLOCK}__card`}>
                            {isRenderableContent(item.badge) && (
                                <span className={`${BLOCK}__badge`}>{item.badge}</span>
                            )}
                            <h3 className={`${BLOCK}__title`}>{item.title ?? DEFAULT_TITLE}</h3>
                            {isRenderableContent(item.description) && (
                                <p className={`${BLOCK}__description`}>{item.description}</p>
                            )}
                            <div className={`${BLOCK}__actions`}>
                                <a
                                    href={
                                        editorMode
                                            ? EDITOR_LINK_HREF
                                            : (item.link_uri ?? resolveDamAssetUrl(item.dam_asset_id, resolveAssetUrl))
                                    }
                                    onClick={preventNavigation}
                                    className={`${BLOCK}__action`}
                                >
                                    {VIEW_STUDY_LABEL}
                                </a>
                                {renderInlineDamTrigger({
                                    editorMode,
                                    propPath: `items[${idx}].dam_asset_id`,
                                    currentAssetId: item.dam_asset_id,
                                    allowedDamTypes: STUDY_DAM_TYPES,
                                    label: selectAssetLabel,
                                    onInlineSelectDamAsset,
                                })}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
