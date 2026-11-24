// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    ClinicalStudyCardGrid,
    type ClinicalStudyCardGridComponentProps,
    type ClinicalStudyItem,
} from '../pharma/ClinicalStudyCardGrid';
import {
    MedicalInquiryForm,
    type MedicalInquiryFieldItem,
    type MedicalInquiryFormComponentProps,
} from '../pharma/MedicalInquiryForm';
import { RestrictedVideoPlayer, type RestrictedVideoPlayerComponentProps } from '../pharma/RestrictedVideoPlayer';

/**
 * TASK-15.32: the Pharma bundle components on the token contract of docs/design-port.md.
 * Markup is rendered on the server; stylesheets are read from source and parsed into rules.
 */

const COMPONENT_STYLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../styles/components');
const BREAKPOINT_CONTEXTS = ['@media (min-width: 40rem)', '@media (min-width: 48rem)', '@media (min-width: 64rem)'];
/** Properties whose values must come from the token scale (or be zero). */
const SCALED_PROPERTIES = /^(font-size|line-height|gap|row-gap|column-gap|padding(-[a-z-]+)?|margin(-[a-z-]+)?)$/;

interface CssRule {
    /** Enclosing at-rule preludes, for example `@media (min-width: 48rem)`. */
    context: string;
    selector: string;
    declarations: Record<string, string>;
}

function parseDeclarations(body: string): Record<string, string> {
    const declarations: Record<string, string> = {};

    for (const part of body.split(';')) {
        const colon = part.indexOf(':');
        if (colon === -1) {
            continue;
        }
        declarations[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
    }

    return declarations;
}

function parseRules(css: string): CssRule[] {
    const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules: CssRule[] = [];
    const preludes: string[] = [];
    let buffer = '';

    for (const character of source) {
        if (character === '{') {
            preludes.push(buffer.trim().replace(/\s+/g, ' '));
            buffer = '';
        } else if (character === '}') {
            const prelude = preludes.pop() ?? '';
            if (!prelude.startsWith('@')) {
                rules.push({
                    context: preludes.filter((entry) => entry.startsWith('@')).join(' '),
                    selector: prelude,
                    declarations: parseDeclarations(buffer),
                });
            }
            buffer = '';
        } else {
            buffer += character;
        }
    }

    return rules;
}

function readRules(sheet: string): CssRule[] {
    return parseRules(readFileSync(join(COMPONENT_STYLES_DIR, sheet), 'utf8'));
}

function declaration(rules: CssRule[], context: string, selector: string, property: string): string | undefined {
    return rules.find((rule) => rule.context === context && rule.selector === selector && property in rule.declarations)
        ?.declarations[property];
}

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

function expectTokenScaledSheet(sheet: string): void {
    const offending = readRules(sheet).flatMap((rule) =>
        Object.entries(rule.declarations)
            .filter(([property]) => SCALED_PROPERTIES.test(property))
            .filter(([, value]) => !/^(0|auto|inherit)$/.test(value) && !value.includes('var(--orbit-'))
            .map(([property, value]) => `${rule.selector} { ${property}: ${value} }`),
    );

    expect(offending).toEqual([]);
}

function expectOnlyGuideBreakpoints(sheet: string): void {
    const contexts = new Set(readRules(sheet).map((rule) => rule.context));
    const widthContexts = [...contexts].filter((context) => context.includes('width'));

    for (const context of widthContexts) {
        expect(BREAKPOINT_CONTEXTS).toContain(context);
    }
}

const noop = (): void => undefined;

describe('ClinicalStudyCardGrid', () => {
    const BLOCK = 'orbit-clinical-study-card-grid';
    const STUDY: ClinicalStudyItem = {
        dam_asset_id: 'dam_study_phase_three',
        badge: 'Fase III',
        title: 'Phase III efficacy study',
        description: 'Primary endpoint met at 52 weeks.',
        link_uri: 'hub://studies/phase-three',
    };

    function render(props: Partial<ClinicalStudyCardGridComponentProps> = {}): string {
        return renderToStaticMarkup(<ClinicalStudyCardGrid columns={3} items={[STUDY]} {...props} />);
    }

    describe('markup', () => {
        it('renders a div root with its block class and keeps the data attributes', () => {
            const markup = render();

            expect(markup.startsWith('<div')).toBe(true);
            expect(rootClassList(markup)).toContain(BLOCK);
            expect(markup).toContain('data-orbit-block="ClinicalStudyCardGrid"');
            expect(markup).toContain('data-orbit-columns="3"');
            expect(markup).toContain(`<div class="${BLOCK}__inner"><div class="${BLOCK}__grid">`);
        });

        it('renders each study as a card with its badge, title, description and link', () => {
            const markup = render();

            expect(markup).toContain(`<article class="${BLOCK}__card">`);
            expect(markup).toContain(`<span class="${BLOCK}__badge">Fase III</span>`);
            expect(markup).toContain(`<h3 class="${BLOCK}__title">Phase III efficacy study</h3>`);
            expect(markup).toContain(`<p class="${BLOCK}__description">Primary endpoint met at 52 weeks.</p>`);
            expect(markup).toContain(
                `<div class="${BLOCK}__actions"><a href="hub://studies/phase-three" class="${BLOCK}__action">View study</a></div>`,
            );
        });

        it('renders one card per item and the default title when it is missing', () => {
            const markup = render({ items: [STUDY, { ...STUDY, title: undefined }] });

            expect(markup.match(new RegExp(`<article class="${BLOCK}__card">`, 'g'))).toHaveLength(2);
            expect(markup).toContain(`<h3 class="${BLOCK}__title">Clinical Study</h3>`);
        });

        it('omits the badge and the description when they are empty', () => {
            const markup = render({ items: [{ ...STUDY, badge: '', description: '' }] });

            expect(markup).not.toContain(`${BLOCK}__badge`);
            expect(markup).not.toContain(`${BLOCK}__description`);
        });

        it('links a study without link_uri to its DAM asset', () => {
            const markup = render({
                items: [{ ...STUDY, link_uri: undefined }],
                resolveAssetUrl: (damId) => `https://cdn.example.test/dam/${damId}`,
            });

            expect(markup).toContain('href="https://cdn.example.test/dam/dam_study_phase_three"');
        });

        it('has no inline styles and no shell button, card or container classes', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset: noop });

            expect(markup).not.toContain('style=');
            expect(markup).not.toContain('orbit-btn-');
            expect(markup).not.toContain('orbit-card');
            expect(markup).not.toContain('orbit-container');
        });
    });

    describe('columns', () => {
        it.each([2, 3, 4])('reflects columns = %i in a modifier class and the data attribute', (columns) => {
            const markup = render({ columns });

            expect(rootClassList(markup)).toContain(`${BLOCK}--columns-${columns}`);
            expect(markup).toContain(`data-orbit-columns="${columns}"`);
        });

        it('falls back to three columns for a value outside the schema enum', () => {
            const markup = render({ columns: 5 });

            expect(rootClassList(markup)).toContain(`${BLOCK}--columns-3`);
            expect(markup).toContain('data-orbit-columns="3"');
        });
    });

    describe('editorMode', () => {
        it('keeps the inline DAM trigger outside the link and never navigates away', () => {
            const markup = render({ editorMode: true, onInlineSelectDamAsset: noop });

            expect(markup).toContain('data-orbit-inline-dam-trigger="true"');
            expect(markup).toContain('data-orbit-inline-dam-prop="items[0].dam_asset_id"');
            expect(markup).toContain('data-orbit-inline-dam-current="dam_study_phase_three"');
            expect(markup).not.toMatch(/<a[^>]*>(?:(?!<\/a>).)*<button/);
            expect(markup).toContain('href="#editor-study"');
            expect(markup).not.toContain('hub://studies/phase-three');
        });

        it('renders no DAM trigger outside editorMode', () => {
            expect(render({ onInlineSelectDamAsset: noop })).not.toContain('<button');
        });
    });

    describe('stylesheet', () => {
        const SHEET = 'clinical-study-card-grid.css';
        const GRID = `.${BLOCK}__grid`;

        it('defines one column by default, two from 48rem and the columns value from 64rem', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', GRID, 'grid-template-columns')).toBe('minmax(0, 1fr)');
            expect(declaration(rules, '@media (min-width: 48rem)', GRID, 'grid-template-columns')).toBe(
                'repeat(2, minmax(0, 1fr))',
            );
            expect(
                declaration(rules, '@media (min-width: 64rem)', `.${BLOCK}--columns-3 ${GRID}`, 'grid-template-columns'),
            ).toBe('repeat(3, minmax(0, 1fr))');
            expect(
                declaration(rules, '@media (min-width: 64rem)', `.${BLOCK}--columns-4 ${GRID}`, 'grid-template-columns'),
            ).toBe('repeat(4, minmax(0, 1fr))');
        });

        it('owns its vertical padding', () => {
            expect(declaration(readRules(SHEET), '', `.${BLOCK}`, 'padding-block')).toMatch(/^var\(--orbit-space-/);
        });

        it('gives the study link a visible focus outline', () => {
            const focus = readRules(SHEET).find((rule) => rule.selector.endsWith(`.${BLOCK}__action:focus-visible`));

            expect(focus?.declarations.outline).toBeDefined();
        });

        it('uses only token-scale sizes and the guide breakpoints', () => {
            expectTokenScaledSheet(SHEET);
            expectOnlyGuideBreakpoints(SHEET);
        });
    });
});

describe('MedicalInquiryForm', () => {
    const BLOCK = 'orbit-medical-inquiry-form';
    const FIELDS: MedicalInquiryFieldItem[] = [
        { name: 'fullname', label: 'Full name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'collegiate_number', label: 'Collegiate number', type: 'number' },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
    ];
    const SCHEMA_PROPS: MedicalInquiryFormComponentProps = {
        inquiry_type: 'ADVERSE_EVENT',
        submit_endpoint: 'https://inquiries.example.test/submit',
        pharmacovigilance_banner: {
            show_mandatory_warning: true,
            text: 'Report any adverse event to the pharmacovigilance unit.',
        },
        fields: FIELDS,
    };

    function render(props: Partial<MedicalInquiryFormComponentProps> = {}): string {
        return renderToStaticMarkup(<MedicalInquiryForm {...SCHEMA_PROPS} {...props} />);
    }

    describe('markup', () => {
        it('renders a div root with its block class and keeps the data attributes', () => {
            const markup = render();

            expect(markup.startsWith('<div')).toBe(true);
            expect(rootClassList(markup)).toContain(BLOCK);
            expect(markup).toContain('data-orbit-block="MedicalInquiryForm"');
            expect(markup).toContain('data-orbit-inquiry-type="ADVERSE_EVENT"');
            expect(markup).toContain(`<div class="${BLOCK}__inner"><div class="${BLOCK}__card">`);
        });

        it('shows the pharmacovigilance banner only when the warning is mandatory', () => {
            expect(render()).toContain(
                `<div role="note" class="${BLOCK}__banner">Report any adverse event to the pharmacovigilance unit.</div>`,
            );
            expect(
                render({ pharmacovigilance_banner: { show_mandatory_warning: false, text: 'Hidden banner text' } }),
            ).not.toContain('Hidden banner text');
        });

        it('submits to submit_endpoint with a submit button', () => {
            const markup = render();

            expect(markup).toContain(`<form class="${BLOCK}__form" action="https://inquiries.example.test/submit">`);
            expect(markup).toContain(`<button type="submit" class="${BLOCK}__submit">Submit inquiry</button>`);
        });

        it('has no inline styles and no shell button, card or container classes', () => {
            const markup = render();

            expect(markup).not.toContain('style=');
            expect(markup).not.toContain('orbit-btn-');
            expect(markup).not.toContain('orbit-card');
            expect(markup).not.toContain('orbit-container');
        });

        it('renders the same markup on every render, without browser state', () => {
            expect(render()).toBe(render());
        });
    });

    describe('fields', () => {
        it('associates every control with its label', () => {
            const markup = render();
            const labels = [...markup.matchAll(/<label for="([^"]+)" class="[^"]*">/g)].map((match) => match[1]);
            const controls = [...markup.matchAll(/<(?:input|textarea) id="([^"]+)"/g)].map((match) => match[1]);

            expect(labels).toEqual([
                'med-inquiry-fullname',
                'med-inquiry-email',
                'med-inquiry-collegiate_number',
                'med-inquiry-message',
            ]);
            expect(controls).toEqual(labels);
        });

        it('renders each field type, the required marker and the required attribute', () => {
            const markup = render();

            expect(markup).toContain(
                `<div class="${BLOCK}__field"><label for="med-inquiry-fullname" class="${BLOCK}__label">Full name *</label>`,
            );
            // React 19 serialises the `name` of an input after its other attributes.
            expect(markup).toContain(
                `<input id="med-inquiry-fullname" type="text" required="" class="${BLOCK}__control" name="fullname"/>`,
            );
            expect(markup).toContain(
                `<input id="med-inquiry-email" type="email" required="" class="${BLOCK}__control" name="email"/>`,
            );
            expect(markup).toContain(
                `<input id="med-inquiry-collegiate_number" type="number" class="${BLOCK}__control" name="collegiate_number"/>`,
            );
            expect(markup).toContain(`<label for="med-inquiry-collegiate_number" class="${BLOCK}__label">Collegiate number</label>`);
            expect(markup).toContain(
                `<textarea id="med-inquiry-message" name="message" required="" rows="3" class="${BLOCK}__control ${BLOCK}__control--textarea"></textarea>`,
            );
        });
    });

    describe('editorMode', () => {
        it('disables the controls and never submits', () => {
            const markup = render({ editorMode: true });

            expect(markup).not.toContain('action=');
            expect(markup.match(/disabled=""/g)).toHaveLength(FIELDS.length + 1);
            expect(markup).toContain('data-orbit-block="MedicalInquiryForm"');
        });
    });

    describe('stylesheet', () => {
        const SHEET = 'medical-inquiry-form.css';

        it('owns its vertical padding and widens the card padding from 48rem', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', `.${BLOCK}`, 'padding-block')).toMatch(/^var\(--orbit-space-/);
            expect(declaration(rules, '', `.${BLOCK}__card`, 'padding')).toBe('var(--orbit-space-6)');
            expect(declaration(rules, '@media (min-width: 48rem)', `.${BLOCK}__card`, 'padding')).toBe(
                'var(--orbit-space-8)',
            );
        });

        it('gives the controls and the submit button a visible focus outline', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', `.${BLOCK}__control:focus-visible`, 'outline')).toBeDefined();
            expect(declaration(rules, '', `.${BLOCK}__submit:focus-visible`, 'outline')).toBeDefined();
        });

        it('colours the submit text with the on-accent token', () => {
            expect(declaration(readRules(SHEET), '', `.${BLOCK}__submit`, 'color')).toBe('var(--orbit-color-on-accent)');
        });

        it('uses only token-scale sizes and the guide breakpoints', () => {
            expectTokenScaledSheet(SHEET);
            expectOnlyGuideBreakpoints(SHEET);
        });
    });
});

describe('RestrictedVideoPlayer', () => {
    const BLOCK = 'orbit-restricted-video-player';
    const SCHEMA_PROPS: RestrictedVideoPlayerComponentProps = {
        provider: 'vimeo_enterprise',
        vimeo_video_id: '987654321',
        title: 'Dosing in renal impairment',
        duration_minutes: 12,
        disclaimer_text: 'For healthcare professionals only.',
        fallback_unauthorized: { message: 'Sign in as an HCP to watch.', login_cta_label: 'HCP sign in' },
    };

    /** Static markup without React's text separators, so adjacent text nodes read as one string. */
    function render(props: Partial<RestrictedVideoPlayerComponentProps> = {}): string {
        return renderToStaticMarkup(<RestrictedVideoPlayer {...SCHEMA_PROPS} {...props} />).replace(/<!-- -->/g, '');
    }

    describe('markup', () => {
        it('renders a div root with its block class and keeps the data attributes', () => {
            const markup = render();

            expect(markup.startsWith('<div')).toBe(true);
            expect(rootClassList(markup)).toContain(BLOCK);
            expect(markup).toContain('data-orbit-block="RestrictedVideoPlayer"');
            expect(markup).toContain('data-orbit-editor-mode="false"');
            expect(render({ editorMode: true })).toContain('data-orbit-editor-mode="true"');
            expect(markup).toContain(`<div class="${BLOCK}__inner"><div class="${BLOCK}__card">`);
        });

        it('renders the restriction label, the duration, the title and the disclaimer', () => {
            const markup = render();

            expect(markup).toContain(
                `<div class="${BLOCK}__meta"><span class="${BLOCK}__restriction">HCP Restricted · vimeo_enterprise (987654321)</span><span class="${BLOCK}__duration">12 min</span></div>`,
            );
            expect(markup).toContain(`<h3 class="${BLOCK}__title">Dosing in renal impairment</h3>`);
            expect(markup).toContain(`<p class="${BLOCK}__disclaimer">For healthcare professionals only.</p>`);
        });

        it('omits the disclaimer when it is empty', () => {
            expect(render({ disclaimer_text: '' })).not.toContain(`${BLOCK}__disclaimer`);
        });

        it('renders the unauthorized gate with its message and sign-in label', () => {
            expect(render()).toContain(
                `<div class="${BLOCK}__gate"><span class="${BLOCK}__gate-message">Sign in as an HCP to watch.</span><span class="${BLOCK}__gate-cta">HCP sign in</span></div>`,
            );
        });

        it('falls back to the default gate texts', () => {
            const markup = render({ fallback_unauthorized: {} });

            expect(markup).toContain(`<span class="${BLOCK}__gate-message">HCP authentication required.</span>`);
            expect(markup).toContain(`<span class="${BLOCK}__gate-cta">Sign in</span>`);
        });

        it('renders no gate without fallback_unauthorized and never embeds the video', () => {
            const markup = render({ fallback_unauthorized: undefined });

            expect(markup).not.toContain(`${BLOCK}__gate`);
            expect(render()).not.toContain('<iframe');
            expect(render()).not.toContain('<video');
        });

        it('has no inline styles and no shell button, card or container classes', () => {
            const markup = render();

            expect(markup).not.toContain('style=');
            expect(markup).not.toContain('orbit-btn-');
            expect(markup).not.toContain('orbit-card');
            expect(markup).not.toContain('orbit-container');
        });
    });

    describe('stylesheet', () => {
        const SHEET = 'restricted-video-player.css';

        it('owns its vertical padding and widens the card padding from 48rem', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', `.${BLOCK}`, 'padding-block')).toMatch(/^var\(--orbit-space-/);
            expect(declaration(rules, '', `.${BLOCK}__card`, 'padding')).toBe('var(--orbit-space-6)');
            expect(declaration(rules, '@media (min-width: 48rem)', `.${BLOCK}__card`, 'padding')).toBe(
                'var(--orbit-space-8)',
            );
        });

        it('stacks the gate on small screens and lays it out in a row from 40rem', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', `.${BLOCK}__gate`, 'flex-direction')).toBe('column');
            expect(declaration(rules, '@media (min-width: 40rem)', `.${BLOCK}__gate`, 'flex-direction')).toBe('row');
        });

        it('lets the meta row wrap', () => {
            expect(declaration(readRules(SHEET), '', `.${BLOCK}__meta`, 'flex-wrap')).toBe('wrap');
        });

        it('grows the title from 48rem', () => {
            const rules = readRules(SHEET);

            expect(declaration(rules, '', `.${BLOCK}__title`, 'font-size')).toBe('var(--orbit-font-size-xl)');
            expect(declaration(rules, '@media (min-width: 48rem)', `.${BLOCK}__title`, 'font-size')).toBe(
                'var(--orbit-font-size-2xl)',
            );
        });

        it('colours the sign-in label with the on-accent token', () => {
            expect(declaration(readRules(SHEET), '', `.${BLOCK}__gate-cta`, 'color')).toBe('var(--orbit-color-on-accent)');
        });

        it('uses only token-scale sizes and the guide breakpoints', () => {
            expectTokenScaledSheet(SHEET);
            expectOnlyGuideBreakpoints(SHEET);
        });
    });
});
