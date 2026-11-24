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

const BLOCK = 'orbit-medical-inquiry-form';
const FIELD_ID_PREFIX = 'med-inquiry-';
const TEXTAREA_TYPE = 'textarea';
const DEFAULT_INPUT_TYPE = 'text';
const DEFAULT_FIELD_LABEL = 'Field';
const REQUIRED_MARKER = ' *';
const SUBMIT_LABEL = 'Submit inquiry';
const TEXTAREA_ROWS = 3;

/**
 * Medical information / adverse event inquiry form. It is hydrated in Astro, so the
 * render depends only on its props (no browser state, dates or random values).
 * In `editorMode` the controls are disabled and the form never submits.
 */
export function MedicalInquiryForm({
    inquiry_type = 'MEDICAL_INFORMATION',
    submit_endpoint = '#',
    pharmacovigilance_banner,
    fields = [],
    editorMode = false,
}: MedicalInquiryFormComponentProps): React.ReactElement {
    const formFields = Array.isArray(fields) ? fields : [];

    return (
        <div data-orbit-block="MedicalInquiryForm" data-orbit-inquiry-type={inquiry_type} className={BLOCK}>
            <div className={`${BLOCK}__inner`}>
                <div className={`${BLOCK}__card`}>
                    {pharmacovigilance_banner?.show_mandatory_warning && (
                        <div role="note" className={`${BLOCK}__banner`}>
                            {pharmacovigilance_banner.text}
                        </div>
                    )}

                    <form
                        action={editorMode ? undefined : submit_endpoint}
                        onSubmit={editorMode ? (event) => event.preventDefault() : undefined}
                        className={`${BLOCK}__form`}
                    >
                        {formFields.map((field, idx) => {
                            const fieldId = `${FIELD_ID_PREFIX}${field.name ?? idx}`;
                            return (
                                <div key={fieldId} className={`${BLOCK}__field`}>
                                    <label htmlFor={fieldId} className={`${BLOCK}__label`}>
                                        {field.label ?? field.name ?? DEFAULT_FIELD_LABEL}
                                        {field.required ? REQUIRED_MARKER : ''}
                                    </label>
                                    {field.type === TEXTAREA_TYPE ? (
                                        <textarea
                                            id={fieldId}
                                            name={field.name}
                                            disabled={editorMode}
                                            required={Boolean(field.required)}
                                            rows={TEXTAREA_ROWS}
                                            className={`${BLOCK}__control ${BLOCK}__control--textarea`}
                                        />
                                    ) : (
                                        <input
                                            id={fieldId}
                                            name={field.name}
                                            type={field.type ?? DEFAULT_INPUT_TYPE}
                                            disabled={editorMode}
                                            required={Boolean(field.required)}
                                            className={`${BLOCK}__control`}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <div className={`${BLOCK}__footer`}>
                            <button type="submit" disabled={editorMode} className={`${BLOCK}__submit`}>
                                {SUBMIT_LABEL}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
