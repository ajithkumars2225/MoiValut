import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    HelpCircle,
    Trash2,
    Filter,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    FileSpreadsheet,
    Printer,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Search,
    X,
    Calendar,
    User,
    Eye,
    ShieldCheck,
} from 'lucide-react';

const STATUS_CONFIG = {
    Matched: {
        icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.15)',
        border: 'rgba(16,185,129,0.35)', label: '✅ Matched', tamLabel: 'சரியான திருப்பம்'
    },
    Short: {
        icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',
        border: 'rgba(245,158,11,0.35)', label: '⚠️ Short', tamLabel: 'குறைவான திருப்பம்'
    },
    Excess: {
        icon: AlertCircle, color: '#F43F5E', bg: 'rgba(244,63,94,0.15)',
        border: 'rgba(244,63,94,0.35)', label: '🔺 Excess', tamLabel: 'அதிக திருப்பம்'
    },
    NoPreviousRecord: {
        icon: HelpCircle, color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)',
        border: 'rgba(156,163,175,0.2)', label: '❓ No Record', tamLabel: 'பழைய பதிவு இல்லை'
    },
};

// ── SAFE VALUE EXTRACTOR HELPERS (Prevents NaN) ─────────────────────────────
const getPrevReturn = (r) => {
    const val = r.ourGivenAmount ?? r.ourPrevGivenAmount ?? 0;
    return isNaN(Number(val)) ? 0 : Number(val);
};

const getLedgerAmount = (r) => {
    const val = r.theirTotalGiftAmount ?? r.theirCurrentAmount ?? 0;
    return isNaN(Number(val)) ? 0 : Number(val);
};

const getDifference = (r) => {
    if (r.difference !== undefined && !isNaN(Number(r.difference))) {
        return Number(r.difference);
    }
    return getPrevReturn(r) - getLedgerAmount(r);
};

// ── DETAIL POPUP MODAL COMPONENT ─────────────────────────────────────────────
const ConflictDetailModal = ({ record, onClose, onDelete, canDelete = true }) => {
    if (!record) return null;

    const cfg = STATUS_CONFIG[record.conflictStatus] || STATUS_CONFIG.NoPreviousRecord;
    const prevReturn   = getPrevReturn(record);
    const ledgerAmount = getLedgerAmount(record);
    const diff         = getDifference(record);

    return (
        <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '640px', width: '92%' }}>

                {/* Header */}
                <div className="hyper-header purple-theme" style={{ padding: '1.2rem 1.4rem' }}>
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple" style={{ width: 44, height: 44 }}>
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                CONFLICT AUDIT DETAIL (முரண்பாடு விவர அறிக்கை)
                            </span>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: '#FFF' }}>
                                {record.recipientName}
                            </h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose} style={{ width: 34, height: 34 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="hyper-body" style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                    {/* Status Alert Banner */}
                    <div style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        borderRadius: '12px', padding: '1rem 1.1rem',
                        display: 'flex', alignItems: 'flex-start', gap: '0.8rem',
                        boxShadow: `0 4px 20px ${cfg.border}`
                    }}>
                        <cfg.icon size={22} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: cfg.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{cfg.label}</span>
                                <span style={{ fontFamily: 'var(--font-tamil)', fontSize: '0.82rem', opacity: 0.9 }}>({cfg.tamLabel})</span>
                            </div>
                            <p style={{ fontSize: '0.83rem', color: '#F3F4F6', marginTop: '0.4rem', lineHeight: 1.6, margin: 0 }}>
                                {record.conflictNote || 'No conflict details recorded.'}
                            </p>
                        </div>
                    </div>

                    {/* 3-Column Info Cards (PROPERLY ALIGNED GRID) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>

                        {/* Card 1: Person & Village */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                                <User size={13} style={{ color: '#A78BFA' }} /> Recipient Name & Village
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {record.recipientName}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#A78BFA', marginTop: 3, display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <MapPin size={12} /> {record.village || 'No village specified'}
                            </div>
                        </div>

                        {/* Card 2: Given Gift Ledger Amount */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 4, fontWeight: 600 }}>
                                Ledger (நாம் போட்ட தொகை)
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#FBBF24', letterSpacing: '-0.3px' }}>
                                ₹ {ledgerAmount.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2, fontWeight: 500 }}>
                                Record Given Gift total
                            </div>
                        </div>

                        {/* Card 3: Prev Return Amount */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 4, fontWeight: 600 }}>
                                Return (அவர்கள் திரும்பிச் செய்தது)
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#A78BFA', letterSpacing: '-0.3px' }}>
                                ₹ {prevReturn.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2, fontWeight: 500 }}>
                                Entered return value
                            </div>
                        </div>
                    </div>

                    {/* Difference Banner */}
                    <div style={{
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '0.85rem 1.2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 700 }}>
                                Difference (வித்தியாசம்):
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                (Prev Return − Ledger Amount)
                            </span>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: cfg.color, letterSpacing: '-0.4px' }}>
                            {diff >= 0 ? '+' : ''}₹ {diff.toLocaleString('en-IN')}
                        </span>
                    </div>

                    {/* Footer Audit Metadata */}
                    <div style={{
                        fontSize: '0.75rem', color: '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.2rem 0.2rem 0 0.2rem'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} style={{ color: '#9CA3AF' }} /> Checked At:{' '}
                            <strong style={{ color: '#D1D5DB' }}>{new Date(record.checkedAt).toLocaleString('en-IN')}</strong>
                        </span>
                        <span style={{ color: '#9CA3AF', fontWeight: 600 }}>Record ID: #{record.id}</span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="hyper-footer" style={{ padding: '1rem 1.4rem', justifyContent: 'space-between', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {canDelete ? (
                        <button
                            type="button"
                            style={{
                                background: 'rgba(244,63,94,0.15)', color: '#FB7185',
                                border: '1px solid rgba(244,63,94,0.35)', padding: '0.55rem 1.1rem',
                                borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                transition: 'all 0.2s',
                            }}
                            onClick={() => { onDelete(record.id); onClose(); }}
                        >
                            <Trash2 size={15} /> Delete Record
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        type="button"
                        className="hyper-btn btn-purple-neon"
                        onClick={onClose}
                        style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        Close Detail
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── MAIN VIEW COMPONENT ───────────────────────────────────────────────────────
export const ConflictRecordsView = ({ conflictRecords, onDeleteConflict, privileges }) => {
    const canDelete = !privileges || privileges.delete === true;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Selected record for detail modal
    const [selectedRecord, setSelectedRecord] = useState(null);

    // KPI Summary
    const kpis = useMemo(() => {
        const matched  = conflictRecords.filter(r => r.conflictStatus === 'Matched').length;
        const short    = conflictRecords.filter(r => r.conflictStatus === 'Short').length;
        const excess   = conflictRecords.filter(r => r.conflictStatus === 'Excess').length;
        const noRecord = conflictRecords.filter(r => r.conflictStatus === 'NoPreviousRecord').length;
        return { matched, short, excess, noRecord, total: conflictRecords.length };
    }, [conflictRecords]);

    const filteredRecords = useMemo(() => {
        return conflictRecords.filter(r => {
            const q = searchQuery.toLowerCase().trim();
            if (q) {
                const matchName    = r.recipientName?.toLowerCase().includes(q);
                const matchVillage = r.village?.toLowerCase().includes(q);
                const matchNote    = r.conflictNote?.toLowerCase().includes(q);
                if (!matchName && !matchVillage && !matchNote) return false;
            }
            if (statusFilter !== 'all' && r.conflictStatus !== statusFilter) return false;
            return true;
        });
    }, [conflictRecords, searchQuery, statusFilter]);

    const totalPages       = Math.ceil(filteredRecords.length / pageSize) || 1;
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleExportExcel = () => {
        if (filteredRecords.length === 0) { window.customAlert('No records to export.'); return; }
        const data = filteredRecords.map((r, idx) => {
            const prevReturn   = getPrevReturn(r);
            const ledgerAmount = getLedgerAmount(r);
            const diff         = getDifference(r);
            return {
                '#': idx + 1,
                'Recipient Name (பெயர்)': r.recipientName,
                'Village (ஊர்)': r.village || '-',
                'Conflict Status': r.conflictStatus,
                'Given Gift Ledger Amount (₹)': ledgerAmount,
                'Prev Return Entered (₹)': prevReturn,
                'Difference (₹)': diff,
                'Conflict Note': r.conflictNote || '-',
                'Checked At': new Date(r.checkedAt).toLocaleString('en-IN'),
            };
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Conflict_Records');
        XLSX.writeFile(wb, `Conflict_Records_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportPDF = () => {
        if (filteredRecords.length === 0) { window.customAlert('No records to export.'); return; }
        const rowsHtml = filteredRecords.map((r, idx) => {
            const cfg          = STATUS_CONFIG[r.conflictStatus] || STATUS_CONFIG.NoPreviousRecord;
            const prevReturn   = getPrevReturn(r);
            const ledgerAmount = getLedgerAmount(r);
            const diff         = getDifference(r);

            return `
                <tr>
                    <td style="padding:6px;border:1px solid #E5E7EB;text-align:center;font-size:11px;">${idx + 1}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-weight:bold;font-size:12px;">${r.recipientName}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;">${r.village || '-'}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;color:${cfg.color};font-weight:700;">${cfg.label}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;text-align:right;font-size:11px;">₹ ${ledgerAmount.toLocaleString('en-IN')}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;text-align:right;font-size:11px;font-weight:bold;">₹ ${prevReturn.toLocaleString('en-IN')}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;text-align:right;font-size:11px;">${(diff >= 0 ? '+' : '')}₹ ${diff.toLocaleString('en-IN')}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:10px;color:#6B7280;">${new Date(r.checkedAt).toLocaleDateString('en-IN')}</td>
                </tr>
            `;
        }).join('');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html><html><head><title>Conflict Records Report</title>
            <style>
                @page{size:A4 landscape;margin:12mm}
                body{font-family:'Segoe UI',sans-serif;color:#111827}
                h2{color:#8B5CF6;margin:0 0 4px}
                .meta{font-size:11px;color:#6B7280;margin-bottom:12px}
                .kpi-row{display:flex;gap:12px;margin-bottom:14px}
                .kpi{background:#F3F4F6;border-radius:8px;padding:8px 14px;text-align:center;flex:1}
                .kpi .val{font-size:20px;font-weight:800;display:block}
                table{width:100%;border-collapse:collapse}
                th{background:#8B5CF6;color:white;padding:7px;font-size:10px;text-transform:uppercase;border:1px solid #6D28D9}
                tr:nth-child(even){background:#F9FAFB}
            </style></head><body>
            <h2>Conflict Check Records (மொய் முரண்பாடு பட்டியல்)</h2>
            <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Total: ${filteredRecords.length} records</div>
            <div class="kpi-row">
                <div class="kpi"><span class="val" style="color:#10B981">${kpis.matched}</span>✅ Matched</div>
                <div class="kpi"><span class="val" style="color:#F59E0B">${kpis.short}</span>⚠️ Short</div>
                <div class="kpi"><span class="val" style="color:#F43F5E">${kpis.excess}</span>🔺 Excess</div>
                <div class="kpi"><span class="val" style="color:#9CA3AF">${kpis.noRecord}</span>❓ No Record</div>
            </div>
            <table>
                <thead><tr>
                    <th>#</th><th>Recipient (பெயர்)</th><th>Village (ஊர்)</th>
                    <th>Status</th><th>Given Gift Ledger (₹)</th><th>Prev Return (₹)</th>
                    <th>Difference (₹)</th><th>Checked At</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <script>window.onload=function(){window.print()}</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleDelete = async (id) => {
        const confirmed = await window.customConfirm('Delete this conflict record?');
        if (!confirmed) return;
        onDeleteConflict && onDeleteConflict(id);
    };

    return (
        <div className="view-content fade-in">
            {/* KPI Summary Cards */}
            <div className="kpi-3-col-grid mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                    { label: 'Total Checked', val: kpis.total, sub: 'All conflict checks', colorClass: 'purple-kpi' },
                    { label: '✅ Matched', val: kpis.matched, sub: 'Correct returns', colorClass: 'emerald-kpi' },
                    { label: '⚠️ Short Payments', val: kpis.short, sub: 'Gave less than ledger', colorClass: 'gold-kpi' },
                    { label: '🔺 Excess Payments', val: kpis.excess, sub: 'Gave more than ledger', colorClass: 'rose-kpi' },
                ].map((k) => (
                    <div key={k.label} className={`glass-card kpi-card ${k.colorClass}`}>
                        <div className="kpi-top">
                            <span className="kpi-title">{k.label}</span>
                        </div>
                        <div className="kpi-value">{k.val}</div>
                        <div className="kpi-foot">{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Page Header & Filter Bar */}
            <div className="full-width-card glass-card compact-list-header mb-3">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-purple-sm"><AlertTriangle size={16} /></div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Conflict Records (மொய் முரண்பாடு பட்டியல்)</h2>
                            <span className="collection-pill-sm">
                                {filteredRecords.length} of {conflictRecords.length} records • Click row to view full report
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <input className="search-input-sm" placeholder="Search name, village..."
                                value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                        </div>
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel}><FileSpreadsheet size={15} /> Excel</button>
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF}><Printer size={15} /> PDF</button>
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(v => !v)}>
                            <Filter size={15} /> Filters {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Search Name / Village</label>
                                <input className="modern-control-sm" placeholder="Search..."
                                    value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                            </div>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Filter by Status (நிலை)</label>
                                <select className="modern-control-sm" value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                                    <option value="all">All Statuses</option>
                                    <option value="Matched">✅ Matched</option>
                                    <option value="Short">⚠️ Short</option>
                                    <option value="Excess">🔺 Excess</option>
                                    <option value="NoPreviousRecord">❓ No Previous Record</option>
                                </select>
                            </div>
                            <div className="filter-field-group" style={{ justifyContent: 'flex-end' }}>
                                <label className="filter-field-label">&nbsp;</label>
                                <button className="reset-btn-sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCurrentPage(1); }}>
                                    <RotateCcw size={13} /> Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="full-width-card glass-card">
                <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="custom-table modern-table compact-table" style={{ width: '100%', minWidth: '850px' }}>
                        <thead>
                            <tr>
                                <th className="text-left" style={{ width: '15%' }}>
                                    <div className="th-bilingual"><span className="th-en">Recipient Name</span><span className="th-ta">பெயர்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '12%' }}>
                                    <div className="th-bilingual"><span className="th-en">Village</span><span className="th-ta">ஊர்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '12%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Status</span><span className="th-ta">நிலை</span></div>
                                </th>
                                <th className="text-right" style={{ width: '12%' }}>
                                    <div className="th-bilingual right"><span className="th-en">Ledger Amount</span><span className="th-ta">நாம் போட்ட தொகை ₹</span></div>
                                </th>
                                <th className="text-right" style={{ width: '12%' }}>
                                    <div className="th-bilingual right"><span className="th-en">Prev Return</span><span className="th-ta">அவர்கள் திரும்பிச் செய்தது ₹</span></div>
                                </th>
                                <th className="text-right" style={{ width: '11%' }}>
                                    <div className="th-bilingual right"><span className="th-en">Difference</span><span className="th-ta">வித்தியாசம் ₹</span></div>
                                </th>
                                <th className="text-left" style={{ width: '15%' }}>
                                    <div className="th-bilingual"><span className="th-en">Conflict Note</span><span className="th-ta">விவரம்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '6%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Checked</span><span className="th-ta">தேதி</span></div>
                                </th>
                                <th className="text-center" style={{ width: '5%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Actions</span><span className="th-ta">செயல்கள்</span></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-6">
                                        No conflict records found. Records appear here automatically when you check conflict.
                                    </td>
                                </tr>
                            ) : paginatedRecords.map((r) => {
                                const cfg          = STATUS_CONFIG[r.conflictStatus] || STATUS_CONFIG.NoPreviousRecord;
                                const prevReturn   = getPrevReturn(r);
                                const ledgerAmount = getLedgerAmount(r);
                                const diff         = getDifference(r);

                                return (
                                    <tr
                                        key={r.id}
                                        className="table-row-hover"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedRecord(r)}
                                        title="Click to view full detail report"
                                    >
                                        <td className="text-left font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {r.recipientName}
                                        </td>
                                        <td className="text-left" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <span className="badge-village">{r.village || '-'}</span>
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                background: cfg.bg, color: cfg.color,
                                                border: `1px solid ${cfg.border}`,
                                                padding: '0.2rem 0.65rem', borderRadius: '8px',
                                                fontSize: '0.75rem', fontWeight: 800, display: 'inline-block'
                                            }}>{cfg.label}</span>
                                        </td>
                                        <td className="text-right" style={{ color: '#FBBF24', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            ₹ {ledgerAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="text-right amount-col text-purple" style={{ whiteSpace: 'nowrap' }}>
                                            ₹ {prevReturn.toLocaleString('en-IN')}
                                        </td>
                                        <td className="text-right" style={{ fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
                                            {diff >= 0 ? '+' : ''}₹ {diff.toLocaleString('en-IN')}
                                        </td>
                                        {/* Conflict Note — STRICT NO WRAP with ellipsis */}
                                        <td className="text-left text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.conflictNote}>
                                            {r.conflictNote || '-'}
                                        </td>
                                        <td className="text-center text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(r.checkedAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                <button
                                                    className="action-btn-sm view-btn"
                                                    title="View Full Detail Report"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                                                    style={{ background: 'rgba(139,92,246,0.18)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)', padding: '0.25rem 0.45rem', borderRadius: 6, cursor: 'pointer' }}
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        className="action-btn-sm delete-btn"
                                                        title="Delete record"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredRecords.length > 0 && (
                    <div className="pagination-footer-container mt-3 pt-3 border-t">
                        <div className="pagination-info">
                            Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)}</strong>–<strong>{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> of <strong>{filteredRecords.length}</strong>
                        </div>
                        <div className="pagination-controls">
                            <div className="page-size-selector">
                                <span>Rows:</span>
                                <select className="modern-control-sm page-select" value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div className="page-nav-btns">
                                <button className="page-nav-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span className="page-indicator-pill">Page {currentPage} / {totalPages}</span>
                                <button className="page-nav-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── ROW CLICK DETAIL REPORT MODAL ───────────────────────────────── */}
            {selectedRecord && (
                <ConflictDetailModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onDelete={handleDelete}
                    canDelete={canDelete}
                />
            )}
        </div>
    );
};
