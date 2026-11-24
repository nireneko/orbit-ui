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
            className="orbit-schedule-timeline orbit-container"
        >
            <div className="orbit-schedule-timeline__card orbit-card">
                <div className="orbit-schedule-timeline__header">
                    <h3 className="orbit-schedule-timeline__title orbit-heading">Schedule Timeline</h3>
                    <span className="orbit-schedule-timeline__timezone">{timezone}</span>
                </div>

                <ol className="orbit-schedule-timeline__list">
                    {items.map((eventItem, idx) => (
                        <li
                            key={`evt-${idx}`}
                            data-orbit-highlighted={highlight_current && idx === 0 ? 'true' : 'false'}
                            className="orbit-schedule-timeline__item"
                        >
                            <strong className="orbit-schedule-timeline__session">
                                {eventItem.title ?? 'Session'}
                            </strong>
                            <span className="orbit-schedule-timeline__meta">
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
