import { DocumentDownloadCenter } from './components/core/DocumentDownloadCenter';
import { Header } from './components/core/Header';
import { HeroBanner } from './components/core/HeroBanner';
import { Image } from './components/core/Image';
import { ImageAndText } from './components/core/ImageAndText';
import { InteractiveSlideshow } from './components/core/InteractiveSlideshow';
import { Link } from './components/core/Link';
import { Text } from './components/core/Text';
import { Youtube } from './components/core/Youtube';
import { FallbackComponent } from './components/FallbackComponent';
import { CheckInScanner } from './components/interactive/CheckInScanner';
import { ScheduleTimeline } from './components/interactive/ScheduleTimeline';
import { UserFavoriteTracker } from './components/interactive/UserFavoriteTracker';
import { ClinicalStudyCardGrid } from './components/pharma/ClinicalStudyCardGrid';
import { MedicalInquiryForm } from './components/pharma/MedicalInquiryForm';
import { RestrictedVideoPlayer } from './components/pharma/RestrictedVideoPlayer';
import type { OrbitComponentRenderer } from './types';

export const orbitComponentRenderers: Record<string, OrbitComponentRenderer<any>> = {
    Header,
    HeroBanner,
    ImageAndText,
    Text,
    Link,
    Image,
    Youtube,
    DocumentDownloadCenter,
    InteractiveSlideshow,
    RestrictedVideoPlayer,
    ClinicalStudyCardGrid,
    MedicalInquiryForm,
    UserFavoriteTracker,
    CheckInScanner,
    ScheduleTimeline,
};

export const ORBIT_COMPONENT_NAMES = Object.freeze(
    Object.keys(orbitComponentRenderers),
);

export const ORBIT_INTERACTIVE_COMPONENT_NAMES = Object.freeze([
    'InteractiveSlideshow',
    'MedicalInquiryForm',
    'UserFavoriteTracker',
    'CheckInScanner',
    'ScheduleTimeline',
]);

export function resolveOrbitComponentRenderer(
    componentName: string,
): OrbitComponentRenderer<any> {
    return orbitComponentRenderers[componentName] ?? FallbackComponent;
}
