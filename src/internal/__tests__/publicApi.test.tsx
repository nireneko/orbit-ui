// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as publicApi from '../../index';
import type { CtaProps, HeaderComponentProps } from '../../index';
import { renderCtaButton } from '../cta';
import { renderInlineDamTrigger } from '../InlineDamTrigger';
import { resolveDamAssetUrl } from '../dam';

// Runtime exports of src/index.ts in v0.3.0. The type-only exports are checked by `npm run build`.
const V0_3_0_RUNTIME_EXPORTS = [
    'CheckInScanner',
    'ClinicalStudyCardGrid',
    'DocumentDownloadCenter',
    'FallbackComponent',
    'Header',
    'HeroBanner',
    'Image',
    'ImageAndText',
    'InteractiveSlideshow',
    'Link',
    'MedicalInquiryForm',
    'ORBIT_COMPONENT_NAMES',
    'ORBIT_INTERACTIVE_COMPONENT_NAMES',
    'RestrictedVideoPlayer',
    'ScheduleTimeline',
    'SectionWrapper',
    'Text',
    'ThemeShell',
    'UserFavoriteTracker',
    'Youtube',
    'orbitComponentRenderers',
    'renderCtaButton',
    'renderInlineDamTrigger',
    'resolveDamAssetUrl',
    'resolveOrbitComponentRenderer',
];

describe('public API', () => {
    it('exports the same runtime names as v0.3.0', () => {
        expect(Object.keys(publicApi).sort()).toEqual([...V0_3_0_RUNTIME_EXPORTS].sort());
    });

    it('re-exports the shared helpers from src/internal', () => {
        expect(publicApi.renderCtaButton).toBe(renderCtaButton);
        expect(publicApi.renderInlineDamTrigger).toBe(renderInlineDamTrigger);
        expect(publicApi.resolveDamAssetUrl).toBe(resolveDamAssetUrl);
    });

    it('keeps the CtaProps and HeaderComponentProps type exports', () => {
        const cta: CtaProps = { label: 'Contact', href: '/contact', variant: 'link' };
        const header: HeaderComponentProps = { cta };

        expect(header.cta).toBe(cta);
    });
});
