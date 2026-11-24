import React from 'react';
import type { OrbitComponentContextProps } from '../../types';

export interface CheckInScannerComponentProps extends OrbitComponentContextProps {
    event_id?: React.ReactNode;
    scan_endpoint?: string;
    success_message?: React.ReactNode;
    allow_manual_code?: boolean;
}

export function CheckInScanner({
    event_id = 'default-event',
    success_message = 'Check-in completed successfully.',
    allow_manual_code = true,
    editorMode = false,
}: CheckInScannerComponentProps): React.ReactElement {
    const safeEventIdAttr = typeof event_id === 'string' ? event_id : 'default-event';

    return (
        <div
            data-orbit-block="CheckInScanner"
            data-orbit-event-id={safeEventIdAttr}
            className="orbit-check-in-scanner orbit-container"
        >
            <div className="orbit-check-in-scanner__card orbit-card">
                <h3 className="orbit-check-in-scanner__title orbit-heading">Event Check-In ({event_id})</h3>
                <p className="orbit-check-in-scanner__message">{success_message}</p>
                {allow_manual_code && (
                    <div className="orbit-check-in-scanner__controls">
                        <input
                            type="text"
                            disabled={editorMode}
                            placeholder="Attendee code"
                            aria-label="Attendee code"
                            className="orbit-check-in-scanner__input"
                        />
                        <button type="button" disabled={editorMode} className="orbit-btn-primary">
                            Check in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
