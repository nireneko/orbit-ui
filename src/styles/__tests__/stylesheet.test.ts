// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ORBIT_COMPONENT_NAMES } from '../../registry';

/**
 * Structural contract of the `@orbit/ui/styles.css` entry stylesheet
 * (TASK-15.20, see docs/design-port.md).
 *
 * The tests read the CSS sources and resolve `@import` the way Vite, Astro and
 * browsers do, so they assert on the stylesheet a consumer actually receives.
 */

const STYLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(STYLES_DIR, 'orbit-tokens.css');
const COMPONENTS_DIR = join(STYLES_DIR, 'components');
const TESTS_DIR = join(STYLES_DIR, '__tests__');
const V030_BASELINE = join(TESTS_DIR, 'fixtures', 'orbit-tokens.v0.3.0.css');

/** D2: the only breakpoints, always expressed as `min-width`. */
const BREAKPOINTS = ['40rem', '48rem', '64rem', '80rem'];
/** The only stylesheets allowed to define `--orbit-*` tokens. */
const TOKEN_SHEETS = ['orbit-tokens.css', 'themes.css'];
const THEMES = ['clean', 'editorial', 'clinical', 'bold'];

const IMPORT_PATTERN = /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?[^;]*;/g;

interface Declaration {
    file: string;
    /** Enclosing at-rule preludes (e.g. `@media (min-width: 48rem)`), joined. */
    context: string;
    selector: string;
    property: string;
    value: string;
}

function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function collapse(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function normalizeSelector(selector: string): string {
    return selector
        .split(',')
        .map((part) => collapse(part).replace(/'/g, '"'))
        .join(', ');
}

function readSource(file: string): string {
    return stripComments(readFileSync(file, 'utf8'));
}

function importsOf(file: string): string[] {
    return [...readSource(file).matchAll(IMPORT_PATTERN)].map((match) =>
        resolve(dirname(file), match[1] ?? ''),
    );
}

function parseDeclarations(css: string, file: string, context = ''): Declaration[] {
    const declarations: Declaration[] = [];
    let cursor = 0;

    while (cursor < css.length) {
        const open = css.indexOf('{', cursor);
        if (open === -1) {
            break;
        }

        let depth = 1;
        let close = open + 1;
        while (close < css.length && depth > 0) {
            if (css[close] === '{') {
                depth++;
            } else if (css[close] === '}') {
                depth--;
            }
            close++;
        }

        const prelude = collapse(css.slice(cursor, open));
        const body = css.slice(open + 1, close - 1);

        if (prelude.startsWith('@')) {
            const nested = context === '' ? prelude : `${context} ${prelude}`;
            declarations.push(...parseDeclarations(body, file, nested));
        } else {
            for (const statement of body.split(';')) {
                const colon = statement.indexOf(':');
                if (colon === -1) {
                    continue;
                }
                declarations.push({
                    file,
                    context,
                    selector: normalizeSelector(prelude),
                    property: collapse(statement.slice(0, colon)),
                    value: collapse(statement.slice(colon + 1)),
                });
            }
        }

        cursor = close;
    }

    return declarations;
}

function declarationsOf(file: string): Declaration[] {
    return parseDeclarations(readSource(file).replace(IMPORT_PATTERN, ''), file);
}

/** Every stylesheet reachable from `entry`, imports first, as a consumer resolves them. */
function resolveSheets(entry: string, seen: Set<string> = new Set()): string[] {
    if (seen.has(entry)) {
        return [];
    }
    seen.add(entry);

    return [...importsOf(entry).flatMap((imported) => resolveSheets(imported, seen)), entry];
}

function resolvedDeclarations(): Declaration[] {
    return resolveSheets(ENTRY).flatMap(declarationsOf);
}

function cssFilesUnder(directory: string): string[] {
    return readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) {
            return path === TESTS_DIR ? [] : cssFilesUnder(path);
        }
        return name.endsWith('.css') ? [path] : [];
    });
}

function ruleKey(declaration: Declaration): string {
    return `${declaration.context} ${declaration.selector}`.trim();
}

function groupByRule(declarations: Declaration[]): Map<string, Set<string>> {
    const rules = new Map<string, Set<string>>();
    for (const declaration of declarations) {
        const key = ruleKey(declaration);
        const body = rules.get(key) ?? new Set<string>();
        body.add(`${declaration.property}: ${declaration.value}`);
        rules.set(key, body);
    }
    return rules;
}

function toKebabCase(componentName: string): string {
    return componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

describe('@orbit/ui entry stylesheet structure', () => {
    it('ships one stylesheet per catalog component plus the fallback', () => {
        const expected = [...ORBIT_COMPONENT_NAMES.map(toKebabCase), 'fallback'];

        for (const name of expected) {
            expect(existsSync(join(COMPONENTS_DIR, `${name}.css`)), `${name}.css`).toBe(true);
        }
    });

    it('imports every component stylesheet exactly once from the entry stylesheet', () => {
        const entryImports = importsOf(ENTRY);
        const componentSheets = cssFilesUnder(COMPONENTS_DIR);

        expect(componentSheets.length).toBeGreaterThan(0);
        for (const sheet of componentSheets) {
            const count = entryImports.filter((imported) => imported === sheet).length;
            expect(count, relative(STYLES_DIR, sheet)).toBe(1);
        }
    });

    it('imports the shell and theme stylesheets from the entry stylesheet', () => {
        const entryImports = importsOf(ENTRY);

        expect(entryImports).toContain(join(STYLES_DIR, 'shell.css'));
        expect(entryImports).toContain(join(STYLES_DIR, 'themes.css'));
    });

    it('resolves every @import to an existing stylesheet', () => {
        for (const sheet of resolveSheets(ENTRY)) {
            expect(existsSync(sheet), relative(STYLES_DIR, sheet)).toBe(true);
        }
    });

    it('places every @import before the first rule of its stylesheet', () => {
        for (const sheet of cssFilesUnder(STYLES_DIR)) {
            const css = readSource(sheet);
            const firstRule = css.indexOf('{');
            for (const match of css.matchAll(IMPORT_PATTERN)) {
                if (firstRule !== -1) {
                    expect(match.index, relative(STYLES_DIR, sheet)).toBeLessThan(firstRule);
                }
            }
        }
    });

    it('uses only the D2 breakpoints, always as min-width', () => {
        const allowed = new RegExp(`^min-width:\\s*(${BREAKPOINTS.join('|')})$`);

        for (const sheet of cssFilesUnder(STYLES_DIR)) {
            for (const media of readSource(sheet).matchAll(/@media([^{]+)\{/g)) {
                for (const feature of (media[1] ?? '').matchAll(/\(([^()]+)\)/g)) {
                    const condition = collapse(feature[1] ?? '');
                    if (/width/.test(condition)) {
                        expect(condition, `${relative(STYLES_DIR, sheet)}: @media${media[1]}`).toMatch(
                            allowed,
                        );
                    }
                }
            }
        }
    });

    it('defines --orbit-* tokens only in orbit-tokens.css and themes.css', () => {
        for (const sheet of cssFilesUnder(STYLES_DIR)) {
            const name = relative(STYLES_DIR, sheet);
            if (TOKEN_SHEETS.includes(name)) {
                continue;
            }
            const tokens = declarationsOf(sheet)
                .map((declaration) => declaration.property)
                .filter((property) => property.startsWith('--orbit-'));
            expect(tokens, name).toEqual([]);
        }
    });
});

describe('@orbit/ui resolved stylesheet content', () => {
    it('keeps every v0.3.0 rule, adding only new --orbit-* tokens to :root', () => {
        const baseline = groupByRule(declarationsOf(V030_BASELINE));
        const resolved = groupByRule(resolvedDeclarations());

        for (const [rule, baselineBody] of baseline) {
            const resolvedBody = resolved.get(rule) ?? new Set<string>();
            const added = [...resolvedBody].filter((line) => !baselineBody.has(line));

            expect([...baselineBody].filter((line) => !resolvedBody.has(line)), `${rule} lost`).toEqual(
                [],
            );
            if (rule === ':root') {
                const addedNames = added.map((line) => line.slice(0, line.indexOf(':')));
                const baselineNames = [...baselineBody].map((line) => line.slice(0, line.indexOf(':')));
                for (const name of addedNames) {
                    expect(name, 'new :root declaration').toMatch(/^--orbit-/);
                    expect(baselineNames, 'existing token redefined').not.toContain(name);
                }
            } else {
                expect(added, `${rule} gained`).toEqual([]);
            }
        }
    });

    it('defines structural tokens for all 4 SiteThemes', () => {
        const selectors = new Set(resolvedDeclarations().map((declaration) => declaration.selector));

        for (const theme of THEMES) {
            const parts = [...selectors].flatMap((selector) => selector.split(', '));
            expect(parts).toContain(`[data-orbit-theme="${theme}"]`);
        }
    });

    it('defines theme-scoped visual rules for the editorial, clinical and bold SiteThemes', () => {
        const declarations = resolvedDeclarations();

        for (const theme of ['editorial', 'clinical', 'bold']) {
            const scoped = declarations.filter((declaration) =>
                declaration.selector.startsWith(`[data-orbit-theme="${theme}"] `),
            );
            expect(scoped.length, theme).toBeGreaterThan(0);
        }
        expect(
            declarations.some(
                (declaration) =>
                    declaration.selector.startsWith('[data-orbit-theme="') &&
                    declaration.value.includes('var(--orbit-color-accent)'),
            ),
        ).toBe(true);
    });

    it('keeps the per-section Appearance alignment overrides', () => {
        const selectors = resolvedDeclarations().map((declaration) => declaration.selector);

        for (const alignment of ['left', 'center', 'right']) {
            expect(selectors).toContain(`[data-orbit-align="${alignment}"] [data-orbit-block]`);
        }
    });
});

/**
 * Minimal cascade model: the element a compound selector (no combinator) is
 * tested against. Enough to resolve custom properties on `<html>`, the
 * ThemeShell root and `.orbit-section`.
 */
interface ElementModel {
    tag: string;
    isRoot: boolean;
    attributes: Record<string, string>;
    classes: string[];
}

type Specificity = [number, number, number];

const COMPOUND_TOKEN = /:root|\[[a-z-]+(?:="[^"]*")?\]|\.[A-Za-z0-9_-]+|^[a-z]+|^\*/g;

/** Specificity of `compound` when it matches `element`, otherwise null. */
function matchCompound(compound: string, element: ElementModel): Specificity | null {
    if (/[\s>+~]/.test(compound)) {
        return null;
    }
    const tokens = compound.match(COMPOUND_TOKEN) ?? [];
    if (tokens.join('') !== compound) {
        return null;
    }

    const specificity: Specificity = [0, 0, 0];
    for (const token of tokens) {
        if (token === ':root') {
            if (!element.isRoot) {
                return null;
            }
            specificity[1]++;
        } else if (token.startsWith('[')) {
            const [, name, value] = /^\[([a-z-]+)(?:="([^"]*)")?\]$/.exec(token) ?? [];
            const actual = name === undefined ? undefined : element.attributes[name];
            if (actual === undefined || (value !== undefined && actual !== value)) {
                return null;
            }
            specificity[1]++;
        } else if (token.startsWith('.')) {
            if (!element.classes.includes(token.slice(1))) {
                return null;
            }
            specificity[1]++;
        } else if (token !== '*') {
            if (token !== element.tag) {
                return null;
            }
            specificity[2]++;
        }
    }
    return specificity;
}

function compareSpecificity(left: Specificity, right: Specificity): number {
    for (let index = 0; index < 3; index++) {
        const difference = (left[index] ?? 0) - (right[index] ?? 0);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

/** The cascaded value of `property` on `element` (no @media), later rules winning ties. */
function cascadedValue(
    declarations: Declaration[],
    element: ElementModel,
    property: string,
): string | undefined {
    let winner: { specificity: Specificity; value: string } | undefined;

    for (const declaration of declarations) {
        if (declaration.context !== '' || declaration.property !== property) {
            continue;
        }
        for (const compound of declaration.selector.split(', ')) {
            const specificity = matchCompound(compound, element);
            if (specificity && (!winner || compareSpecificity(specificity, winner.specificity) >= 0)) {
                winner = { specificity, value: declaration.value };
            }
        }
    }
    return winner?.value;
}

/** SiteTheme::getStructuralTokens() in orbit-hub (src/Enum/SiteTheme.php), copied verbatim. */
const SITE_THEME_STRUCTURAL_TOKENS: Record<string, Record<string, string>> = {
    clean: {
        '--orbit-container-max-width': '72rem',
        '--orbit-section-spacing-y': '4rem',
        '--orbit-radius-base': '0.5rem',
        '--orbit-radius-lg': '0.75rem',
        '--orbit-radius-button': '0.5rem',
        '--orbit-border-width': '1px',
        '--orbit-card-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.06)',
    },
    editorial: {
        '--orbit-container-max-width': '68rem',
        '--orbit-section-spacing-y': '5.5rem',
        '--orbit-radius-base': '0.125rem',
        '--orbit-radius-lg': '0.25rem',
        '--orbit-radius-button': '0rem',
        '--orbit-border-width': '1px',
        '--orbit-card-shadow': 'none',
    },
    clinical: {
        '--orbit-container-max-width': '76rem',
        '--orbit-section-spacing-y': '3.5rem',
        '--orbit-radius-base': '0.75rem',
        '--orbit-radius-lg': '1rem',
        '--orbit-radius-button': '9999px',
        '--orbit-border-width': '1px',
        '--orbit-card-shadow': '0 4px 16px -2px rgb(15 23 42 / 0.08)',
    },
    bold: {
        '--orbit-container-max-width': '80rem',
        '--orbit-section-spacing-y': '5rem',
        '--orbit-radius-base': '1rem',
        '--orbit-radius-lg': '1.5rem',
        '--orbit-radius-button': '0.75rem',
        '--orbit-border-width': '2px',
        '--orbit-card-shadow': '0 10px 25px -5px rgb(0 0 0 / 0.12)',
    },
};

function htmlElement(theme?: string): ElementModel {
    return {
        tag: 'html',
        isRoot: true,
        attributes: theme === undefined ? {} : { 'data-orbit-theme': theme },
        classes: [],
    };
}

function shellRootElement(theme: string): ElementModel {
    return {
        tag: 'div',
        isRoot: false,
        attributes: { 'data-orbit-theme': theme },
        classes: ['orbit-theme-shell', `orbit-theme-shell--${theme}`],
    };
}

describe('@orbit/ui per-theme structural tokens (TASK-15.31 D1)', () => {
    it('defines exactly the SiteTheme structural values in each theme block', () => {
        const declarations = declarationsOf(join(STYLES_DIR, 'themes.css'));

        for (const theme of THEMES) {
            const block = declarations.filter((declaration) =>
                declaration.selector.split(', ').includes(`[data-orbit-theme="${theme}"]`),
            );
            const values = Object.fromEntries(
                block.map((declaration) => [declaration.property, declaration.value]),
            );
            expect(values, theme).toEqual(SITE_THEME_STRUCTURAL_TOKENS[theme]);
        }
    });

    it('resolves the theme values over the :root defaults on <html data-orbit-theme>', () => {
        const declarations = resolvedDeclarations();

        for (const theme of THEMES) {
            for (const [token, value] of Object.entries(SITE_THEME_STRUCTURAL_TOKENS[theme] ?? {})) {
                expect(cascadedValue(declarations, htmlElement(theme), token), `${theme} ${token}`).toBe(
                    value,
                );
            }
        }
    });

    it('resolves the theme values on the ThemeShell root', () => {
        const declarations = resolvedDeclarations();

        for (const theme of THEMES) {
            for (const [token, value] of Object.entries(SITE_THEME_STRUCTURAL_TOKENS[theme] ?? {})) {
                expect(
                    cascadedValue(declarations, shellRootElement(theme), token),
                    `${theme} ${token}`,
                ).toBe(value);
            }
        }
    });

    it('keeps the CLEAN values as the :root defaults on <html> without a theme', () => {
        const declarations = resolvedDeclarations();

        for (const [token, value] of Object.entries(SITE_THEME_STRUCTURAL_TOKENS.clean ?? {})) {
            expect(cascadedValue(declarations, htmlElement(), token), token).toBe(value);
        }
    });

    it('lets the host css_variables rule (html:root[data-orbit-theme]) override the theme values', () => {
        const host = parseDeclarations(
            'html:root[data-orbit-theme] { --orbit-radius-button: 3px; }',
            'host',
        );
        const declarations = [...resolvedDeclarations(), ...host];

        for (const theme of THEMES) {
            expect(cascadedValue(declarations, htmlElement(theme), '--orbit-radius-button'), theme).toBe(
                '3px',
            );
        }
    });
});

describe('@orbit/ui shell layout rules (TASK-15.31 D3-D4)', () => {
    it('adds no default vertical padding to .orbit-section', () => {
        const declarations = resolvedDeclarations();
        const section: ElementModel = {
            tag: 'section',
            isRoot: false,
            attributes: {},
            classes: ['orbit-section'],
        };

        for (const property of ['padding', 'padding-top', 'padding-bottom', 'padding-block']) {
            expect(cascadedValue(declarations, section, property), property).toBeUndefined();
        }
    });

    it('limits the content container to 64rem, centred, only in the EDITORIAL theme', () => {
        const declarations = resolvedDeclarations();
        const rootTokens = Object.fromEntries(
            declarations
                .filter((declaration) => declaration.selector === ':root')
                .map((declaration) => [declaration.property, declaration.value]),
        );
        const resolveVar = (value: string): string =>
            value.replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => rootTokens[name] ?? name);
        const contentRules = declarations.filter((declaration) =>
            declaration.selector.split(', ').some((part) => part.endsWith('.orbit-theme-shell__content')),
        );
        const editorial = '.orbit-theme-shell[data-orbit-theme="editorial"] > .orbit-theme-shell__content';

        const maxWidths = contentRules.filter((declaration) => declaration.property === 'max-width');
        expect(maxWidths.map((declaration) => declaration.selector)).toEqual([editorial]);
        expect(resolveVar(maxWidths[0]?.value ?? '')).toBe('64rem');

        const editorialBody = Object.fromEntries(
            contentRules
                .filter((declaration) => declaration.selector === editorial)
                .map((declaration) => [declaration.property, declaration.value]),
        );
        expect(editorialBody['margin-left']).toBe('auto');
        expect(editorialBody['margin-right']).toBe('auto');
    });
});
