'use client';

import React from 'react';

/**
 * FormGroup - Pembungkus standar untuk label dan input (Satu Pintu)
 */
export function FormGroup({ label, children, required, helperText, error }) {
    return (
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            {label && (
                <label className="form-label" style={{
                    display: 'flex',
                    marginBottom: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--primary-dark)',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {label}
                    {required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
            )}
            {children}
            {helperText && !error && (
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {helperText}
                </small>
            )}
            {error && (
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>
                    {error}
                </small>
            )}
        </div>
    );
}

/**
 * CustomInput - Input text/number standar dengan desain premium
 */
export function TextInput({ label, value, onChange, placeholder, type = 'text', required, icon, ...props }) {
    return (
        <FormGroup label={label} required={required}>
            <div style={{ position: 'relative' }}>
                {icon && (
                    <i className={icon} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem'
                    }}></i>
                )}
                <input
                    type={type}
                    className="form-control"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        paddingLeft: icon ? '38px' : '15px'
                    }}
                    {...props}
                />
            </div>
        </FormGroup>
    );
}

/**
 * CustomSelect - Dropdown standar dengan desain premium
 */
export function SelectInput({ label, value, onChange, options = [], required, placeholder = '-- Pilih --', ...props }) {
    return (
        <FormGroup label={label} required={required}>
            <select
                className="form-control"
                value={value}
                onChange={onChange}
                required={required}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt, idx) => {
                    const val = typeof opt === 'object' ? opt.value : opt;
                    const lab = typeof opt === 'object' ? opt.label : opt;
                    return <option key={idx} value={val}>{lab}</option>;
                })}
            </select>
        </FormGroup>
    );
}

/**
 * CustomTextArea - Textarea standar dengan desain premium
 */
export function TextAreaInput({ label, value, onChange, placeholder, rows = 3, required, ...props }) {
    return (
        <FormGroup label={label} required={required}>
            <textarea
                className="form-control"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                required={required}
                {...props}
            ></textarea>
        </FormGroup>
    );
}
