// @vitest-environment node
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FallbackComponent } from '../FallbackComponent';
import {
    ORBIT_COMPONENT_NAMES,
    orbitComponentRenderers,
    resolveOrbitComponentRenderer,
} from '../../registry';

describe('@orbit/ui 15 Component Catalog SSR Rendering', () => {
    const defaultPropsByComponent: Record<string, Record<string, unknown>> = {
        Header: {
            brand_text: 'Company Name',
            logo: {
                dam_asset_id: 'dam_default_logo',
                alt_text: 'Company logo.',
                href: 'hub://home',
            },
            navigation: [{ label: 'Home', href: 'hub://home' }],
            cta: { label: 'Contact', href: 'hub://contact', variant: 'link' },
            sticky: false,
        },
        HeroBanner: {
            title: 'Nuevo Banner Principal',
            subtitle: 'Descripción del banner informativo.',
            alignment: 'left',
            dam_background_asset_id: 'dam_default_placeholder',
            cta: {
                label: 'Más Información',
                href: 'hub://home',
                variant: 'primary_button',
            },
        },
        ImageAndText: {
            dam_asset_id: 'dam_default_image',
            alt_text: 'Descriptive placeholder for accessibility.',
            heading: 'Section heading',
            body: 'Neutral placeholder body text ready to be edited.',
            image_position: 'left',
            background_variant: 'default',
            cta: {
                label: 'Learn more',
                href: 'hub://home',
                variant: 'primary_button',
            },
        },
        Text: {
            heading: 'Section heading',
            body: 'Neutral placeholder body text ready to be edited.',
            alignment: 'left',
            tone: 'default',
        },
        Link: {
            label: 'Learn more',
            href: 'hub://home',
            variant: 'link',
            open_in_new_tab: false,
            icon: 'arrow-right',
            alignment: 'left',
        },
        Image: {
            dam_asset_id: 'dam_default_image',
            alt_text: 'Descriptive placeholder for accessibility.',
            caption: 'Image caption.',
            href: 'hub://home',
            open_in_new_tab: false,
            aspect_ratio: '16:9',
        },
        Youtube: {
            dam_asset_id: 'dam_default_youtube',
            title: 'YouTube video',
            caption: 'Video caption.',
            aspect_ratio: '16:9',
            start_seconds: 0,
            privacy_mode: true,
            allow_fullscreen: true,
        },
        DocumentDownloadCenter: {
            category: 'General Documents',
            documents: [
                {
                    dam_asset_id: 'dam_default_document',
                    title: 'Reference Document',
                    file_size: '1.2 MB',
                    format: 'PDF',
                    download_url: '/documents/reference-document.pdf',
                },
            ],
        },
        InteractiveSlideshow: {
            autoplay: false,
            autoplay_interval_seconds: 5,
            aria_live_mode: 'polite',
            slides: [
                {
                    dam_asset_id: 'dam_default_slide',
                    alt_text: 'Descriptive placeholder for accessibility.',
                    caption: 'Slide caption.',
                },
            ],
        },
        RestrictedVideoPlayer: {
            provider: 'vimeo_enterprise',
            vimeo_video_id: '123456789',
            title: 'Restricted medical training',
            duration_minutes: 12,
            disclaimer_text: 'Exclusive content for verified healthcare professionals.',
            fallback_unauthorized: {
                message: 'Verify your healthcare professional status to access this content.',
                login_cta_label: 'Sign in',
            },
        },
        ClinicalStudyCardGrid: {
            columns: 3,
            items: [
                {
                    dam_asset_id: 'dam_clinical_study_01',
                    badge: 'Fase III',
                    title: 'Clinical Trial Results',
                    description: 'Multicenter randomized trial summary.',
                    link_uri: 'hub://studies/trial-01',
                },
            ],
        },
        MedicalInquiryForm: {
            inquiry_type: 'MEDICAL_INFORMATION',
            submit_endpoint: 'hub://pharma/medical-inquiry',
            pharmacovigilance_banner: {
                show_mandatory_warning: true,
                text: 'To report adverse events, contact pharmacovigilance or your healthcare professional.',
            },
            fields: [
                { name: 'fullname', label: 'Full name', type: 'text', required: true },
                { name: 'email', label: 'Email address', type: 'email', required: true },
            ],
        },
        UserFavoriteTracker: {
            target_type: 'PAGE',
            target_id: 'default-page',
            toggle_endpoint: 'hub://favorites/toggle',
            require_auth: true,
        },
        CheckInScanner: {
            event_id: 'default-event',
            scan_endpoint: 'hub://check-in/scan',
            success_message: 'Check-in completed successfully.',
            allow_manual_code: true,
        },
        ScheduleTimeline: {
            timezone: 'Europe/Madrid',
            highlight_current: true,
            events: [
                {
                    title: 'Kick-off session',
                    starts_at: '2026-01-01T09:00:00+00:00',
                    location: 'Main auditorium',
                },
            ],
        },
    };

    it('registers all 15 canonical HubComponentInterface names in orbitComponentRenderers', () => {
        expect(ORBIT_COMPONENT_NAMES).toHaveLength(15);
        for (const name of Object.keys(defaultPropsByComponent)) {
            expect(orbitComponentRenderers[name]).toBeTypeOf('function');
        }
    });

    it('renders every registered component via renderToStaticMarkup in both editorMode=true and editorMode=false', () => {
        const resolveAssetUrl = (damId: string): string => `/api/v1/dam/assets/${damId}/stream`;
        const resolveExternalReference = (damId: string): string | undefined =>
            damId === 'dam_default_youtube' ? 'dQw4w9WgXcQ' : undefined;

        for (const [componentName, defaultProps] of Object.entries(defaultPropsByComponent)) {
            const Renderer = resolveOrbitComponentRenderer(componentName);

            for (const editorMode of [true, false]) {
                const html = renderToStaticMarkup(
                    React.createElement(Renderer, {
                        ...defaultProps,
                        editorMode,
                        siteTheme: 'CLINICAL',
                        resolveAssetUrl,
                        resolveExternalReference,
                    }),
                );

                expect(html.length).toBeGreaterThan(20);
                expect(html).toContain(`data-orbit-block="${componentName}"`);
            }
        }
    });

    it('renders Youtube placeholder in editorMode by default and iframe from DAM external reference when showMediaPreview is true', () => {
        const YoutubeRenderer = resolveOrbitComponentRenderer('Youtube');
        const resolveExternalReference = (damId: string): string | undefined =>
            damId === '019a0000-0000-7000-8000-000000000001' ? 'dQw4w9WgXcQ' : undefined;

        const placeholderHtml = renderToStaticMarkup(
            React.createElement(YoutubeRenderer, {
                ...defaultPropsByComponent.Youtube,
                dam_asset_id: '019a0000-0000-7000-8000-000000000001',
                editorMode: true,
                showMediaPreview: false,
                resolveExternalReference,
            }),
        );
        expect(placeholderHtml).not.toContain('<iframe');
        expect(placeholderHtml).toContain('YouTube (019a0000-0000-7000-8000-000000000001)');

        const previewHtml = renderToStaticMarkup(
            React.createElement(YoutubeRenderer, {
                ...defaultPropsByComponent.Youtube,
                dam_asset_id: '019a0000-0000-7000-8000-000000000001',
                editorMode: true,
                showMediaPreview: true,
                resolveExternalReference,
            }),
        );
        expect(previewHtml).toContain('<iframe');
        expect(previewHtml).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(previewHtml).toContain('orbit-youtube__iframe--inert');

        const unresolvedEditorHtml = renderToStaticMarkup(
            React.createElement(YoutubeRenderer, {
                ...defaultPropsByComponent.Youtube,
                dam_asset_id: 'dam_default_youtube',
                editorMode: true,
                showMediaPreview: true,
                resolveExternalReference,
            }),
        );
        expect(unresolvedEditorHtml).not.toContain('<iframe');
        expect(unresolvedEditorHtml).toContain('YouTube (dam_default_youtube)');

        const publicUnresolvedHtml = renderToStaticMarkup(
            React.createElement(YoutubeRenderer, {
                ...defaultPropsByComponent.Youtube,
                dam_asset_id: 'dam_unapproved',
                editorMode: false,
                resolveExternalReference,
            }),
        );
        expect(publicUnresolvedHtml).toBe('');
    });

    it('returns FallbackComponent for unknown or deprecated legacy component names', () => {
        const UnknownRenderer = resolveOrbitComponentRenderer('LegacyCarouselV0');
        expect(UnknownRenderer).toBe(FallbackComponent);

        const html = renderToStaticMarkup(
            React.createElement(UnknownRenderer, {
                componentName: 'LegacyCarouselV0',
                editorMode: true,
            }),
        );

        expect(html).toContain('LegacyCarouselV0');
        expect(html).toContain('data-orbit-block="FallbackComponent"');
    });
});
