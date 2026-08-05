import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    Send,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Layers,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    MapPin,
    Calendar,
    Edit2,
    Trash2,
    FileSpreadsheet,
    Printer,
    Coins,
    IndianRupee,
} from 'lucide-react';
import { GivenMoiModal } from '../components/modals/GivenMoiModal';
import { TransliteratedInput } from '../components/TransliteratedInput';

// Helper for Filter State Portability (URL Query Params & Session Storage)
const getInitialState = (key, fallback) => {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has(key)) return params.get(key);
        const stored = sessionStorage.getItem(`given_filter_${key}`);
        return stored !== null ? stored : fallback;
    } catch {
        return fallback;
    }
};

export const GivenMoiEntryView = ({
    event,
    givenEntries,
    onRecordGivenMoi,
    onUpdateGivenMoi,
    onDeleteGivenMoi,
    settings = {},
    privileges,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const canAdd    = !privileges || privileges.add === true;
    const canEdit   = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;

    // 🌐 PORTABLE FILTER & SEARCH STATES (URL & SESSION STORAGE SYNCED) 🌐
    const [searchQuery, setSearchQuery] = useState(() => getInitialState('search', ''));
    const [selectedVillage, setSelectedVillage] = useState(() => getInitialState('village', ''));
    const [amountRange, setAmountRange] = useState(() => getInitialState('amount', 'all'));
    const [groupBy, setGroupBy] = useState(() => getInitialState('group', 'none')); // 'none' | 'village' | 'occasion'
    const [isFilterExpanded, setIsFilterExpanded] = useState(() => getInitialState('expanded', 'false') === 'true');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(() => Number(getInitialState('page', 1)));
    const [pageSize, setPageSize] = useState(() => Number(getInitialState('pageSize', 20)));

    // 🔄 Sync Filter State to URL Query String & Session Storage 🔄
    useEffect(() => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (selectedVillage) params.set('village', selectedVillage);
            if (amountRange && amountRange !== 'all') params.set('amount', amountRange);
            if (groupBy && groupBy !== 'none') params.set('group', groupBy);
            if (currentPage > 1) params.set('page', currentPage);
            if (pageSize !== 20) params.set('pageSize', pageSize);

            sessionStorage.setItem('given_filter_search', searchQuery);
            sessionStorage.setItem('given_filter_village', selectedVillage);
            sessionStorage.setItem('given_filter_amount', amountRange);
            sessionStorage.setItem('given_filter_group', groupBy);
            sessionStorage.setItem('given_filter_expanded', isFilterExpanded.toString());
            sessionStorage.setItem('given_filter_page', currentPage.toString());
            sessionStorage.setItem('given_filter_pageSize', pageSize.toString());

            const queryString = params.toString();
            const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
            window.history.replaceState(null, '', newUrl);
        } catch (e) {
            console.error('Error syncing filter state:', e);
        }
    }, [searchQuery, selectedVillage, amountRange, groupBy, isFilterExpanded, currentPage, pageSize]);

    // Unique Villages List
    const uniqueVillages = useMemo(() => {
        const set = new Set();
        givenEntries.forEach((tx) => {
            if (tx.village) set.add(tx.village);
        });
        return Array.from(set).sort();
    }, [givenEntries]);

    // Filtering Logic
    const filteredEntries = useMemo(() => {
        return givenEntries.filter((tx) => {
            const q = searchQuery.toLowerCase().trim();
            if (q) {
                const matchName = tx.recipientName.toLowerCase().includes(q);
                const matchVillage = tx.village && tx.village.toLowerCase().includes(q);
                const matchOccasion = tx.occasion && tx.occasion.toLowerCase().includes(q);
                const matchGold = tx.goldDetails && tx.goldDetails.toLowerCase().includes(q);
                const matchAmount = tx.amount.toString().includes(q);
                if (!matchName && !matchVillage && !matchOccasion && !matchGold && !matchAmount) return false;
            }

            if (selectedVillage && tx.village !== selectedVillage) {
                return false;
            }

            const amt = Number(tx.amount || 0);
            if (amountRange === '<500' && amt >= 500) return false;
            if (amountRange === '501-2000' && (amt < 501 || amt > 2000)) return false;
            if (amountRange === '2001-5000' && (amt < 2001 || amt > 5000)) return false;
            if (amountRange === '>5000' && amt <= 5000) return false;

            return true;
        });
    }, [givenEntries, searchQuery, selectedVillage, amountRange]);

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;

        const groups = {};
        filteredEntries.forEach((tx) => {
            const key = groupBy === 'village' ? (tx.village || 'Unspecified Village') : (tx.occasion || 'General Occasion');
            if (!groups[key]) {
                groups[key] = { key, items: [], totalAmount: 0 };
            }
            groups[key].items.push(tx);
            groups[key].totalAmount += Number(tx.amount || 0);
        });

        return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [filteredEntries, groupBy]);

    // Pagination Calculation
    const totalRecords = filteredEntries.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginatedEntries = useMemo(() => {
        if (groupBy !== 'none') return filteredEntries;
        const startIndex = (currentPage - 1) * pageSize;
        return filteredEntries.slice(startIndex, startIndex + pageSize);
    }, [filteredEntries, currentPage, pageSize, groupBy]);

    const totalGivenCash = givenEntries.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const filteredGivenCash = filteredEntries.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedVillage('');
        setAmountRange('all');
        setGroupBy('none');
        setCurrentPage(1);
        setPageSize(20);
        sessionStorage.clear();
        window.history.replaceState(null, '', window.location.pathname);
    };

    const handleOpenAdd = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleSave = async (data, entryId) => {
        if (entryId) {
            return await onUpdateGivenMoi(entryId, data);
        } else {
            return await onRecordGivenMoi(data);
        }
    };

    // Excel Export (Filtered dataset + Multi-sheet tabs when grouped by Village)
    const handleExportExcel = () => {
        if (filteredEntries.length === 0) {
            alert('No filtered records available to export.');
            return;
        }

        const workbook = XLSX.utils.book_new();

        if (groupBy === 'village' && groupedData) {
            // Summary Tab
            const summaryRows = groupedData.map((g, idx) => ({
                'S.No': idx + 1,
                'Village (ஊர்)': g.key,
                'Total Entries (எண்ணிக்கை)': g.items.length,
                'Total Given Amount (₹)': g.totalAmount,
            }));
            const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Village_Summary');

            // Individual Village Tabs
            groupedData.forEach((group) => {
                const sheetData = group.items.map((tx, idx) => ({
                    'S.No': idx + 1,
                    'Recipient Name (பெயர்)': tx.recipientName,
                    'Village (ஊர்)': tx.village || '-',
                    'Gift Type (வகை)': tx.giftType || 'Cash',
                    'Gold Details (பொன் விபரம்)': tx.goldDetails || '-',
                    'Occasion (சுபநிகழ்ச்சி)': tx.occasion || '-',
                    'Gift Term (முறை)': tx.giftTerm || '1st Time',
                    'Amount Given (₹)': Number(tx.amount || 0),
                    'Given Date': new Date(tx.givenDate).toLocaleDateString('en-IN'),
                    'Notes': tx.notes || '-'
                }));
                const sheet = XLSX.utils.json_to_sheet(sheetData);
                const safeTabName = group.key.replace(/[\\/?*\[\]]/g, '').slice(0, 30);
                XLSX.utils.book_append_sheet(workbook, sheet, safeTabName);
            });
        } else {
            const exportData = filteredEntries.map((tx, idx) => ({
                'S.No': idx + 1,
                'Recipient Name (பெயர்)': tx.recipientName,
                'Village (ஊர்)': tx.village || '-',
                'Gift Type (வகை)': tx.giftType || 'Cash',
                'Gold Details (பொன் விபரம்)': tx.goldDetails || '-',
                'Occasion (சுபநிகழ்ச்சி)': tx.occasion || '-',
                'Gift Term (முறை)': tx.giftTerm || '1st Time',
                'Amount Given (₹)': Number(tx.amount || 0),
                'Given Date': new Date(tx.givenDate).toLocaleDateString('en-IN'),
                'Notes': tx.notes || '-'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Given_Moi_Gifts');
        }

        const fileName = `Given_Moi_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // PDF Export (Filtered dataset + Separate physical page per village when grouped)
    const handleExportPDF = () => {
        if (filteredEntries.length === 0) {
            alert('No filtered records available to export.');
            return;
        }

        const printWindow = window.open('', '_blank');
        let bodyHtml = '';

        if (groupBy === 'village' && groupedData) {
            bodyHtml = groupedData.map((group, gIdx) => {
                const rowsHtml = group.items.map((tx, idx) => `
                    <tr>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px;">
                            ${tx.recipientName}
                            ${tx.giftType === 'Gold' ? `<br/><span style="font-size: 10px; color: #D97706; font-weight: normal;">🪙 ${tx.goldDetails || 'Gold'}</span>` : ''}
                        </td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.village || '-'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.occasion || '-'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${tx.giftTerm || '1st Time'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #7C3AED; font-size: 12px;">₹ ${Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-size: 10px; color: #6B7280;">${new Date(tx.givenDate).toLocaleDateString('en-IN')}</td>
                    </tr>
                `).join('');

                return `
                    <div class="village-page" style="${gIdx < groupedData.length - 1 ? 'page-break-after: always; break-after: page;' : ''}">
                        <div class="header">
                            <div>
                                <h2>Given Moi Ledger (நாம் செய்த மொய்) - Village Report</h2>
                                <div class="meta">Village (ஊர்): <strong>${group.key}</strong> &nbsp;|&nbsp; Printed: ${new Date().toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        <div class="summary-box">
                            <div class="summary-item">Village Total Given: <span class="summary-val">₹ ${group.totalAmount.toLocaleString('en-IN')}</span></div>
                            <div class="summary-item">Total Entries: <strong>${group.items.length}</strong></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Recipient Name (பெயர்)</th>
                                    <th>Village (ஊர்)</th>
                                    <th>Occasion (சுபநிகழ்ச்சி)</th>
                                    <th>Term (முறை)</th>
                                    <th>Amount Given (₹)</th>
                                    <th>Given Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('');
        } else {
            const rowsHtml = filteredEntries.map((tx, idx) => `
                <tr>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px;">
                        ${tx.recipientName}
                        ${tx.giftType === 'Gold' ? `<br/><span style="font-size: 10px; color: #D97706; font-weight: normal;">🪙 ${tx.goldDetails || 'Gold'}</span>` : ''}
                    </td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.village || '-'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.occasion || '-'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${tx.giftTerm || '1st Time'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #7C3AED; font-size: 12px;">₹ ${Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-size: 10px; color: #6B7280;">${new Date(tx.givenDate).toLocaleDateString('en-IN')}</td>
                </tr>
            `).join('');

            bodyHtml = `
                <div class="header">
                    <div>
                        <h2>Given Moi Ledger (நாம் செய்த மொய் பட்டியல்)</h2>
                        <div class="meta">Generated on: ${new Date().toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="summary-item">Filtered Total Given: <span class="summary-val">₹ ${filteredGivenCash.toLocaleString('en-IN')}</span></div>
                    <div class="summary-item">Total Given Overall: <span class="summary-val" style="color: #6D28D9;">₹ ${totalGivenCash.toLocaleString('en-IN')}</span></div>
                    <div class="summary-item">Entries: <strong>${filteredEntries.length}</strong></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Recipient Name (பெயர்)</th>
                            <th>Village (ஊர்)</th>
                            <th>Occasion (சுபநிகழ்ச்சி)</th>
                            <th>Term (முறை)</th>
                            <th>Amount Given (₹)</th>
                            <th>Given Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Given Moi Ledger Report</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px; color: #111827; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; margin-bottom: 14px; }
                    h2 { margin: 0; color: #6D28D9; font-size: 18px; }
                    .meta { font-size: 11px; color: #6B7280; margin-top: 3px; }
                    .summary-box { background: #F3F4F6; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; border: 1px solid #E5E7EB; display: flex; gap: 18px; }
                    .summary-item { font-weight: 600; }
                    .summary-val { color: #7C3AED; font-size: 14px; font-weight: 800; }
                    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                    th { background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; letter-spacing: 0.5px; }
                    tr:nth-child(even) { background-color: #F9FAFB; }
                    .village-page { width: 100%; box-sizing: border-box; }
                </style>
            </head>
            <body>
                ${bodyHtml}
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (selectedVillage ? 1 : 0) + (amountRange !== 'all' ? 1 : 0) + (groupBy !== 'none' ? 1 : 0);

    return (
        <div className="view-content fade-in">
            {/* 🌟 COMPACT PAGE HEADER BAR 🌟 */}
            <div className="full-width-card glass-card compact-list-header mb-3">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-purple-sm">
                            <Send size={16} />
                        </div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Given Moi Ledger (நாம் செய்த மொய் பட்டியல்)</h2>
                            <span className="collection-pill-sm">
                                Total Given: <strong className="text-purple">₹ {totalGivenCash.toLocaleString('en-IN')}</strong> ({givenEntries.length} Entries Recorded)
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        {/* Quick Search */}
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <TransliteratedInput
                                value={searchQuery}
                                onChange={(val) => {
                                    setSearchQuery(val);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search recipient, village..."
                                className="search-input-sm"
                            />
                        </div>

                        {/* Export Excel */}
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel} title="Export to Excel">
                            <FileSpreadsheet size={15} /> Excel
                        </button>

                        {/* Export PDF */}
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF} title="Print PDF">
                            <Printer size={15} /> PDF
                        </button>

                        {/* Filter Toggle */}
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        >
                            <Filter size={15} />
                            <span>Filters</span>
                            {activeFilterCount > 0 && <span className="active-count-badge">{activeFilterCount}</span>}
                            {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Add Given Gift Button */}
                        {canAdd && (
                            <button className="modern-btn btn-new-event-neon" onClick={handleOpenAdd}>
                                <Plus size={16} /> Record Given Gift
                            </button>
                        )}
                    </div>
                </div>

                {/* 🔍 EXPANDABLE FILTER DRAWER 🔍 */}
                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-grid">
                            <div className="filter-field-group">
                                <label className="filter-field-label flex-align">
                                    <Search size={13} className="text-purple" /> Search Keyword (பெயர் / ஊர்)
                                </label>
                                <TransliteratedInput
                                    value={searchQuery}
                                    onChange={(val) => {
                                        setSearchQuery(val);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Type English for Tamil..."
                                    className="modern-control-sm"
                                />
                            </div>

                            <div className="filter-field-group">
                                <label className="filter-field-label">Filter by Village (ஊர்)</label>
                                <select
                                    className="modern-control-sm"
                                    value={selectedVillage}
                                    onChange={(e) => {
                                        setSelectedVillage(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Villages ({uniqueVillages.length})</option>
                                    {uniqueVillages.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-field-group">
                                <label className="filter-field-label">Amount Range (தொகை வரம்பு)</label>
                                <select
                                    className="modern-control-sm"
                                    value={amountRange}
                                    onChange={(e) => {
                                        setAmountRange(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Amount Slabs</option>
                                    <option value="<500">Less than ₹500</option>
                                    <option value="501-2000">₹501 - ₹2,000</option>
                                    <option value="2001-5000">₹2,001 - ₹5,000</option>
                                    <option value=">5000">Above ₹5,000</option>
                                </select>
                            </div>

                            <div className="filter-field-group">
                                <label className="filter-field-label flex-align">
                                    <Layers size={13} className="text-purple" /> Group Records By
                                </label>
                                <select
                                    className="modern-control-sm"
                                    value={groupBy}
                                    onChange={(e) => {
                                        setGroupBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="none">None (Standard Flat List)</option>
                                    <option value="village">Group by Village (ஊர் வாரியாக)</option>
                                    <option value="occasion">Group by Occasion (சுபநிகழ்ச்சி வாரியாக)</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-summary-row mt-3 flex-align justify-between">
                            <span className="summary-text-sm">
                                Showing <strong>{filteredEntries.length}</strong> of {givenEntries.length} entries • Filtered Subtotal: <strong className="text-purple">₹ {filteredGivenCash.toLocaleString('en-IN')}</strong>
                            </span>

                            <button className="reset-btn-sm" onClick={handleResetFilters}>
                                <RotateCcw size={13} /> Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 📋 TABLE VIEW 📋 */}
            <div className="full-width-card glass-card">
                <div className="table-responsive">
                    <table className="custom-table modern-table compact-table">
                        <thead>
                            <tr>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Recipient Name</span>
                                        <span className="th-ta">பெயர்</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Village</span>
                                        <span className="th-ta">ஊர்</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Occasion / Function</span>
                                        <span className="th-ta">சுபநிகழ்ச்சி</span>
                                    </div>
                                </th>
                                <th className="text-center">
                                    <div className="th-bilingual center">
                                        <span className="th-en">Gift Term</span>
                                        <span className="th-ta">முறை</span>
                                    </div>
                                </th>
                                <th className="text-right">
                                    <div className="th-bilingual right">
                                        <span className="th-en">Given Amount</span>
                                        <span className="th-ta">நாம் கொடுத்த தொகை ₹</span>
                                    </div>
                                </th>
                                <th className="text-right">
                                    <div className="th-bilingual right">
                                        <span className="th-en">Given Date</span>
                                        <span className="th-ta">கொடுத்த தேதி</span>
                                    </div>
                                </th>
                                <th className="text-center">
                                    <div className="th-bilingual center">
                                        <span className="th-en">Actions</span>
                                        <span className="th-ta">செயல்கள்</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-6">
                                        No given gifts match your filters. Click <strong>Record Given Gift</strong> to add your first entry!
                                    </td>
                                </tr>
                            ) : groupBy !== 'none' ? (
                                groupedData.map((group) => (
                                    <React.Fragment key={group.key}>
                                        <tr className="group-header-row">
                                            <td colSpan="7">
                                                <div className="group-title-bar">
                                                    <span className="group-name">
                                                        <MapPin size={14} className="text-purple" />
                                                        <strong>{group.key}</strong> ({group.items.length} Entries)
                                                    </span>
                                                    <span className="group-subtotal">
                                                        Subtotal: <strong className="text-purple">₹ {group.totalAmount.toLocaleString('en-IN')}</strong>
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.items.map((tx) => (
                                            <tr key={tx.id} className="table-row-hover grouped-item-row">
                                                <td className="text-left font-semibold pl-6">
                                                    <div>{tx.recipientName}</div>
                                                    {tx.giftType === 'Gold' ? (
                                                        <div className="text-xs text-gold flex-align mt-1">
                                                            <Coins size={12} /> <span className="gold-detail-cell">{tx.goldDetails || 'Gold Gift'}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-purple flex-align mt-1">
                                                            <IndianRupee size={12} /> <span>Cash Gift</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>
                                                <td className="text-left">{tx.occasion || '-'}</td>
                                                <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>
                                                <td className="text-right amount-col text-purple">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                                                <td className="text-right text-muted text-xs">
                                                    {new Date(tx.givenDate).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                        {canEdit && (
                                                            <button
                                                                title="Edit Entry"
                                                                onClick={() => handleEdit(tx)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.14)', color: '#A78BFA', transition: 'all 0.18s ease' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.45)'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.14)'; e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.boxShadow = 'none'; }}
                                                            >
                                                                <Edit2 size={12} /> Edit
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                title="Delete Entry"
                                                                onClick={() => onDeleteGivenMoi && onDeleteGivenMoi(tx.id)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.14)', color: '#FB7185', transition: 'all 0.18s ease' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = '#F43F5E'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,63,94,0.45)'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.14)'; e.currentTarget.style.color = '#FB7185'; e.currentTarget.style.boxShadow = 'none'; }}
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                paginatedEntries.map((tx) => (
                                    <tr key={tx.id} className="table-row-hover">
                                        <td className="text-left font-semibold">
                                            <div>{tx.recipientName}</div>
                                            {tx.giftType === 'Gold' ? (
                                                <div className="text-xs text-gold flex-align mt-1">
                                                    <Coins size={12} /> <span className="gold-detail-cell">{tx.goldDetails || 'Gold Gift'}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-purple flex-align mt-1">
                                                    <IndianRupee size={12} /> <span>Cash Gift</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>
                                        <td className="text-left">{tx.occasion || '-'}</td>
                                        <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>
                                        <td className="text-right amount-col text-purple">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                                        <td className="text-right text-muted text-xs">
                                            {new Date(tx.givenDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                {canEdit && (
                                                    <button
                                                        title="Edit Entry"
                                                        onClick={() => handleEdit(tx)}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.14)', color: '#A78BFA', transition: 'all 0.18s ease' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.45)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.14)'; e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <Edit2 size={12} /> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        title="Delete Entry"
                                                        onClick={() => onDeleteGivenMoi && onDeleteGivenMoi(tx.id)}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.14)', color: '#FB7185', transition: 'all 0.18s ease' }}
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
                {groupBy === 'none' && totalRecords > 0 && (
                    <div className="pagination-footer-container mt-3 pt-3 border-t">
                        <div className="pagination-info">
                            Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</strong> to{' '}
                            <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> records
                        </div>

                        <div className="pagination-controls">
                            <div className="page-size-selector">
                                <span>Rows per page:</span>
                                <select
                                    className="modern-control-sm page-select"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20 (Default)</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="page-nav-btns">
                                <button
                                    className="page-nav-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span className="page-indicator-pill">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="page-nav-btn"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <GivenMoiModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingEntry={editingEntry}
                eventId={event?.id}
                settings={settings}
            />
        </div>
    );
};
