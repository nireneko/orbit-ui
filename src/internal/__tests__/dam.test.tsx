// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { isRenderableContent } from '../content';
import { resolveDamAssetUrl } from '../dam';

describe('resolveDamAssetUrl', () => {
    it('uses resolveAssetUrl when it is given, with the trimmed id', () => {
        const resolveAssetUrl = vi.fn((id: string) => `https://cdn.test/${id}`);

        expect(resolveDamAssetUrl('  dam_1  ', resolveAssetUrl)).toBe('https://cdn.test/dam_1');
        expect(resolveAssetUrl).toHaveBeenCalledWith('dam_1');
    });

    it('falls back to the stream endpoint with an encoded id', () => {
        expect(resolveDamAssetUrl('dam 1/x')).toBe('/api/v1/dam/assets/dam%201%2Fx/stream');
    });

    it('uses the placeholder id when the id is missing or blank', () => {
        expect(resolveDamAssetUrl(undefined)).toBe('/api/v1/dam/assets/dam_placeholder/stream');
        expect(resolveDamAssetUrl('   ')).toBe('/api/v1/dam/assets/dam_placeholder/stream');
    });
});

describe('isRenderableContent', () => {
    it.each([
        [null, false],
        [undefined, false],
        [true, false],
        [false, false],
        ['', false],
        ['   ', false],
        ['text', true],
        [0, true],
    ])('treats %s as renderable: %s', (value, expected) => {
        expect(isRenderableContent(value)).toBe(expected);
    });
});
