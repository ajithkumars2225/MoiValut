import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    ShieldCheck,
    Search,
    Filter,
    FileSpreadsheet,
    Printer,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    PlusCircle,
    Edit3,
    Trash2,
    CheckCircle,
    User,
    Calendar,
    Eye,
    X,
    Clock,
    Activity,
} from 'lucide-react';
import { getStoredAuditLogs, clearAuditLogs, deleteSingleAuditLog } from '../services/auditLogger';

const ACTION_CONFIG = {
    CREATE: { label: '➕ CREATE', tamLabel: 'சேர்க்கை', bg: 'rgba(16,185,129,0.15)', color: '#34D399', border: 'rgba(16,185,129,0.35)', icon: PlusCircle },
    UPDATE: { label: '✏️ UPDATE', tamLabel: 'திருத்தம்', bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: 'rgba(245,158,11,0.35)', icon: Edit3 },
    DELETE: { label: '🗑️ DELETE', tamLabel: 'நீக்கம்', bg: 'rgba(244,63,94,0.15)', color: '#FB7185', border: 'rgba(244,63,94,0.35)', icon: Trash2 },
    CHECK:  { label: '⚡ CHECK',  tamLabel: 'சோதனை', bg: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: 'rgba(139,92,246,0.35)', icon: Activity },
};

// ── AUDIT DIFF & DETAIL POPUP MODAL ──────────────────────────────────────────
const AuditDetailModal = ({ log, onClose, onDelete, canDelete = true }) => {
    if (!log) return null;

    const cfg = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.CREATE;

    const formatValue = (val) => {
        if (!val) return <span style={{ color: '#6B7280', fontStyle: 'italic' }}>No record details</span>;
        if (typeof val === 'object') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.83rem' }}>
                    {Object.entries(val).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.25rem' }}>
                            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{k}:</span>
                            <strong style={{ color: '#FFF', fontWeight: 700 }}>
                                {typeof v === 'number' ? `₹ ${v.toLocaleString('en-IN')}` : String(v !== null && v !== undefined ? v : '-')}
                            </strong>
                        </div>
                    ))}
                </div>
            );
        }
        return <strong style={{ color: '#FFF' }}>{String(val)}</strong>;
    };

    return (
        <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '640px', width: '92%' }}>
                {/* Header */}
                <div className="hyper-header purple-theme" style={{ padding: '1.1rem 1.4rem' }}>
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple" style={{ width: 42, height: 42 }}>
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil">AUDIT LOG ENTRY DETAIL (தணிக்கைப் பதிவு விவரம்)</span>
                            <h3 style={{ fontSize: '1.25rem', color: '#FFF', margin: '2px 0 0 0' }}>
                                {log.recordName} ({log.module})
                            </h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose} style={{ width: 34, height: 34 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="hyper-body-scrollable" style={{ padding: '1.2rem 1.4rem' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                                <cfg.icon size={17} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block' }}>செயல் வகை (Action Type)</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: cfg.color }}>{cfg.label} ({cfg.tamLabel})</span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                                <Activity size={17} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block' }}>பிரிவு (Module Section)</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 850, color: '#FFF' }}>{log.module}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: log.oldValue ? '1fr 1fr' : '1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                        {/* Old Values (If Edit or Delete) */}
                        {(log.actionType === 'UPDATE' || log.actionType === 'DELETE') && (
                            <div style={{ border: '1px solid rgba(244,63,94,0.15)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(244,63,94,0.02)' }}>
                                <div style={{ background: 'rgba(244,63,94,0.06)', padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(244,63,94,0.15)', fontWeight: 600, fontSize: '0.78rem', color: '#FB7185' }}>
                                    முந்தைய மதிப்பு (Old Values)
                                </div>
                                <div style={{ padding: '0.85rem' }}>
                                    {formatValue(log.oldValue)}
                                </div>
                            </div>
                        )}

                        {/* New Values */}
                        <div style={{ border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(16,185,129,0.02)' }}>
                            <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(16,185,129,0.15)', fontWeight: 600, fontSize: '0.78rem', color: '#34D399' }}>
                                புதிய மதிப்பு (New Values)
                                {log.actionType === 'DELETE' && ' - நீக்கப்பட்டது'}
                            </div>
                            <div style={{ padding: '0.85rem' }}>
                                {formatValue(log.newValue)}
                            </div>
                        </div>
                    </div>

                    {log.details && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.2rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                தணிக்கை குறிப்புரை / Audit Log Details
                            </span>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                                {log.details}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#9CA3AF', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.85rem', borderRadius: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} style={{ color: '#A78BFA' }} /> Timestamp: <strong style={{ color: '#FFF' }}>{new Date(log.timestamp).toLocaleString('en-IN')}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} style={{ color: '#FBBF24' }} /> Performed By: <strong style={{ color: '#FFF' }}>{log.user || 'Admin'}</strong>
                        </span>
                    </div>
                </div>

                <div className="hyper-footer" style={{ padding: '0.9rem 1.4rem', justifyContent: 'space-between', background: 'rgba(0,0,0,0.25)' }}>
                    {canDelete ? (
                        <button
                            type="button"
                            style={{
                                background: 'rgba(244,63,94,0.15)', color: '#FB7185',
                                border: '1px solid rgba(244,63,94,0.35)', padding: '0.5rem 1rem',
                                borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                            onClick={() => { onDelete(log.id); onClose(); }}
                        >
                            <Trash2 size={14} /> Delete Audit Log Entry
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <button type="button" className="hyper-btn btn-purple-neon" onClick={onClose} style={{ padding: '0.5rem 1.4rem', borderRadius: '10px' }}>
                        Close Log Detail
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── MAIN AUDIT LOG VIEW COMPONENT ──────────────────────────────────────────────
export const ReportsView = ({ privileges }) => {
    const canDelete = !privileges || privileges.delete === true;
    const [auditLogs, setAuditLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedLog, setSelectedLog] = useState(null);

    // Refresh audit logs on mount & periodic sync
    const refreshLogs = () => {
        setAuditLogs(getStoredAuditLogs());
    };

    useEffect(() => {
        refreshLogs();
    }, []);

    // Delete single log handler
    const handleDeleteSingleLog = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this audit log entry?');
        if (!confirmed) return;
        const updated = deleteSingleAuditLog(id);
        setAuditLogs(updated);
    };

    // KPI Summary
    const kpis = useMemo(() => {
        const total = auditLogs.length;
        const creates = auditLogs.filter(l => l.actionType === 'CREATE').length;
        const updates = auditLogs.filter(l => l.actionType === 'UPDATE').length;
        const deletes = auditLogs.filter(l => l.actionType === 'DELETE').length;
        return { total, creates, updates, deletes };
    }, [auditLogs]);

    // Filter & Sort
    const filteredLogs = useMemo(() => {
        let list = [...auditLogs];

        const q = searchQuery.toLowerCase().trim();
        if (q) {
            list = list.filter(l =>
                l.recordName?.toLowerCase().includes(q) ||
                l.village?.toLowerCase().includes(q) ||
                l.details?.toLowerCase().includes(q) ||
                l.user?.toLowerCase().includes(q) ||
                l.module?.toLowerCase().includes(q)
            );
        }

        if (moduleFilter !== 'all') {
            list = list.filter(l => l.module === moduleFilter);
        }

        if (actionFilter !== 'all') {
            list = list.filter(l => l.actionType === actionFilter);
        }

        list.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
            if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
            return 0;
        });

        return list;
    }, [auditLogs, searchQuery, moduleFilter, actionFilter, sortBy]);

    const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Excel Export
    const handleExportExcel = () => {
        if (filteredLogs.length === 0) { window.customAlert('No logs available to export.'); return; }
        const data = filteredLogs.map((l, idx) => ({
            '#': idx + 1,
            'Timestamp (தேதி & நேரம்)': new Date(l.timestamp).toLocaleString('en-IN'),
            'Action Type (செயல்பாடு)': l.actionType,
            'Module (பிரிவு)': l.module,
            'Record Name (பெயர் / நிகழ்ச்சி)': l.recordName,
            'Village (ஊர்)': l.village || '-',
            'Details (மாற்ற விவரம்)': l.details || '-',
            'Performed By (பயனர்)': l.user || 'Admin',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Audit_Logs');
        XLSX.writeFile(wb, `Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // PDF Export Print Report
    const handleExportPDF = () => {
        if (filteredLogs.length === 0) { window.customAlert('No logs available to export.'); return; }
        const rowsHtml = filteredLogs.map((l, idx) => {
            const cfg = ACTION_CONFIG[l.actionType] || ACTION_CONFIG.CREATE;
            return `
                <tr>
                    <td style="padding:6px;border:1px solid #E5E7EB;text-align:center;font-size:10px;">${idx + 1}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:10px;color:#6B7280;white-space:nowrap;">${new Date(l.timestamp).toLocaleString('en-IN')}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;font-weight:bold;color:${cfg.color};">${cfg.label}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;font-weight:bold;">${l.module}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;font-weight:bold;">${l.recordName}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;">${l.village || '-'}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:10px;color:#374151;">${l.details}</td>
                    <td style="padding:6px;border:1px solid #E5E7EB;font-size:10px;text-align:center;">${l.user || 'Admin'}</td>
                </tr>
            `;
        }).join('');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html><html><head><title>Audit Log Report</title>
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
            <h2>Audit Log & System Activity (கணக்கு தணிக்கைப் பதிவு)</h2>
            <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Total Logs: ${filteredLogs.length}</div>
            <div class="kpi-row">
                <div class="kpi"><span class="val" style="color:#8B5CF6">${kpis.total}</span>Total Logs</div>
                <div class="kpi"><span class="val" style="color:#10B981">${kpis.creates}</span>Creates (சேர்க்கைகள்)</div>
                <div class="kpi"><span class="val" style="color:#F59E0B">${kpis.updates}</span>Edits (திருத்தங்கள்)</div>
                <div class="kpi"><span class="val" style="color:#F43F5E">${kpis.deletes}</span>Deletes (நீக்கங்கள்)</div>
            </div>
            <table>
                <thead><tr>
                    <th>#</th><th>Timestamp</th><th>Action</th><th>Module</th>
                    <th>Record Name</th><th>Village</th><th>Details Summary</th><th>User</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <script>window.onload=function(){window.print()}</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleClearAllLogs = async () => {
        const confirmed = await window.customConfirm('Are you sure you want to clear ALL audit logs permanently?');
        if (!confirmed) return;
        clearAuditLogs();
        refreshLogs();
    };

    return (
        <div className="view-content fade-in">
            {/* KPI Summary Cards */}
            <div className="kpi-3-col-grid mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="glass-card kpi-card purple-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Audit Logs (மொத்தப் பதிவுகள்)</span>
                        <div className="kpi-icon-bg purple-icon"><ShieldCheck size={18} /></div>
                    </div>
                    <div className="kpi-value text-purple">{kpis.total}</div>
                    <div className="kpi-foot">Recorded system activities</div>
                </div>

                <div className="glass-card kpi-card emerald-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">New Creates (புதிய சேர்க்கைகள்)</span>
                        <div className="kpi-icon-bg emerald-icon"><PlusCircle size={18} /></div>
                    </div>
                    <div className="kpi-value text-emerald">{kpis.creates}</div>
                    <div className="kpi-foot">Added records count</div>
                </div>

                <div className="glass-card kpi-card gold-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Edits & Changes (திருத்தங்கள் - EDITS)</span>
                        <div className="kpi-icon-bg gold-icon"><Edit3 size={18} /></div>
                    </div>
                    <div className="kpi-value text-gold">{kpis.updates}</div>
                    <div className="kpi-foot">Modified records count</div>
                </div>

                <div className="glass-card kpi-card rose-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Deletions (நீக்கப்பட்டவை - DELETES)</span>
                        <div className="kpi-icon-bg rose-icon"><Trash2 size={18} /></div>
                    </div>
                    <div className="kpi-value text-rose">{kpis.deletes}</div>
                    <div className="kpi-foot">Deleted entries count</div>
                </div>
            </div>

            {/* Header & Filter Bar */}
            <div className="full-width-card glass-card compact-list-header mb-3">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-purple-sm"><ShieldCheck size={16} /></div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Audit Log & System Activity (கணக்கு தணிக்கைப் பதிவு)</h2>
                            <span className="collection-pill-sm">
                                {filteredLogs.length} of {auditLogs.length} audit logs • Tracks every Add, Edit, Delete action
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <input
                                className="search-input-sm"
                                placeholder="Search name, village, action, user..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel}><FileSpreadsheet size={15} /> Excel</button>
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF}><Printer size={15} /> PDF</button>
                        {canDelete && auditLogs.length > 0 && (
                            <button
                                className="modern-btn"
                                style={{ background: 'rgba(244,63,94,0.15)', color: '#FB7185', border: '1px solid rgba(244,63,94,0.3)', padding: '0.55rem 0.9rem', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                                onClick={handleClearAllLogs}
                                title="Clear All Audit Logs"
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        )}
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(v => !v)}>
                            <Filter size={15} /> Filters {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Drawer */}
                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Filter by Module (பிரிவு)</label>
                                <select className="modern-control-sm" value={moduleFilter}
                                    onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}>
                                    <option value="all">All Modules (எல்லா பிரிவுகளும்)</option>
                                    <option value="Moi Entry">Moi Entry (வந்த பண மொய்)</option>
                                    <option value="Given Moi">Given Moi (செய்த மொய்)</option>
                                    <option value="Gold Entry">Gold Entry (பொன் வரவு)</option>
                                    <option value="Events">Events (நிகழ்வுகள் மேலாண்மை)</option>
                                    <option value="Conflict Check">Conflict Check (முரண்பாடு சோதனை)</option>
                                </select>
                            </div>

                            <div className="filter-field-group">
                                <label className="filter-field-label">Action Type (செயல்பாடு)</label>
                                <select className="modern-control-sm" value={actionFilter}
                                    onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
                                    <option value="all">All Actions (எல்லா செயல்பாடுகள்)</option>
                                    <option value="CREATE">➕ CREATE (சேர்க்கை)</option>
                                    <option value="UPDATE">✏️ UPDATE (திருத்தம் - Edit)</option>
                                    <option value="DELETE">🗑️ DELETE (நீக்கம்)</option>
                                    <option value="CHECK">⚡ CHECK (சோதனை)</option>
                                </select>
                            </div>

                            <div className="filter-field-group">
                                <label className="filter-field-label">Sort Records By</label>
                                <select className="modern-control-sm" value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                                    <option value="newest">Latest Actions First</option>
                                    <option value="oldest">Oldest Actions First</option>
                                </select>
                            </div>

                            <div className="filter-field-group" style={{ justifyContent: 'flex-end' }}>
                                <label className="filter-field-label">&nbsp;</label>
                                <button className="reset-btn-sm" onClick={() => { setSearchQuery(''); setModuleFilter('all'); setActionFilter('all'); setSortBy('newest'); setCurrentPage(1); }}>
                                    <RotateCcw size={13} /> Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Log Table */}
            <div className="full-width-card glass-card">
                <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="custom-table modern-table compact-table" style={{ width: '100%', minWidth: '920px' }}>
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '12%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Timestamp</span><span className="th-ta">தேதி & நேரம்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '10%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Action</span><span className="th-ta">செயல்பாடு</span></div>
                                </th>
                                <th className="text-center" style={{ width: '12%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Module</span><span className="th-ta">பிரிவு</span></div>
                                </th>
                                <th className="text-left" style={{ width: '17%' }}>
                                    <div className="th-bilingual"><span className="th-en">Record / Person</span><span className="th-ta">பெயர் / விபரம்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '12%' }}>
                                    <div className="th-bilingual"><span className="th-en">Village</span><span className="th-ta">ஊர்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '22%' }}>
                                    <div className="th-bilingual"><span className="th-en">Details Summary</span><span className="th-ta">மாற்ற விவரம்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '8%' }}>
                                    <div className="th-bilingual center"><span className="th-en">User</span><span className="th-ta">பயனர்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '7%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Actions</span><span className="th-ta">செயல்கள்</span></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-6">
                                        No audit logs found. Activity will appear here automatically when actions occur.
                                    </td>
                                </tr>
                            ) : paginatedLogs.map((log) => {
                                const cfg = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.CREATE;
                                return (
                                    <tr
                                        key={log.id}
                                        className="table-row-hover"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedLog(log)}
                                        title="Click to view full diff comparison"
                                    >
                                        <td className="text-center text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(log.timestamp).toLocaleString('en-IN', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                background: cfg.bg, color: cfg.color,
                                                border: `1px solid ${cfg.border}`,
                                                padding: '0.2rem 0.6rem', borderRadius: '8px',
                                                fontSize: '0.72rem', fontWeight: 800, display: 'inline-block'
                                            }}>{cfg.label}</span>
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <span className="type-badge-cash">{log.module}</span>
                                        </td>
                                        <td className="text-left font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.recordName}
                                        </td>
                                        <td className="text-left" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <span className="badge-village">{log.village || '-'}</span>
                                        </td>
                                        <td className="text-left text-xs text-muted" style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="text-center text-xs" style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#9CA3AF' }}>
                                            {log.user || 'Admin'}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                <button
                                                    className="action-btn-sm view-btn"
                                                    title="View Change Diff"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                    style={{
                                                        background: 'rgba(139,92,246,0.18)', color: '#A78BFA',
                                                        border: '1px solid rgba(139,92,246,0.3)', padding: '0.25rem 0.45rem',
                                                        borderRadius: 6, cursor: 'pointer'
                                                    }}
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        className="action-btn-sm delete-btn"
                                                        title="Delete this audit record"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSingleLog(log.id); }}
                                                        style={{
                                                            background: 'rgba(244,63,94,0.18)', color: '#FB7185',
                                                            border: '1px solid rgba(244,63,94,0.3)', padding: '0.25rem 0.45rem',
                                                            borderRadius: 6, cursor: 'pointer'
                                                        }}
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
                {filteredLogs.length > 0 && (
                    <div className="pagination-footer-container mt-3 pt-3 border-t">
                        <div className="pagination-info">
                            Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)}</strong>–<strong>{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> logs
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

            {/* ── ROW CLICK AUDIT DETAIL MODAL ────────────────────────────────── */}
            {selectedLog && (
                <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} onDelete={handleDeleteSingleLog} canDelete={canDelete} />
            )}
        </div>
    );
};
