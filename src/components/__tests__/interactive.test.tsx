// @vitest-environment node
import React from 'react';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckInScanner } from '../interactive/CheckInScanner';
import { ScheduleTimeline, type ScheduleTimelineEventItem } from '../interactive/ScheduleTimeline';
import { UserFavoriteTracker } from '../interactive/UserFavoriteTracker';

/**
 * TASK-15.33: the Interactive bundle (CheckInScanner, ScheduleTimeline, UserFavoriteTracker)
 * styled through its own stylesheets and the `--orbit-*` tokens (docs/design-port.md).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const INTERACTIVE_DIR = resolve(HERE, '..', 'interactive');
const STYLES_DIR = resolve(HERE, '..', '..', 'styles', 'components');

const SESSIONS: ScheduleTimelineEventItem[] = [
    { title: 'Opening keynote', starts_at: '09:00', location: 'Main hall' },
    { title: 'Clinical update', starts_at: '10:30', location: 'Room B' },
    { title: 'Closing panel', starts_at: '16:00' },
];

interface InteractiveCase {
    name: string;
    block: string;
    source: string;
    stylesheet: string;
    render: () => React.ReactElement;
}

const CASES: InteractiveCase[] = [
    {
        name: 'CheckInScanner',
        block: 'orbit-check-in-scanner',
        source: 'CheckInScanner.tsx',
        stylesheet: 'check-in-scanner.css',
        render: () => <CheckInScanner event_id="evt-42" />,
    },
    {
        name: 'ScheduleTimeline',
        block: 'orbit-schedule-timeline',
        source: 'ScheduleTimeline.tsx',
        stylesheet: 'schedule-timeline.css',
        render: () => <ScheduleTimeline events={SESSIONS} />,
    },
    {
        name: 'UserFavoriteTracker',
        block: 'orbit-user-favorite-tracker',
        source: 'UserFavoriteTracker.tsx',
        stylesheet: 'user-favorite-tracker.css',
        render: () => <UserFavoriteTracker target_type="DOCUMENT" target_id="doc-7" />,
    },
];

function rootClassList(markup: string): string[] {
    const match = markup.match(/^<div[^>]*class="([^"]*)"/);

    return match ? (match[1] ?? '').split(' ') : [];
}

function stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Declarations of the rules for `selector` that sit outside any `@media` block. */
function baseDeclarations(css: string, selector: string): string {
    const withoutMedia = stripComments(css).replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g');

    return [...withoutMedia.matchAll(pattern)].map((match) => match[1]).join(';');
}

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('Interactive bundle', () => {
    describe.each(CASES)('$name', ({ name, block, source, stylesheet, render }) => {
        it('renders on the server with its .orbit-<block> root class and keeps data-orbit-block', () => {
            const markup = renderToStaticMarkup(render());

            expect(rootClassList(markup)).toContain(block);
            expect(markup).toContain(`data-orbit-block="${name}"`);
        });

        it('renders no inline style: fixed sizes live in its stylesheet', () => {
            expect(renderToStaticMarkup(render())).not.toContain('style=');
        });

        it('styles its block class in its own stylesheet', () => {
            const css = readFileSync(join(STYLES_DIR, stylesheet), 'utf8');

            expect(css).toMatch(new RegExp(`\\.${block}\\s*\\{`));
        });

        it('owns its vertical padding, because .orbit-section no longer adds it', () => {
            const css = readFileSync(join(STYLES_DIR, stylesheet), 'utf8');

            expect(baseDeclarations(css, `.${block}`)).toMatch(/padding-block:\s*var\(--orbit-space-\d+\)/);
        });

        it('has responsive rules that use only min-width breakpoints of the guide', () => {
            const css = stripComments(readFileSync(join(STYLES_DIR, stylesheet), 'utf8'));
            const widthQueries = [...css.matchAll(/@media\s*([^{]*)\{/g)]
                .map((match) => (match[1] ?? '').trim())
                .filter((query) => query.includes('width'));

            expect(widthQueries.length).toBeGreaterThan(0);
            for (const query of widthQueries) {
                expect(query).toMatch(/^\(min-width: (40|48|64|80)rem\)$/);
            }
        });

        it('does not read window, document, the date or random values during render', () => {
            const code = stripComments(readFileSync(join(INTERACTIVE_DIR, source), 'utf8'));

            expect(code).not.toMatch(/\b(window|document|navigator|localStorage|sessionStorage)\b/);
            expect(code).not.toMatch(/\bDate\b|Math\.random|crypto|performance\.now/);
            expect(code).not.toMatch(/\buse(Layout)?Effect\b/);
        });

        it('produces the same initial markup at any time and with any random seed', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
            vi.spyOn(Math, 'random').mockReturnValue(0.1);
            const first = renderToStaticMarkup(render());

            vi.setSystemTime(new Date('2031-06-15T12:34:56Z'));
            vi.spyOn(Math, 'random').mockReturnValue(0.9);
            const second = renderToStaticMarkup(render());

            expect(second).toBe(first);
        });
    });

    describe('CheckInScanner', () => {
        it('keeps its event id attribute and renders the manual code controls by default', () => {
            const markup = renderToStaticMarkup(<CheckInScanner event_id="evt-42" />);

            expect(markup).toContain('data-orbit-event-id="evt-42"');
            expect(markup).toContain('Event Check-In (evt-42)');
            expect(markup).toContain('Check-in completed successfully.');
            expect(markup).toContain('placeholder="Attendee code"');
        });

        it('labels the attendee code input and renders the check-in control as a button', () => {
            const markup = renderToStaticMarkup(<CheckInScanner />);

            expect(markup).toMatch(/<input[^>]*aria-label="Attendee code"/);
            expect(markup).toMatch(/<button type="button"[^>]*>Check in<\/button>/);
        });

        it('enables the controls outside the editor and disables them in editor mode', () => {
            const live = renderToStaticMarkup(<CheckInScanner />);
            const editor = renderToStaticMarkup(<CheckInScanner editorMode />);

            expect(live).not.toContain('disabled');
            expect(editor).toMatch(/<input[^>]*disabled=""/);
            expect(editor).toMatch(/<button[^>]*disabled=""/);
        });

        it('omits the manual code controls when allow_manual_code is false', () => {
            const markup = renderToStaticMarkup(<CheckInScanner allow_manual_code={false} />);

            expect(markup).not.toContain('<input');
            expect(markup).not.toContain('<button');
        });

        it('stacks the manual code controls on narrow screens and lays them in a row from sm', () => {
            const css = stripComments(readFileSync(join(STYLES_DIR, 'check-in-scanner.css'), 'utf8'));

            expect(baseDeclarations(css, '.orbit-check-in-scanner__controls')).toMatch(
                /flex-direction:\s*column/,
            );
            expect(css).toMatch(
                /@media \(min-width: 40rem\)\s*\{[^@]*\.orbit-check-in-scanner__controls\s*\{[^}]*flex-direction:\s*row/,
            );
        });
    });

    describe('ScheduleTimeline', () => {
        it('keeps its timezone attribute and highlights only the first session', () => {
            const markup = renderToStaticMarkup(<ScheduleTimeline events={SESSIONS} />);

            expect(markup).toContain('data-orbit-timezone="Europe/Madrid"');
            expect(markup.match(/data-orbit-highlighted="true"/g)).toHaveLength(1);
            expect(markup.match(/data-orbit-highlighted="false"/g)).toHaveLength(2);
        });

        it('highlights no session when highlight_current is false', () => {
            const markup = renderToStaticMarkup(
                <ScheduleTimeline events={SESSIONS} highlight_current={false} />,
            );

            expect(markup).not.toContain('data-orbit-highlighted="true"');
        });

        it('renders one list item per session with its title, start time and location', () => {
            const markup = renderToStaticMarkup(<ScheduleTimeline events={SESSIONS} />);

            expect(markup.match(/<li /g)).toHaveLength(3);
            expect(markup).toContain('Opening keynote');
            expect(markup).toContain('09:00 · Main hall');
            expect(markup).toContain('Closing panel');
        });

        it('falls back to "Session" for a session without a title and renders an empty list without events', () => {
            expect(renderToStaticMarkup(<ScheduleTimeline events={[{}]} />)).toContain('Session');
            expect(renderToStaticMarkup(<ScheduleTimeline />)).not.toContain('<li');
        });

        it('separates sessions with a token border in the stylesheet, not inline', () => {
            const css = stripComments(readFileSync(join(STYLES_DIR, 'schedule-timeline.css'), 'utf8'));

            expect(css).toMatch(
                /\.orbit-schedule-timeline__item \+ \.orbit-schedule-timeline__item\s*\{[^}]*border-top:\s*var\(--orbit-border-width\) solid var\(--orbit-color-border\)/,
            );
        });

        it('gives each session the full width below 48rem with no horizontal scroll', () => {
            const css = stripComments(readFileSync(join(STYLES_DIR, 'schedule-timeline.css'), 'utf8'));
            const item = baseDeclarations(css, '.orbit-schedule-timeline__item');

            expect(item).toMatch(/width:\s*100%/);
            expect(item).toMatch(/box-sizing:\s*border-box/);
            expect(item).toMatch(/overflow-wrap:\s*anywhere/);
            expect(css).not.toMatch(/overflow-x|white-space:\s*nowrap/);
            for (const query of css.matchAll(/@media\s*\(min-width: (\d+)rem\)/g)) {
                expect(Number(query[1])).toBeGreaterThanOrEqual(48);
            }
        });
    });

    describe('UserFavoriteTracker', () => {
        it('keeps its target attributes and the initial unsaved state', () => {
            const markup = renderToStaticMarkup(
                <UserFavoriteTracker target_type="DOCUMENT" target_id="doc-7" />,
            );

            expect(markup).toContain('data-orbit-target-type="DOCUMENT"');
            expect(markup).toContain('data-orbit-target-id="doc-7"');
            expect(markup).toContain('Bookmark (DOCUMENT: doc-7)');
            expect(markup).toContain('Requires authenticated user');
        });

        it('renders the toggle as a named button with the secondary style before it is saved', () => {
            const markup = renderToStaticMarkup(<UserFavoriteTracker />);

            expect(markup).toMatch(
                /<button type="button" class="orbit-btn-secondary[^"]*">Save to favorites<\/button>/,
            );
        });

        it('describes a public bookmark when require_auth is false', () => {
            expect(renderToStaticMarkup(<UserFavoriteTracker require_auth={false} />)).toContain(
                'Public bookmark',
            );
        });

        it('stacks its content on narrow screens and lays it in a row from sm', () => {
            const css = stripComments(readFileSync(join(STYLES_DIR, 'user-favorite-tracker.css'), 'utf8'));

            expect(baseDeclarations(css, '.orbit-user-favorite-tracker__card')).toMatch(
                /flex-direction:\s*column/,
            );
            expect(css).toMatch(
                /@media \(min-width: 40rem\)\s*\{[^@]*\.orbit-user-favorite-tracker__card\s*\{[^}]*flex-direction:\s*row/,
            );
        });
    });
});
