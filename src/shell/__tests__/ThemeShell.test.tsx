// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SectionWrapper } from '../SectionWrapper';
import { ThemeShell } from '../ThemeShell';

describe('@orbit/ui ThemeShell & SectionWrapper SSR', () => {
    it('renders ThemeShell in SSR with normalized data-orbit-theme for all 4 SiteThemes', () => {
        for (const theme of ['CLEAN', 'EDITORIAL', 'CLINICAL', 'BOLD'] as const) {
            const html = renderToStaticMarkup(
                React.createElement(
                    ThemeShell,
                    { theme, preset: 'SLATE' },
                    React.createElement('p', null, 'Orbit Content'),
                ),
            );

            expect(html).toContain(`data-orbit-theme="${theme.toLowerCase()}"`);
            expect(html).toContain('data-orbit-preset="slate"');
            expect(html).toContain('Orbit Content');
        }
    });

    it('renders SectionWrapper with EPIC-14 background color and horizontal alignment styles in SSR', () => {
        const html = renderToStaticMarkup(
            React.createElement(
                ThemeShell,
                { theme: 'CLINICAL' },
                React.createElement(
                    SectionWrapper,
                    {
                        sectionId: 'sec_hero_01',
                        componentName: 'HeroBanner',
                        style: {
                            background: { color: '#F2F4F6' },
                            alignment: { horizontal: 'center' },
                            spacing: { paddingTop: 'lg', paddingBottom: 'md' },
                        },
                    },
                    React.createElement('div', null, 'Clinical Hero'),
                ),
            ),
        );

        expect(html).toContain('data-orbit-theme="clinical"');
        expect(html).toContain('data-orbit-section-id="sec_hero_01"');
        expect(html).toContain('data-orbit-component="HeroBanner"');
        expect(html).toContain('background-color:#F2F4F6');
        expect(html).toContain('text-align:center');
        expect(html).toContain('Clinical Hero');
    });

    it('applies border fallback color, overflow hidden on radius, and data-orbit-align', () => {
        const html = renderToStaticMarkup(
            React.createElement(
                SectionWrapper,
                {
                    sectionId: 'sec_border_align',
                    componentName: 'HeroBanner',
                    style: {
                        alignment: { horizontal: 'right' },
                        border: { width: '2px', color: '', radius: '1rem' },
                    },
                },
                React.createElement('div', null, 'Bordered'),
            ),
        );

        expect(html).toContain('data-orbit-align="right"');
        expect(html).toContain('border-width:2px');
        expect(html).toContain('border-style:solid');
        expect(html).toContain('border-color:var(--orbit-color-border)');
        expect(html).toContain('border-radius:1rem');
        expect(html).toContain('overflow:hidden');
    });
});

function renderShell(props: Record<string, unknown>): string {
    return renderToStaticMarkup(
        React.createElement(ThemeShell, props, React.createElement('p', null, 'Orbit Content')),
    );
}

/** The opening tag of the ThemeShell root element. */
function shellRootTag(html: string): string {
    return html.slice(0, html.indexOf('>') + 1);
}

describe('@orbit/ui ThemeShell cssVariables (TASK-15.31 D2)', () => {
    it('writes every tenant custom property inline on the shell root', () => {
        const root = shellRootTag(
            renderShell({
                theme: 'CLINICAL',
                cssVariables:
                    "--orbit-color-accent: #0a6e84; --orbit-font-body: 'Inter', ui-sans-serif, sans-serif; --orbit-radius-button: 9999px;",
            }),
        );

        expect(root).toContain('data-orbit-theme="clinical"');
        expect(root).toContain('--orbit-color-accent:#0a6e84');
        expect(root).toContain('--orbit-font-body:&#x27;Inter&#x27;, ui-sans-serif, sans-serif');
        expect(root).toContain('--orbit-radius-button:9999px');
    });

    it('lets children inherit the tenant tokens from the shell root', () => {
        const html = renderShell({ cssVariables: '--orbit-color-accent: #0a6e84;' });

        expect(shellRootTag(html)).toContain('style="--orbit-color-accent:#0a6e84"');
        expect(html).toContain('<p>Orbit Content</p>');
    });

    it('writes no inline style without cssVariables or with an empty string', () => {
        for (const cssVariables of [undefined, '', '   ', ';;']) {
            expect(shellRootTag(renderShell({ cssVariables }))).not.toContain('style=');
        }
    });

    it('drops declarations whose name does not start with --', () => {
        const root = shellRootTag(
            renderShell({
                cssVariables:
                    'color: red; background: url(x); --orbit-color-text: #111827; -orbit-x: 1; --: 2; --orbit-empty: ;',
            }),
        );

        expect(root).toContain('style="--orbit-color-text:#111827"');
        expect(root).not.toContain('color:red');
        expect(root).not.toContain('background');
        expect(root).not.toContain('-orbit-x');
        expect(root).not.toContain('--orbit-empty');
    });

    it('keeps values that contain a colon, such as a URL', () => {
        const root = shellRootTag(
            renderShell({ cssVariables: '--orbit-hero-image: url(https://cdn.example.test/a.png);' }),
        );

        expect(root).toContain('--orbit-hero-image:url(https://cdn.example.test/a.png)');
    });
});

describe('@orbit/ui ThemeShell content container (TASK-15.31 D3)', () => {
    it('wraps the children in the content container and keeps data-orbit-theme and data-orbit-preset', () => {
        const html = renderShell({ theme: 'EDITORIAL', preset: 'Slate' });

        expect(shellRootTag(html)).toContain('data-orbit-theme="editorial"');
        expect(shellRootTag(html)).toContain('data-orbit-preset="slate"');
        expect(html).toContain('<div class="orbit-theme-shell__content"><p>Orbit Content</p></div>');
    });
});

describe('@orbit/ui SectionWrapper style contract (v0.3.0, TASK-15.31 T1.3-T1.4)', () => {
    function renderSection(style?: Record<string, unknown>): string {
        return renderToStaticMarkup(
            React.createElement(SectionWrapper, { sectionId: 's1', componentName: 'Text', style }, 'x'),
        );
    }

    it('renders no inline style and only the orbit-section class without style', () => {
        expect(renderSection()).toBe(
            '<section data-orbit-section-id="s1" data-orbit-component="Text" class="orbit-section">x</section>',
        );
        expect(renderSection({})).not.toContain('style=');
    });

    it('maps every spacing scale step to the v0.3.0 padding values', () => {
        const scale = { none: '0rem', sm: '1.5rem', md: '3rem', lg: '4.5rem', xl: '6rem' };

        for (const [step, value] of Object.entries(scale)) {
            const html = renderSection({ spacing: { paddingTop: step, paddingBottom: step } });
            expect(html, step).toContain(`padding-top:${value};padding-bottom:${value}`);
        }
    });

    it('applies background color, alignment, maxWidth and border exactly as v0.3.0', () => {
        const html = renderSection({
            background: { color: '#F2F4F6' },
            alignment: { horizontal: 'left' },
            maxWidth: ' 48rem ',
            border: { width: '3px', color: '#ff0000', radius: '0.5rem' },
        });

        expect(html).toContain(
            'style="background-color:#F2F4F6;text-align:left;max-width:48rem;margin-left:auto;margin-right:auto;border-width:3px;border-style:solid;border-color:#ff0000;border-radius:0.5rem;overflow:hidden"',
        );
        expect(html).toContain('data-orbit-align="left"');
    });

    it('falls back to a 1px border when only the border color is set and ignores unknown alignments', () => {
        const html = renderSection({
            alignment: { horizontal: 'justify' },
            border: { color: '#00ff00' },
        });

        expect(html).toContain('style="border-width:1px;border-style:solid;border-color:#00ff00"');
        expect(html).not.toContain('data-orbit-align');
    });
});
