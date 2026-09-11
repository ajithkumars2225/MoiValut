import React, { useState, useRef, useEffect } from 'react';
import { Columns, Check, Eye, EyeOff, RotateCcw } from 'lucide-react';

export const ColumnToggleDropdown = ({ columns, visibleColumns, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (id) => {
        // Don't hide if it's the last visible non-actions column
        const currentVisibleCount = Object.keys(visibleColumns).filter(k => visibleColumns[k] && k !== 'actions').length;
        if (visibleColumns[id] && currentVisibleCount <= 1 && id !== 'actions') {
            return;
        }

        const updated = {
            ...visibleColumns,
            [id]: !visibleColumns[id]
        };
        onChange(updated);
    };

    const showAll = () => {
        const updated = {};
        columns.forEach(col => {
            updated[col.id] = true;
        });
        onChange(updated);
    };

    const resetDefault = () => {
        const updated = {};
        columns.forEach(col => {
            updated[col.id] = col.defaultVisible !== false;
        });
        onChange(updated);
    };

    const visibleCount = columns.filter(col => visibleColumns[col.id] !== false).length;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
                type="button"
                className={`modern-btn btn-export-excel ${isOpen ? 'active-filter' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    background: 'rgba(139, 92, 246, 0.08)',
                    color: '#A78BFA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                }}
                title="Show / Hide Table Columns (பத்திகள் தெரிக)"
            >
                <Columns size={15} />
                <span>Columns ({visibleCount}/{columns.length})</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        zIndex: 999,
                        width: '240px',
                        background: 'var(--card-bg, #1E1B4B)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--border-color, rgba(139, 92, 246, 0.25))',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-main, #E2E8F0)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '0.6rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #F8FAFC)' }}>
                            Table Columns (பத்திகள்)
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '240px', overflowY: 'auto' }}>
                        {columns.map(col => {
                            const isVisible = visibleColumns[col.id] !== false;
                            return (
                                <label
                                    key={col.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.4rem 0.55rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        background: isVisible ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                                        transition: 'background 0.15s ease'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={() => toggleColumn(col.id)}
                                            style={{ cursor: 'pointer', accentColor: '#8B5CF6' }}
                                        />
                                        <span>{col.labelEn}</span>
                                    </span>
                                    {col.labelTa && (
                                        <span style={{ fontSize: '0.72rem', opacity: 0.6, marginLeft: '0.4rem' }}>
                                            {col.labelTa}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', pt: '0.5rem', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                        <button
                            type="button"
                            onClick={showAll}
                            style={{
                                flex: 1,
                                padding: '0.28rem 0.4rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-main, #E2E8F0)',
                                cursor: 'pointer'
                            }}
                        >
                            Show All
                        </button>
                        <button
                            type="button"
                            onClick={resetDefault}
                            style={{
                                flex: 1,
                                padding: '0.28rem 0.4rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-main, #E2E8F0)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.2rem'
                            }}
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
