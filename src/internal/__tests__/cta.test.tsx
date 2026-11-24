// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { renderCtaButton } from '../cta';

function render(...args: Parameters<typeof renderCtaButton>): string {
    const element = renderCtaButton(...args);

    return element === null ? '' : renderToStaticMarkup(element);
}

describe('renderCtaButton', () => {
    it.each([
        ['primary_button', 'orbit-cta orbit-cta--primary'],
        ['secondary_button', 'orbit-cta orbit-cta--secondary'],
        ['link', 'orbit-cta orbit-cta--link'],
        [undefined, 'orbit-cta orbit-cta--primary'],
        ['unknown_variant', 'orbit-cta orbit-cta--primary'],
    ])('renders variant %s with the shared CTA classes', (variant, className) => {
        expect(render({ label: 'Contact', href: '/contact', variant })).toBe(
            `<a href="/contact" class="${className}">Contact</a>`,
        );
    });

    it('is not a navigable link in editorMode', () => {
        const html = render({ label: 'Contact', href: '/contact', variant: 'link' }, true);

        expect(html).toBe('<span class="orbit-cta orbit-cta--link">Contact</span>');
        expect(html).not.toContain('href');
    });

    it('emits the href unchanged without resolveLink, and "#" when it is missing', () => {
        expect(render({ label: 'Home', href: 'hub://home' })).toContain('href="hub://home"');
        expect(render({ label: 'Home' })).toContain('href="#"');
    });

    it('scenario 3: applies the href, target and rel returned by resolveLink', () => {
        const resolveLink = vi.fn(() => ({
            href: 'https://example.com/',
            target: '_blank',
            rel: 'noopener noreferrer',
        }));

        const html = render({ label: 'External', href: 'https://example.com/' }, false, { resolveLink });

        expect(resolveLink).toHaveBeenCalledWith('https://example.com/');
        expect(html).toBe(
            '<a href="https://example.com/" target="_blank" rel="noopener noreferrer" class="orbit-cta orbit-cta--primary">External</a>',
        );
    });

    it('does not call resolveLink in editorMode', () => {
        const resolveLink = vi.fn(() => ({ href: '/resolved' }));

        render({ label: 'Home', href: 'hub://home' }, true, { resolveLink });

        expect(resolveLink).not.toHaveBeenCalled();
    });

    it('opens in a new tab with the safe rel when asked to', () => {
        expect(render({ label: 'Docs', href: '/docs' }, false, { openInNewTab: true })).toBe(
            '<a href="/docs" target="_blank" rel="noopener noreferrer" class="orbit-cta orbit-cta--primary">Docs</a>',
        );
    });

    it('renders optional trailing content after the label', () => {
        const trailing = <span aria-hidden="true">→</span>;

        expect(render({ label: 'More', href: '/more', variant: 'link' }, false, { trailing })).toBe(
            '<a href="/more" class="orbit-cta orbit-cta--link">More<span aria-hidden="true">→</span></a>',
        );
        expect(render({ label: 'More', variant: 'link' }, true, { trailing })).toBe(
            '<span class="orbit-cta orbit-cta--link">More<span aria-hidden="true">→</span></span>',
        );
    });

    it('renders nothing without a renderable label', () => {
        expect(renderCtaButton(undefined)).toBeNull();
        expect(renderCtaButton({ label: '   ', href: '/x' })).toBeNull();
    });
});
