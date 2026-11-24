// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    DocumentDownloadCenter,
    type DocumentDownloadCenterComponentProps,
    type DocumentDownloadItem,
} from '../core/DocumentDownloadCenter';

const DOCUMENT: DocumentDownloadItem = {
    dam_asset_id: 'dam_prescribing_information',
    title: 'Prescribing information',
    file_size: '1.2 MB',
    format: 'PDF',
    download_url: '/documents/prescribing-information.pdf',
};

const MINIMAL_SCHEMA_PROPS: DocumentDownloadCenterComponentProps = {
    category: 'Product documents',
    documents: [DOCUMENT],
};

function render(props: Partial<DocumentDownloadCenterComponentProps> = {}): string {
    return renderToStaticMarkup(<DocumentDownloadCenter {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? match[1].split(' ') : [];
}

const noop = (): void => undefined;

describe('DocumentDownloadCenter', () => {
    describe('structure with the minimal schema props', () => {
        it('renders a div root block with the reference structure', () => {
            const markup = render();

            expect(markup.startsWith('<div')).toBe(true);
            expect(rootClassList(markup)).toContain('orbit-document-download-center');
            expect(markup).toContain('data-orbit-block="DocumentDownloadCenter"');
            expect(markup).toContain('<div class="orbit-document-download-center__inner">');
            expect(markup).toContain('<h2 class="orbit-document-download-center__heading">Product documents</h2>');
            expect(markup).toContain('<ul class="orbit-document-download-center__list">');
            expect(markup).toContain('<li class="orbit-document-download-center__item">');
        });

        it('renders the title link, the metadata and the download action of each document', () => {
            const markup = render();

            expect(markup).toContain(
                '<a href="/documents/prescribing-information.pdf" class="orbit-document-download-center__link" download="">Prescribing information</a>',
            );
            expect(markup).toContain(
                '<p class="orbit-document-download-center__details"><span class="orbit-document-download-center__meta">[PDF, 1.2 MB]</span></p>',
            );
            expect(markup).toContain(
                '<a href="/documents/prescribing-information.pdf" class="orbit-document-download-center__action" download="">Download</a>',
            );
        });

        it('appends the Veeva approval code to the metadata when present', () => {
            const markup = render({ documents: [{ ...DOCUMENT, veeva_approval_code: 'PP-ORB-0042' }] });

            expect(markup).toContain(
                '<span class="orbit-document-download-center__code"> · MLR: PP-ORB-0042</span>',
            );
        });

        it('omits the approval code element when there is no code', () => {
            expect(render()).not.toContain('orbit-document-download-center__code');
        });

        it('renders one list item per document', () => {
            const markup = render({
                documents: [DOCUMENT, { ...DOCUMENT, title: 'Patient leaflet' }, { ...DOCUMENT, title: 'Summary' }],
            });

            expect(markup.match(/<li class="orbit-document-download-center__item">/g)).toHaveLength(3);
        });

        it('omits the heading when the category is empty', () => {
            expect(render({ category: '' })).not.toContain('orbit-document-download-center__heading');
        });

        it('keeps the React node content of the text props', () => {
            const markup = render({
                category: <span data-testid="inline-category">Inline category</span>,
                documents: [
                    {
                        ...DOCUMENT,
                        title: <span data-testid="inline-title">Inline title</span>,
                        file_size: <span data-testid="inline-size">3 MB</span>,
                    },
                ],
            });

            expect(markup).toContain('<span data-testid="inline-category">Inline category</span>');
            expect(markup).toContain('<span data-testid="inline-title">Inline title</span>');
            expect(markup).toContain('<span data-testid="inline-size">3 MB</span>');
        });
    });

    describe('format enum', () => {
        it.each(['PDF', 'DOCX', 'XLSX'])('shows the %s format in the metadata', (format) => {
            const markup = render({ documents: [{ ...DOCUMENT, format }] });

            expect(markup).toContain(`<span class="orbit-document-download-center__meta">[${format}, 1.2 MB]</span>`);
        });
    });

    describe('download links', () => {
        it('links a document with download_url to it and a document with only dam_asset_id to resolveAssetUrl', () => {
            const markup = render({
                documents: [
                    { ...DOCUMENT, download_url: '/documents/first.pdf' },
                    { ...DOCUMENT, dam_asset_id: 'dam_second', download_url: undefined },
                ],
                resolveAssetUrl: (damId) => `https://cdn.example.test/dam/${damId}`,
            });

            expect(markup.match(/href="\/documents\/first\.pdf"/g)).toHaveLength(2);
            expect(markup.match(/href="https:\/\/cdn\.example\.test\/dam\/dam_second"/g)).toHaveLength(2);
        });

        it('treats an empty download_url as missing', () => {
            const markup = render({
                documents: [{ ...DOCUMENT, download_url: '' }],
                resolveAssetUrl: (damId) => `https://cdn.example.test/dam/${damId}`,
            });

            expect(markup).toContain('href="https://cdn.example.test/dam/dam_prescribing_information"');
        });

        it('falls back to the Control Plane stream endpoint without resolveAssetUrl', () => {
            const markup = render({ documents: [{ ...DOCUMENT, download_url: undefined }] });

            expect(markup).toContain('href="/api/v1/dam/assets/dam_prescribing_information/stream"');
        });

        it('resolves download_url through resolveLink and applies its target and rel', () => {
            const markup = render({
                documents: [{ ...DOCUMENT, download_url: 'hub://documents/leaflet' }],
                resolveLink: (href) => ({
                    href: href.replace('hub://', 'https://site.example.test/'),
                    target: '_blank',
                    rel: 'noopener noreferrer',
                }),
            });

            expect(
                markup.match(
                    /href="https:\/\/site\.example\.test\/documents\/leaflet" target="_blank" rel="noopener noreferrer"/g,
                ),
            ).toHaveLength(2);
            expect(markup).not.toContain('hub://');
        });

        it('emits download_url as is without resolveLink', () => {
            const markup = render({ documents: [{ ...DOCUMENT, download_url: 'hub://documents/leaflet' }] });

            expect(markup).toContain('href="hub://documents/leaflet"');
            expect(markup).not.toContain('target=');
        });
    });

    describe('editorMode', () => {
        it('renders the inline DAM trigger as a sibling of the links and keeps data-orbit-block', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset: noop });

            expect(markup).toContain('data-orbit-block="DocumentDownloadCenter"');
            expect(markup).toContain('data-orbit-inline-dam-trigger="true"');
            expect(markup).toContain('data-orbit-inline-dam-prop="documents[0].dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-current="dam_prescribing_information"');
            expect(markup).not.toMatch(/<a[^>]*>(?:(?!<\/a>).)*<button/);
        });

        it('never navigates away from the canvas', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset: noop });

            expect(markup).not.toContain('/documents/prescribing-information.pdf');
            expect(markup.match(/href="#editor-download"/g)).toHaveLength(2);
        });

        it('renders no DAM trigger outside editorMode', () => {
            const markup = render({ editorMode: false, onInlineSelectDamAsset: noop });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
            expect(markup).not.toContain('<button');
        });
    });

    describe('styling', () => {
        it('has no inline styles and no legacy button classes', () => {
            const markup = render({
                editorMode: true,
                onInlineSelectDamAsset: noop,
                documents: [{ ...DOCUMENT, veeva_approval_code: 'PP-ORB-0042' }],
            });

            expect(markup).not.toContain('style=');
            expect(markup).not.toContain('orbit-btn-');
            expect(markup).not.toContain('orbit-card');
        });
    });
});
