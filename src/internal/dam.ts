const PLACEHOLDER_DAM_ASSET_ID = 'dam_placeholder';

/**
 * Resolves a DAM asset id to a URL: through `resolveAssetUrl` when the host passes one,
 * otherwise through the Control Plane stream endpoint.
 */
export function resolveDamAssetUrl(
    damAssetId: string | undefined,
    resolveAssetUrl?: (damId: string) => string,
): string {
    const id = typeof damAssetId === 'string' && damAssetId.trim() !== ''
        ? damAssetId.trim()
        : PLACEHOLDER_DAM_ASSET_ID;

    if (typeof resolveAssetUrl === 'function') {
        return resolveAssetUrl(id);
    }

    return `/api/v1/dam/assets/${encodeURIComponent(id)}/stream`;
}
