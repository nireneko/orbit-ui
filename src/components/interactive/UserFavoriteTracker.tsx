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
            className="orbit-user-favorite-tracker orbit-container"
        >
            <div className="orbit-user-favorite-tracker__card orbit-card">
                <div className="orbit-user-favorite-tracker__body">
                    <strong className="orbit-user-favorite-tracker__label">
                        Bookmark ({target_type}: {target_id})
                    </strong>
                    <span className="orbit-user-favorite-tracker__hint">
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
