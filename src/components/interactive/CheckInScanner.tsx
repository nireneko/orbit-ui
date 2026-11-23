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
            className="orbit-container"
        >
            <div className="orbit-card" style={{ padding: '1.75rem' }}>
                <h3
                    className="orbit-heading"
                    style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}
                >
                    Event Check-In ({event_id})
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                    {success_message}
                </p>
                {allow_manual_code && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            disabled={editorMode}
                            placeholder="Attendee code"
                            aria-label="Attendee code"
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--orbit-radius-base)',
                                border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                            }}
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
