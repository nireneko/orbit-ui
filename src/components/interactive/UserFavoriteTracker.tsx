import React, { useState } from 'react';
import type { OrbitComponentContextProps } from '../../types';

export interface UserFavoriteTrackerComponentProps extends OrbitComponentContextProps {
    target_type?: 'PAGE' | 'DOCUMENT' | 'VIDEO' | string;
    target_id?: React.ReactNode;
    toggle_endpoint?: string;
    require_auth?: boolean;
}

export function UserFavoriteTracker({
    target_type = 'PAGE',
    target_id = 'default-page',
    require_auth = true,
    editorMode = false,
}: UserFavoriteTrackerComponentProps): React.ReactElement {
    const [favorited, setFavorited] = useState(false);
    const safeTargetIdAttr = typeof target_id === 'string' ? target_id : 'default-page';

    return (
        <div
            data-orbit-block="UserFavoriteTracker"
            data-orbit-target-type={target_type}
            data-orbit-target-id={safeTargetIdAttr}
            className="orbit-container"
        >
            <div
                className="orbit-card"
                style={{
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <strong style={{ display: 'block' }}>
                        Bookmark ({target_type}: {target_id})
                    </strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                        {require_auth ? 'Requires authenticated user' : 'Public bookmark'}
                    </span>
                </div>
                <button
                    type="button"
                    className={favorited ? 'orbit-btn-primary' : 'orbit-btn-secondary'}
                    onClick={() => {
                        if (!editorMode) {
                            setFavorited((prev) => !prev);
                        }
                    }}
                >
                    {favorited ? 'Saved' : 'Save to favorites'}
                </button>
            </div>
        </div>
    );
}
