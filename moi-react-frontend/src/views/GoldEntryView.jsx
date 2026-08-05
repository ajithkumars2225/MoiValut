import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    Coins,
    Plus,
    Edit2,
    Trash2,
    Printer,
    Search,
    FileSpreadsheet,
    Filter,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Calendar,
    User,
    Award,
    Clock,
} from 'lucide-react';
import { GoldEntryModal } from '../components/modals/GoldEntryModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const GoldEntryView = ({
    event,
    goldEntries = [],
    onRecordGold,
    onUpdateGold,
    onDeleteGold,
    privileges,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGold, setEditingGold] = useState(null);

    const canAdd    = !privileges || privileges.add === true;
    const canEdit   = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;

    const [searchQuery, setSearchQuery] = useState('');
    const [villageFilter, setVillageFilter] = useState('all');
    const [sortBy, setSortBy] = useState('serial_asc');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    if (!event) {
        return (
            <div className="empty-event-hero">
                <div className="hero-card">
                    <h2>No Event Selected</h2>
                    <p>Please select an event to manage gold gift entries.</p>
                </div>
            </div>
        );
    }

    const handleOpenAdd = () => {
        setEditingGold(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (ge) => {
        setEditingGold(ge);
        setIsModalOpen(true);
    };

    const handleSave = async (data, goldId) => {
        if (goldId) {
            return await onUpdateGold(goldId, data);
        } else {
            return await onRecordGold(data);
        }
    };

    // Extract unique villages list
    const villagesList = useMemo(() => {
        const set = new Set();
        goldEntries.forEach(ge => {
            if (ge.village && ge.village.trim()) {
                set.add(ge.village.trim());
            }
        });
        return Array.from(set).sort();
    }, [goldEntries]);

    // Gold Weight Extraction Engine (Supports Grams & Savaram/Sovereign/சவரன்)
    const goldWeightMetrics = useMemo(() => {
        let totalGrams = 0;
        let totalSovereigns = 0;

        goldEntries.forEach((ge) => {
            const text = (ge.goldDetails || '').toLowerCase().trim();
            if (!text) return;

            const savMatch  = text.match(/(\d+(?:\.\d+)?)\s*(?:savaran|savaram|சவரன்|pavan|sovereign|sav|savran|சவரம்)/);
            const gramMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:gram|grams|கிராம்|gm|g\b)/);

            if (savMatch) {
                const sav = parseFloat(savMatch[1]);
                if (!isNaN(sav)) {
                    totalSovereigns += sav;
                    totalGrams += sav * 8; // 1 Savaran = 8 Grams
                    return;
                }
            }

            if (gramMatch) {
                const gm = parseFloat(gramMatch[1]);
                if (!isNaN(gm)) {
                    totalGrams += gm;
                    totalSovereigns += gm / 8;
                    return;
                }
            }

            // Fallback for starting numbers
            const numMatch = text.match(/^(\d+(?:\.\d+)?)/);
            if (numMatch) {
                const num = parseFloat(numMatch[1]);
                if (!isNaN(num)) {
                    totalGrams += num;
                    totalSovereigns += num / 8;
                }
            }
        });

        return {
            totalGrams: Number(totalGrams.toFixed(2)),
            totalSovereigns: Number(totalSovereigns.toFixed(2)),
        };
    }, [goldEntries]);

    // KPI Metrics
    const kpis = useMemo(() => {
        const totalCount = goldEntries.length;
        const villageCount = villagesList.length;
        return { totalCount, villageCount, weight: goldWeightMetrics };
    }, [goldEntries, villagesList, goldWeightMetrics]);

    // Filter & Sort Logic
    const filteredEntries = useMemo(() => {
        let list = [...goldEntries];

        // Search Filter
        const q = searchQuery.toLowerCase().trim();
        if (q) {
            list = list.filter(ge =>
                ge.contributorName?.toLowerCase().includes(q) ||
                ge.village?.toLowerCase().includes(q) ||
                ge.goldDetails?.toLowerCase().includes(q) ||
                ge.serialNumber?.toString().includes(q)
            );
        }

        // Village Filter
        if (villageFilter !== 'all') {
            list = list.filter(ge => (ge.village || '').trim() === villageFilter);
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'serial_asc') return (a.serialNumber || 0) - (b.serialNumber || 0);
            if (sortBy === 'serial_desc') return (b.serialNumber || 0) - (a.serialNumber || 0);
            if (sortBy === 'name_asc') return (a.contributorName || '').localeCompare(b.contributorName || '');
            if (sortBy === 'date_desc') return new Date(b.entryDate || 0) - new Date(a.entryDate || 0);
            if (sortBy === 'date_asc') return new Date(a.entryDate || 0) - new Date(b.entryDate || 0);
            return 0;
        });

        return list;
    }, [goldEntries, searchQuery, villageFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
    const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Export Excel
    const handleExportExcel = () => {
        if (filteredEntries.length === 0) {
            window.customAlert('No records available to export.');
            return;
        }

        const data = filteredEntries.map((ge, idx) => ({
            'S.No (வ.எண்)': ge.serialNumber || idx + 1,
            'Contributor Name (பெயர்)': ge.contributorName,
            'Village (ஊர்)': ge.village || '-',
            'Gold Details (பொன் விபரம்)': ge.goldDetails || '-',
            'Date & Time (தேதி & நேரம்)': new Date(ge.entryDate).toLocaleString('en-IN'),
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Gold_Gifts');
        XLSX.writeFile(workbook, `Gold_Gifts_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Export PDF Print Report
    const handleExportPDF = () => {
        if (filteredEntries.length === 0) {
            window.customAlert('No records available to export.');
            return;
        }

        const rowsHtml = filteredEntries.map((ge) => `
            <tr>
                <td style="padding:6px;border:1px solid #E5E7EB;text-align:center;font-size:11px;">#${ge.serialNumber}</td>
                <td style="padding:6px;border:1px solid #E5E7EB;font-weight:bold;font-size:12px;">${ge.contributorName}</td>
                <td style="padding:6px;border:1px solid #E5E7EB;font-size:11px;">${ge.village || '-'}</td>
                <td style="padding:6px;border:1px solid #E5E7EB;font-size:12px;color:#D97706;font-weight:bold;">${ge.goldDetails}</td>
                <td style="padding:6px;border:1px solid #E5E7EB;font-size:10px;color:#6B7280;text-align:center;">${new Date(ge.entryDate).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html><html><head><title>Gold Gifts Ledger - ${event.name}</title>
            <style>
                @page{size:A4 portrait;margin:12mm}
                body{font-family:'Segoe UI',sans-serif;color:#111827}
                h2{color:#D97706;margin:0 0 4px}
                .meta{font-size:11px;color:#6B7280;margin-bottom:12px}
                .kpi-row{display:flex;gap:12px;margin-bottom:14px}
                .kpi{background:#FEF3C7;border-radius:8px;padding:8px 14px;text-align:center;flex:1;border:1px solid #FCD34D}
                .kpi .val{font-size:20px;font-weight:800;color:#B45309;display:block}
                table{width:100%;border-collapse:collapse}
                th{background:#D97706;color:white;padding:7px;font-size:10px;text-transform:uppercase;border:1px solid #B45309}
                tr:nth-child(even){background:#FFFBEB}
            </style></head><body>
            <h2>Gold Gift Ledger (பொன்/நகை பட்டியல்) - ${event.name}</h2>
            <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Total: ${filteredEntries.length} items</div>
            <div class="kpi-row">
                <div class="kpi"><span class="val">${kpis.totalCount}</span>Total Items (எண்ணிக்கை)</div>
                <div class="kpi"><span class="val">${kpis.weight.totalGrams} g</span>Total Grams (கிராம்)</div>
                <div class="kpi"><span class="val">${kpis.weight.totalSovereigns} Sav</span>Total Savaram (சவரன்)</div>
            </div>
            <table>
                <thead><tr>
                    <th>S.No</th><th>Name (பெயர்)</th><th>Village (ஊர்)</th>
                    <th>Gold Details (பொன் விபரம்)</th><th>Date & Time</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <script>window.onload=function(){window.print()}</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setVillageFilter('all');
        setSortBy('serial_asc');
        setCurrentPage(1);
    };

    return (
        <div className="view-content fade-in">
            {/* KPI Summary Cards (4-COLUMN GRID WITH GOLD GRAMS & SAVARAM) */}
            <div className="kpi-3-col-grid mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="glass-card kpi-card gold-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Gold Gifts (நகை எண்ணிக்கை)</span>
                        <div className="kpi-icon-bg gold-icon"><Coins size={18} /></div>
                    </div>
                    <div className="kpi-value text-amber">{kpis.totalCount} Items</div>
                    <div className="kpi-foot">Recorded gold gift entries</div>
                </div>

                <div className="glass-card kpi-card amber-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Gold Weight (மொத்த பொன் எடை)</span>
                        <div className="kpi-icon-bg amber-icon"><Award size={18} /></div>
                    </div>
                    <div className="kpi-value text-gold" style={{ letterSpacing: '-0.3px' }}>
                        {kpis.weight.totalGrams} Grams (கிராம்)
                    </div>
                    <div className="kpi-foot" style={{ color: '#FBBF24', fontWeight: 600 }}>
                        ~ {kpis.weight.totalSovereigns} Savaram (சவரன்)
                    </div>
                </div>

                <div className="glass-card kpi-card purple-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Villages Represented (ஊர்கள்)</span>
                        <div className="kpi-icon-bg purple-icon"><MapPin size={18} /></div>
                    </div>
                    <div className="kpi-value">{kpis.villageCount} Villages</div>
                    <div className="kpi-foot">Unique locations recorded</div>
                </div>

                <div className="glass-card kpi-card emerald-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title">Event Status (நிகழ்ச்சி நிலை)</span>
                        <div className="kpi-icon-bg emerald-icon"><Award size={18} /></div>
                    </div>
                    <div className="kpi-value text-emerald">{event.name}</div>
                    <div className="kpi-foot">{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN') : 'Active Event'}</div>
                </div>
            </div>

            {/* Header & Filter Toolbar */}
            <div className="full-width-card glass-card compact-list-header mb-3">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-gold-sm"><Coins size={16} /></div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Gold Gift Entries (பொன்/நகை சேர்க்கை)</h2>
                            <span className="collection-pill-sm">
                                {filteredEntries.length} of {goldEntries.length} gold items recorded
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                className="search-input-sm"
                                placeholder="Search by name, village, gold details..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel}><FileSpreadsheet size={15} /> Excel</button>
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF}><Printer size={15} /> PDF</button>
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(v => !v)}>
                            <Filter size={15} /> Filters {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {canAdd && (
                            <button className="modern-btn btn-gradient-gold shadow-btn" onClick={handleOpenAdd}>
                                <Plus size={16} /> Record Gold Gift
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filter Drawer */}
                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Filter by Village (ஊர்)</label>
                                <select
                                    className="modern-control-sm"
                                    value={villageFilter}
                                    onChange={(e) => { setVillageFilter(e.target.value); setCurrentPage(1); }}>
                                    <option value="all">All Villages (எல்லா ஊர்களும்)</option>
                                    {villagesList.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Sort Records By</label>
                                <select
                                    className="modern-control-sm"
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                                    <option value="serial_asc">S.No Ascending (1 ➔ N)</option>
                                    <option value="serial_desc">S.No Descending (N ➔ 1)</option>
                                    <option value="name_asc">Contributor Name (A ➔ Z)</option>
                                    <option value="date_desc">Latest First</option>
                                    <option value="date_asc">Oldest First</option>
                                </select>
                            </div>
                            <div className="filter-field-group" style={{ justifyContent: 'flex-end' }}>
                                <label className="filter-field-label">&nbsp;</label>
                                <button className="reset-btn-sm" onClick={handleResetFilters}>
                                    <RotateCcw size={13} /> Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Table */}
            <div className="full-width-card glass-card">
                <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="custom-table modern-table compact-table" style={{ width: '100%', minWidth: '780px' }}>
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '7%' }}>
                                    <div className="th-bilingual center"><span className="th-en">S.No</span><span className="th-ta">வ.எண்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '22%' }}>
                                    <div className="th-bilingual"><span className="th-en">Contributor Name</span><span className="th-ta">பெயர்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '18%' }}>
                                    <div className="th-bilingual"><span className="th-en">Village</span><span className="th-ta">ஊர்</span></div>
                                </th>
                                <th className="text-left" style={{ width: '30%' }}>
                                    <div className="th-bilingual"><span className="th-en">Gold Details</span><span className="th-ta">பொன் / நகை விபரம்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '13%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Date & Time</span><span className="th-ta">தேதி & நேரம்</span></div>
                                </th>
                                <th className="text-center" style={{ width: '10%' }}>
                                    <div className="th-bilingual center"><span className="th-en">Actions</span><span className="th-ta">செயல்கள்</span></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-6">
                                        No gold entries found. Click <strong>+ Record Gold Gift</strong> to add one!
                                    </td>
                                </tr>
                            ) : (
                                paginatedEntries.map((ge) => (
                                    <tr key={ge.id} className="table-row-hover">
                                        <td className="text-center"><span className="badge-sno">#{ge.serialNumber}</span></td>
                                        <td className="text-left font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {ge.contributorName}
                                        </td>
                                        <td className="text-left" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <span className="badge-village">{ge.village || '-'}</span>
                                        </td>
                                        <td className="text-left gold-detail-cell" style={{ fontWeight: 700, color: '#F59E0B' }}>
                                            {ge.goldDetails}
                                        </td>
                                        <td className="text-center text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(ge.entryDate).toLocaleString('en-IN', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                                <button
                                                    title="Print Receipt"
                                                    onClick={() => setSelectedReceipt(ge)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                        padding: '0.32rem 0.7rem', borderRadius: '8px', fontSize: '0.72rem',
                                                        fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.35)',
                                                        background: 'rgba(99,102,241,0.14)', color: '#818CF8',
                                                        transition: 'all 0.18s ease',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.45)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.color = '#818CF8'; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    <Printer size={12} /> Print
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        title="Edit Entry"
                                                        onClick={() => handleOpenEdit(ge)}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                            padding: '0.32rem 0.7rem', borderRadius: '8px', fontSize: '0.72rem',
                                                            fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(139,92,246,0.35)',
                                                            background: 'rgba(139,92,246,0.14)', color: '#A78BFA',
                                                            transition: 'all 0.18s ease',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.45)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.14)'; e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <Edit2 size={12} /> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        title="Delete Entry"
                                                        onClick={() => onDeleteGold(ge.id)}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                            padding: '0.32rem 0.7rem', borderRadius: '8px', fontSize: '0.72rem',
                                                            fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(244,63,94,0.35)',
                                                            background: 'rgba(244,63,94,0.14)', color: '#FB7185',
                                                            transition: 'all 0.18s ease',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#F43F5E'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,63,94,0.45)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.14)'; e.currentTarget.style.color = '#FB7185'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredEntries.length > 0 && (
                    <div className="pagination-footer-container mt-3 pt-3 border-t">
                        <div className="pagination-info">
                            Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredEntries.length)}</strong>–<strong>{Math.min(currentPage * pageSize, filteredEntries.length)}</strong> of <strong>{filteredEntries.length}</strong> items
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

            {/* Add / Edit Modern Modal Popup */}
            <GoldEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingGold={editingGold}
                eventId={event.id}
            />

            {/* Printable Receipt Popup */}
            <ReceiptModal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                data={selectedReceipt}
                event={event}
            />
        </div>
    );
};
