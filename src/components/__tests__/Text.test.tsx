// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Text, type TextComponentProps } from '../core/Text';

const MINIMAL_SCHEMA_PROPS: TextComponentProps = {
    body: 'Our teams publish every study we run.',
};

function render(props: Partial<TextComponentProps> = {}): string {
    return renderToStaticMarkup(<Text {...MINIMAL_SCHEMA_PROPS} {...props} />);
}

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

describe('Text', () => {
    describe('structure with the minimal schema props', () => {
        it('renders the root block with the reference structure', () => {
            const markup = render();

            expect(rootClassList(markup)).toContain('orbit-text');
            expect(markup).toContain('data-orbit-block="Text"');
            expect(markup).toBe(
                '<div class="orbit-text orbit-text--align-left orbit-text--tone-default" data-orbit-block="Text" data-orbit-tone="default">'
                    + '<div class="orbit-text__inner">'
                    + '<p class="orbit-text__body">Our teams publish every study we run.</p>'
                    + '</div></div>',
            );
        });

        it('renders the heading as an h2 before the body', () => {
            const markup = render({ heading: 'Research that matters' });

            expect(markup).toContain(
                '<div class="orbit-text__inner"><h2 class="orbit-text__heading">Research that matters</h2>'
                    + '<p class="orbit-text__body">',
            );
        });

        it('does not keep the shared orbit-heading or orbit-container classes', () => {
            const markup = render({ heading: 'Research that matters' });

            expect(markup).not.toContain('orbit-heading');
            expect(markup).not.toContain('orbit-container');
        });

        it('omits the heading and body elements when they are empty', () => {
            const markup = render({ heading: '   ', body: '' });

            expect(markup).not.toContain('orbit-text__heading');
            expect(markup).not.toContain('orbit-text__body');
        });

        it('keeps the React node content of heading and body', () => {
            const markup = render({
                heading: <span data-testid="inline-heading">Inline heading</span>,
                body: <span data-testid="inline-body">Inline body</span>,
            });

            expect(markup).toContain('<span data-testid="inline-heading">Inline heading</span>');
            expect(markup).toContain('<span data-testid="inline-body">Inline body</span>');
        });

        it('escapes markup in a plain-text body', () => {
            const markup = render({ body: '<script>alert(1)</script>' });

            expect(markup).not.toContain('<script>');
            expect(markup).toContain('&lt;script&gt;');
        });
    });

    describe('alignment', () => {
        it.each(['left', 'center', 'right'])('%s: the root carries its alignment variant', (alignment) => {
            const classes = rootClassList(render({ alignment }));

            expect(classes).toContain(`orbit-text--align-${alignment}`);
            expect(classes.filter((name) => name.startsWith('orbit-text--align-'))).toHaveLength(1);
        });

        it('falls back to left for a value outside the schema', () => {
            expect(rootClassList(render({ alignment: 'justify' }))).toContain('orbit-text--align-left');
        });
    });

    describe('tone', () => {
        it.each(['default', 'muted', 'accent'])('%s: the root carries its tone variant', (tone) => {
            const markup = render({ tone });
            const classes = rootClassList(markup);

            expect(classes).toContain(`orbit-text--tone-${tone}`);
            expect(classes.filter((name) => name.startsWith('orbit-text--tone-'))).toHaveLength(1);
            expect(markup).toContain(`data-orbit-tone="${tone}"`);
        });

        it('falls back to the default tone class for a value outside the schema', () => {
            expect(rootClassList(render({ tone: 'loud' }))).toContain('orbit-text--tone-default');
        });
    });

    describe('editorMode', () => {
        it('keeps data-orbit-block and renders no DAM trigger, since Text has no asset', () => {
            const markup = render({ heading: 'Research that matters', editorMode: true });

            expect(markup).toContain('data-orbit-block="Text"');
            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
        });

        it('renders no DAM trigger with editorMode={false}', () => {
            const markup = render({ heading: 'Research that matters', editorMode: false });

            expect(markup).not.toContain('data-orbit-inline-dam-trigger');
        });
    });

    describe('inline styles', () => {
        it('sets no fixed font size, padding or width inline', () => {
            const markup = render({ heading: 'Research that matters', alignment: 'center', tone: 'accent' });

            expect(markup).not.toContain('style=');
        });
    });
});
