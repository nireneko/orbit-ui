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
