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
            expect(selectors).toContain(`[data-orbit-theme="${theme}"]`);
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
