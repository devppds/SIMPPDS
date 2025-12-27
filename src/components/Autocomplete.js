'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function Autocomplete({
    options,
    value,
    onChange,
    placeholder = "Cari...",
    required = false,
    onSelect,
    labelKey = "nama_siswa",
    subLabelKey = "stambuk_pondok",
    extraKey = "kamar"
}) {
    const [show, setShow] = useState(false);
    const [filtered, setFiltered] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!value) {
            setFiltered([]);
            return;
        }
        const lower = value.toLowerCase();
        const matches = (options || []).filter(s =>
            (s[labelKey] || '').toLowerCase().includes(lower) ||
            (s[subLabelKey] || '').toLowerCase().includes(lower)
        ).slice(0, 30);
        setFiltered(matches);
    }, [value, options, labelKey, subLabelKey]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShow(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                type="text"
                className="form-control"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShow(true);
                }}
                onFocus={() => setShow(true)}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
            />
            {show && value && (
                <div className="custom-autocomplete-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    zIndex: 20000,
                    marginTop: '5px'
                }}>
                    {filtered.length > 0 ? (
                        filtered.map((s, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    onSelect(s);
                                    setShow(false);
                                }}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{s[labelKey]}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{s[subLabelKey] || '-'}</span>
                                </div>
                                {s[extraKey] && (
                                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '50px', fontWeight: 800 }}>
                                        {s[extraKey]}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '15px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Data tidak ditemukan
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
