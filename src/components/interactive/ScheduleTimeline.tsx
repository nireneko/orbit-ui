import React from 'react';
import type { OrbitComponentContextProps } from '../../types';

export interface ScheduleTimelineEventItem {
    title?: React.ReactNode;
    starts_at?: React.ReactNode;
    location?: React.ReactNode;
}

export interface ScheduleTimelineComponentProps extends OrbitComponentContextProps {
    timezone?: React.ReactNode;
    highlight_current?: boolean;
    events?: ScheduleTimelineEventItem[];
}

export function ScheduleTimeline({
    timezone = 'Europe/Madrid',
    highlight_current = true,
    events = [],
}: ScheduleTimelineComponentProps): React.ReactElement {
    const items = Array.isArray(events) ? events : [];
    const safeTimezoneAttr = typeof timezone === 'string' ? timezone : 'Europe/Madrid';

    return (
        <div
            data-orbit-block="ScheduleTimeline"
            data-orbit-timezone={safeTimezoneAttr}
            className="orbit-container"
        >
            <div className="orbit-card" style={{ padding: '1.75rem' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                    }}
                >
                    <h3 className="orbit-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        Schedule Timeline
                    </h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{timezone}</span>
                </div>

                <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((eventItem, idx) => (
                        <li
                            key={`evt-${idx}`}
                            data-orbit-highlighted={
                                highlight_current && idx === 0 ? 'true' : 'false'
                            }
                            style={{
                                padding: '0.75rem 0',
                                borderTop:
                                    idx > 0
                                        ? 'var(--orbit-border-width) solid var(--orbit-color-border)'
                                        : undefined,
                            }}
                        >
                            <strong style={{ display: 'block' }}>
                                {eventItem.title ?? 'Session'}
                            </strong>
                            <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                                {eventItem.starts_at ?? ''}
                                {eventItem.location ? <> · {eventItem.location}</> : ''}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
