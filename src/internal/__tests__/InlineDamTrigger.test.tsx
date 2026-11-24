// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ORBIT_COMPONENT_NAMES, resolveOrbitComponentRenderer } from '../../registry';
import type { OrbitInlineDamTriggerOptions } from '../../types';
import { renderInlineDamTrigger } from '../InlineDamTrigger';

const baseParams = {
    editorMode: true,
    propPath: 'items[0].dam_asset_id',
    currentAssetId: 'dam_current',
    allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
    label: 'Choose image',
};

describe('renderInlineDamTrigger', () => {
    it('renders a native type="button" with an accessible name and the editor data attributes', () => {
        const html = renderToStaticMarkup(
            renderInlineDamTrigger({ ...baseParams, onInlineSelectDamAsset: () => undefined }),
        );

        expect(html.startsWith('<button')).toBe(true);
        expect(html).toContain('type="button"');
        expect(html).toContain('class="orbit-inline-dam-trigger"');
        expect(html).toContain('data-puck-overlay-portal="true"');
        expect(html).toContain('data-orbit-inline-dam-trigger="true"');
        expect(html).toContain('data-orbit-inline-dam-prop="items[0].dam_asset_id"');
        expect(html).toContain('data-orbit-inline-dam-current="dam_current"');
        expect(html).toContain('<span>Choose image</span>');
        expect(html).toContain('<span aria-hidden="true">');
        expect(html).not.toContain('disabled');
        expect(html.toLowerCase()).not.toContain('tabindex');
        expect(html).not.toContain('style=');
    });

    it('falls back to the default accessible name and an empty current asset', () => {
        const html = renderToStaticMarkup(
            renderInlineDamTrigger({
                editorMode: true,
                propPath: 'dam_asset_id',
                onInlineSelectDamAsset: () => undefined,
            }),
        );

        expect(html).toContain('<span>Select DAM asset</span>');
        expect(html).toContain('data-orbit-inline-dam-current=""');
    });

    it('sends the full payload to onInlineSelectDamAsset when its onClick runs', () => {
        const onInlineSelectDamAsset = vi.fn<(options: OrbitInlineDamTriggerOptions) => void>();
        const element = renderInlineDamTrigger({ ...baseParams, onInlineSelectDamAsset });
        const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

        expect(element).not.toBeNull();
        (element as React.ReactElement<{ onClick: (e: unknown) => void }>).props.onClick(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(onInlineSelectDamAsset).toHaveBeenCalledOnce();
        expect(onInlineSelectDamAsset).toHaveBeenCalledWith({
            propPath: 'items[0].dam_asset_id',
            currentAssetId: 'dam_current',
            allowedDamTypes: ['IMAGE', 'INFOGRAPHIC'],
            label: 'Choose image',
        });
    });

    it('renders nothing outside editorMode or without a selection callback', () => {
        expect(
            renderInlineDamTrigger({ ...baseParams, editorMode: false, onInlineSelectDamAsset: () => undefined }),
        ).toBeNull();
        expect(renderInlineDamTrigger({ ...baseParams, onInlineSelectDamAsset: undefined })).toBeNull();
    });
});

describe('inline DAM trigger inside catalog components', () => {
    const imageProps = {
        dam_asset_id: 'dam_default_image',
        alt_text: 'Placeholder.',
        caption: 'Image caption.',
        selectAssetLabel: 'Choose image',
    };

    it('scenario 1: an image component in editorMode renders the trigger as a button with the full payload', () => {
        const Image = resolveOrbitComponentRenderer('Image');
        const html = renderToStaticMarkup(
            React.createElement(Image, {
                ...imageProps,
                editorMode: true,
                onInlineSelectDamAsset: () => undefined,
            }),
        );

        expect(html).toContain('<button type="button" class="orbit-inline-dam-trigger"');
        expect(html).toContain('data-puck-overlay-portal="true"');
        expect(html).toContain('data-orbit-inline-dam-trigger="true"');
        expect(html).toContain('data-orbit-inline-dam-prop="dam_asset_id"');
        expect(html).toContain('data-orbit-inline-dam-current="dam_default_image"');
    });

    it('scenario 2: the delivered page renders no trigger and no added button', () => {
        const Image = resolveOrbitComponentRenderer('Image');
        const html = renderToStaticMarkup(
            React.createElement(Image, {
                ...imageProps,
                editorMode: false,
                onInlineSelectDamAsset: () => undefined,
            }),
        );

        expect(html).not.toContain('<button');
        expect(html).not.toContain('data-orbit-inline-dam-trigger');

        for (const name of ORBIT_COMPONENT_NAMES) {
            const Renderer = resolveOrbitComponentRenderer(name);
            const delivered = renderToStaticMarkup(
                React.createElement(Renderer, {
                    editorMode: false,
                    onInlineSelectDamAsset: () => undefined,
                }),
            );

            expect(delivered).not.toContain('data-orbit-inline-dam-trigger');
        }
    });
});
