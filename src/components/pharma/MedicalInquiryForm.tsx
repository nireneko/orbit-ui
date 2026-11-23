import React from 'react';
import type { OrbitComponentContextProps } from '../../types';

export interface MedicalInquiryFieldItem {
    name?: string;
    label?: React.ReactNode;
    type?: string;
    required?: boolean;
}

export interface MedicalInquiryFormComponentProps extends OrbitComponentContextProps {
    inquiry_type?: string;
    submit_endpoint?: string;
    pharmacovigilance_banner?: {
        show_mandatory_warning?: boolean;
        text?: React.ReactNode;
    };
    fields?: MedicalInquiryFieldItem[];
}

export function MedicalInquiryForm({
    inquiry_type = 'MEDICAL_INFORMATION',
    submit_endpoint = '#',
    pharmacovigilance_banner,
    fields = [],
    editorMode = false,
}: MedicalInquiryFormComponentProps): React.ReactElement {
    const formFields = Array.isArray(fields) ? fields : [];

    return (
        <div
            data-orbit-block="MedicalInquiryForm"
            data-orbit-inquiry-type={inquiry_type}
            className="orbit-container"
        >
            <div className="orbit-card" style={{ padding: '2rem' }}>
                {pharmacovigilance_banner?.show_mandatory_warning && (
                    <div
                        role="note"
                        style={{
                            padding: '0.75rem 1rem',
                            marginBottom: '1.25rem',
                            border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                            borderRadius: 'var(--orbit-radius-base)',
                            fontSize: '0.875rem',
                        }}
                    >
                        {pharmacovigilance_banner.text}
                    </div>
                )}

                <form
                    action={editorMode ? undefined : submit_endpoint}
                    onSubmit={editorMode ? (event) => event.preventDefault() : undefined}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                    {formFields.map((field, idx) => {
                        const fieldId = `med-inquiry-${field.name ?? idx}`;
                        return (
                            <div
                                key={fieldId}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                            >
                                <label htmlFor={fieldId} style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                    {field.label ?? field.name ?? 'Field'}
                                    {field.required ? ' *' : ''}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        id={fieldId}
                                        name={field.name}
                                        disabled={editorMode}
                                        required={Boolean(field.required)}
                                        rows={3}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: 'var(--orbit-radius-base)',
                                            border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                                        }}
                                    />
                                ) : (
                                    <input
                                        id={fieldId}
                                        name={field.name}
                                        type={field.type ?? 'text'}
                                        disabled={editorMode}
                                        required={Boolean(field.required)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: 'var(--orbit-radius-base)',
                                            border: 'var(--orbit-border-width) solid var(--orbit-color-border)',
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <div>
                        <button type="submit" disabled={editorMode} className="orbit-btn-primary">
                            Submit inquiry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
