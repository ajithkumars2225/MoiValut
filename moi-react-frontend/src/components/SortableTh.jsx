import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export const SortableTh = ({
    field,
    sortField,
    sortDirection,
    onSort,
    labelEn,
    labelTa,
    className = '',
    align = 'left',
    style = {}
}) => {
    const isSorted = sortField === field;

    const handleClick = () => {
        if (!isSorted) {
            onSort(field, 'asc');
        } else if (sortDirection === 'asc') {
            onSort(field, 'desc');
        } else {
            onSort(field, 'asc');
        }
    };

    const justifyStyle = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

    return (
        <th
            className={`sortable-th ${isSorted ? 'sorted-th' : ''} ${className}`}
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                userSelect: 'none',
                verticalAlign: 'middle',
                padding: '0.65rem 0.9rem',
                ...style
            }}
            title={`Sort by ${labelEn} (${isSorted ? (sortDirection === 'asc' ? 'Click for Descending' : 'Click for Ascending') : 'Click to Sort'})`}
        >
            <div className={`th-sort-wrapper align-${align}`} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: justifyStyle, width: '100%' }}>
                <div className="th-bilingual-stacked" style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start', lineHeight: 1.25 }}>
                    <span className="th-label-en">{labelEn}</span>
                    {labelTa && <span className="th-label-ta">{labelTa}</span>}
                </div>
                <span className={`sort-icon-indicator ${isSorted ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', opacity: isSorted ? 1 : 0.35, flexShrink: 0 }}>
                    {isSorted ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} style={{ color: '#A78BFA' }} /> : <ArrowDown size={13} style={{ color: '#A78BFA' }} />
                    ) : (
                        <ArrowUpDown size={12} />
                    )}
                </span>
            </div>
        </th>
    );
};
