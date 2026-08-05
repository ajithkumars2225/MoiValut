import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    IndianRupee,
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
    User,
    Edit2,
    Trash2,
    FileSpreadsheet,
    Printer,
    Upload,
} from 'lucide-react';
import { MoiEntryModal } from '../components/modals/MoiEntryModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { TransliteratedInput } from '../components/TransliteratedInput';
import { BulkUploadModal } from '../components/modals/BulkUploadModal';

// Helper for Filter State Portability (URL Query Params & Session Storage)
const getInitialState = (key, fallback) => {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has(key)) return params.get(key);
        const stored = sessionStorage.getItem(`moi_filter_${key}`);
        return stored !== null ? stored : fallback;
    } catch {
        return fallback;
    }
};

export const MoiEntryView = ({
    event,
    transactions,
    givenEntries = [],
    onRecordMoi,
    onUpdateMoi,
    onDeleteMoi,
    settings = {},
    privileges,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const canAdd    = !privileges || privileges.add === true;
    const canEdit   = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;

    // 🌐 PORTABLE FILTER & SEARCH STATES (URL & SESSION STORAGE SYNCED) 🌐
    const [searchQuery, setSearchQuery] = useState(() => getInitialState('search', ''));
    const [selectedVillage, setSelectedVillage] = useState(() => getInitialState('village', ''));
    const [amountRange, setAmountRange] = useState(() => getInitialState('amount', 'all'));
    const [groupBy, setGroupBy] = useState(() => getInitialState('group', 'none')); // 'none' | 'village' | 'name'
    const [isFilterExpanded, setIsFilterExpanded] = useState(() => getInitialState('expanded', 'false') === 'true');

    // Pagination State (Default 20 records per page)
    const [currentPage, setCurrentPage] = useState(() => Number(getInitialState('page', 1)));
    const [pageSize, setPageSize] = useState(() => Number(getInitialState('pageSize', 20)));

    // 🔄 Sync Filter State to URL Query String & Session Storage for Portability 🔄
    useEffect(() => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (selectedVillage) params.set('village', selectedVillage);
            if (amountRange && amountRange !== 'all') params.set('amount', amountRange);
            if (groupBy && groupBy !== 'none') params.set('group', groupBy);
            if (currentPage > 1) params.set('page', currentPage);
            if (pageSize !== 20) params.set('pageSize', pageSize);

            // Save to sessionStorage
            sessionStorage.setItem('moi_filter_search', searchQuery);
            sessionStorage.setItem('moi_filter_village', selectedVillage);
            sessionStorage.setItem('moi_filter_amount', amountRange);
            sessionStorage.setItem('moi_filter_group', groupBy);
            sessionStorage.setItem('moi_filter_expanded', isFilterExpanded.toString());
            sessionStorage.setItem('moi_filter_page', currentPage.toString());
            sessionStorage.setItem('moi_filter_pageSize', pageSize.toString());

            // Sync browser URL search query without reloading
            const queryString = params.toString();
            const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
            window.history.replaceState(null, '', newUrl);
        } catch (e) {
            console.error('Error syncing filter state:', e);
        }
    }, [searchQuery, selectedVillage, amountRange, groupBy, isFilterExpanded, currentPage, pageSize]);

    if (!event) {
        return (
            <div className="empty-event-hero">
                <div className="hero-card">
                    <h2>No Event Selected</h2>
                    <p>Please select an event from the top header to start recording cash gifts.</p>
                </div>
            </div>
        );
    }

    // Unique Villages List for Dropdown
    const uniqueVillages = useMemo(() => {
        const set = new Set();
        transactions.forEach((tx) => {
            if (tx.village) set.add(tx.village);
        });
        return Array.from(set).sort();
    }, [transactions]);

    // Filtering Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            // Search Query Filter
            const q = searchQuery.toLowerCase().trim();
            if (q) {
                const matchName = tx.contributorName.toLowerCase().includes(q);
                const matchVillage = tx.village && tx.village.toLowerCase().includes(q);
                const matchAmount = tx.amount.toString().includes(q);
                const matchTerm = tx.giftTerm && tx.giftTerm.toLowerCase().includes(q);
                if (!matchName && !matchVillage && !matchAmount && !matchTerm) return false;
            }

            // Village Filter
            if (selectedVillage && tx.village !== selectedVillage) {
                return false;
            }

            // Amount Range Filter
            const amt = Number(tx.amount || 0);
            if (amountRange === '<500' && amt >= 500) return false;
            if (amountRange === '501-2000' && (amt < 501 || amt > 2000)) return false;
            if (amountRange === '2001-5000' && (amt < 2001 || amt > 5000)) return false;
            if (amountRange === '>5000' && amt <= 5000) return false;

            return true;
        });
    }, [transactions, searchQuery, selectedVillage, amountRange]);

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;

        const groups = {};
        filteredTransactions.forEach((tx) => {
            const key = groupBy === 'village' ? (tx.village || 'Unspecified Village') : tx.contributorName;
            if (!groups[key]) {
                groups[key] = { key, items: [], totalAmount: 0 };
            }
            groups[key].items.push(tx);
            groups[key].totalAmount += Number(tx.amount || 0);
        });

        return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [filteredTransactions, groupBy]);

    // Pagination Calculation (When Grouping is 'none')
    const totalRecords = filteredTransactions.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginatedTransactions = useMemo(() => {
        if (groupBy !== 'none') return filteredTransactions;
        const startIndex = (currentPage - 1) * pageSize;
        return filteredTransactions.slice(startIndex, startIndex + pageSize);
    }, [filteredTransactions, currentPage, pageSize, groupBy]);

    const totalCash = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalReturnCash = transactions.reduce((sum, t) => sum + Number(t.returnAmount || 0), 0);
    const filteredCash = filteredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

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
        setEditingTx(null);
        setIsModalOpen(true);
    };

    const handleEdit = (tx) => {
        setEditingTx(tx);
        setIsModalOpen(true);
    };

    const handleSave = async (data, txId) => {
        if (txId) {
            return await onUpdateMoi(txId, data);
        } else {
            return await onRecordMoi(data);
        }
    };

    // 📊 EXCEL EXPORT HANDLER (EXPORTS FILTERED DATA + MULTI-SHEET TABS WHEN VILLAGE GROUPED) 📊
    const handleExportExcel = () => {
        if (filteredTransactions.length === 0) {
            window.customAlert('No filtered records available to export.');
            return;
        }

        const workbook = XLSX.utils.book_new();

        if (groupBy === 'village' && groupedData) {
            // 1. Summary Sheet Tab
            const summaryRows = groupedData.map((g, idx) => ({
                'S.No': idx + 1,
                'Village (ஊர்)': g.key,
                'Total Entries (எண்ணிக்கை)': g.items.length,
                'Total Gift Amount (₹)': g.totalAmount,
                'Prev Returned Total (₹)': g.items.reduce((s, i) => s + Number(i.returnAmount || 0), 0)
            }));
            const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Village_Summary');

            // 2. Individual Worksheet Tab for Each Village!
            groupedData.forEach((group) => {
                const sheetData = group.items.map((tx, idx) => ({
                    'S.No': idx + 1,
                    'Contributor Name (பெயர்)': tx.contributorName,
                    'Village (ஊர்)': tx.village || '-',
                    'Gift Term (முறை)': tx.giftTerm || '1st Time',
                    'Gift Amount (₹)': Number(tx.amount || 0),
                    'Prev Return (₹)': Number(tx.returnAmount || 0),
                    'Date & Time': new Date(tx.transactionDate).toLocaleString('en-IN')
                }));
                const sheet = XLSX.utils.json_to_sheet(sheetData);
                // Sanitize tab name (Excel limit 31 chars)
                const safeTabName = group.key.replace(/[\\/?*\[\]]/g, '').slice(0, 30);
                XLSX.utils.book_append_sheet(workbook, sheet, safeTabName);
            });
        } else {
            // Standard Single Sheet for Filtered Dataset
            const exportData = filteredTransactions.map((tx, idx) => ({
                'S.No': idx + 1,
                'Contributor Name (பெயர்)': tx.contributorName,
                'Village (ஊர்)': tx.village || '-',
                'Gift Term (முறை)': tx.giftTerm || '1st Time',
                'Gift Amount (₹)': Number(tx.amount || 0),
                'Prev Return (₹)': Number(tx.returnAmount || 0),
                'Date & Time': new Date(tx.transactionDate).toLocaleString('en-IN')
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered_Gifts');
        }

        const fileName = `${(event?.name || 'Moi_Event').replace(/\s+/g, '_')}_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // 📄 PDF PRINT EXPORT HANDLER (EXPORTS FILTERED DATA + SEPARATE PAGE BREAK PER VILLAGE WHEN GROUPED) 📄
    const handleExportPDF = () => {
        if (filteredTransactions.length === 0) {
            window.customAlert('No filtered records available to export.');
            return;
        }

        const printWindow = window.open('', '_blank');
        let bodyHtml = '';

        if (groupBy === 'village' && groupedData) {
            // Grouped by Village -> Separate physical page per village! 📄
            bodyHtml = groupedData.map((group, gIdx) => {
                const rowsHtml = group.items.map((tx, idx) => `
                    <tr>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px;">${tx.contributorName}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.village || '-'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${tx.giftTerm || '1st Time'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #059669; font-size: 12px;">₹ ${Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; color: #D97706; font-size: 11px;">${tx.returnAmount ? `₹ ${Number(tx.returnAmount).toLocaleString('en-IN')}` : '-'}</td>
                        <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-size: 10px; color: #6B7280;">${new Date(tx.transactionDate).toLocaleString('en-IN')}</td>
                    </tr>
                `).join('');

                const villageReturnTotal = group.items.reduce((s, i) => s + Number(i.returnAmount || 0), 0);

                return `
                    <div class="village-page" style="${gIdx < groupedData.length - 1 ? 'page-break-after: always; break-after: page;' : ''}">
                        <div class="header">
                            <div>
                                <h2>${event?.name || 'Moi Event'} - Village Cash Gifts</h2>
                                <div class="meta">Village (ஊர்): <strong>${group.key}</strong> &nbsp;|&nbsp; Printed: ${new Date().toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        <div class="summary-box">
                            <div class="summary-item">Village Total: <span class="summary-val">₹ ${group.totalAmount.toLocaleString('en-IN')}</span></div>
                            <div class="summary-item">Prev Returned: <span class="summary-val" style="color: #D97706;">₹ ${villageReturnTotal.toLocaleString('en-IN')}</span></div>
                            <div class="summary-item">Entries: <strong>${group.items.length}</strong></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Contributor Name (பெயர்)</th>
                                    <th>Village (ஊர்)</th>
                                    <th>Term (முறை)</th>
                                    <th>Gift Amount (₹)</th>
                                    <th>Prev Return (₹)</th>
                                    <th>Date & Time</th>
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
            // Standard Single PDF Report for Filtered Dataset
            const rowsHtml = filteredTransactions.map((tx, idx) => `
                <tr>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px;">${tx.contributorName}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.village || '-'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${tx.giftTerm || '1st Time'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #059669; font-size: 12px;">₹ ${Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; color: #D97706; font-size: 11px;">${tx.returnAmount ? `₹ ${Number(tx.returnAmount).toLocaleString('en-IN')}` : '-'}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-size: 10px; color: #6B7280;">${new Date(tx.transactionDate).toLocaleString('en-IN')}</td>
                </tr>
            `).join('');

            bodyHtml = `
                <div class="header">
                    <div>
                        <h2>${event?.name || 'Moi Event'} - Filtered Cash Gifts List (பண மொய் பட்டியல்)</h2>
                        <div class="meta">Generated on: ${new Date().toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="summary-item">Filtered Total: <span class="summary-val">₹ ${filteredCash.toLocaleString('en-IN')}</span></div>
                    <div class="summary-item">Prev Returned Total: <span class="summary-val" style="color: #D97706;">₹ ${totalReturnCash.toLocaleString('en-IN')}</span></div>
                    <div class="summary-item">Filtered Entries: <strong>${filteredTransactions.length}</strong></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Contributor Name (பெயர்)</th>
                            <th>Village (ஊர்)</th>
                            <th>Term (முறை)</th>
                            <th>Gift Amount (₹)</th>
                            <th>Prev Return (₹)</th>
                            <th>Date & Time</th>
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
                <title>${event?.name || 'Moi'} - Cash Gifts Report</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px; color: #111827; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; margin-bottom: 14px; }
                    h2 { margin: 0; color: #6D28D9; font-size: 18px; }
                    .meta { font-size: 11px; color: #6B7280; margin-top: 3px; }
                    .summary-box { background: #F3F4F6; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; border: 1px solid #E5E7EB; display: flex; gap: 18px; }
                    .summary-item { font-weight: 600; }
                    .summary-val { color: #059669; font-size: 14px; font-weight: 800; }
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
                            <IndianRupee size={16} />
                        </div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Moi Cash Gifts (பண மொய் பட்டியல்)</h2>
                            <span className="collection-pill-sm">
                                Total Collection: <strong className="text-emerald">₹ {totalCash.toLocaleString('en-IN')}</strong> • Prev Returned: <strong className="text-gold">₹ {totalReturnCash.toLocaleString('en-IN')}</strong> ({transactions.length} Entries)
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        {/* Quick Search Input with Tamil Transliteration */}
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <TransliteratedInput
                                value={searchQuery}
                                onChange={(val) => {
                                    setSearchQuery(val);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search name, village (e.g. Ramesh)..."
                                className="search-input-sm"
                            />
                        </div>

                        {/* Export Excel Button */}
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel} title="Export Filtered Data to Excel">
                            <FileSpreadsheet size={15} /> Excel
                        </button>

                        {/* Export PDF Button */}
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF} title="Print or Export Filtered PDF">
                            <Printer size={15} /> PDF
                        </button>

                        {/* Filter Toggle Button */}
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        >
                            <Filter size={15} />
                            <span>Advanced Filters</span>
                            {activeFilterCount > 0 && <span className="active-count-badge">{activeFilterCount}</span>}
                            {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Bulk Load Button */}
                        {canAdd && (
                            <button 
                                className="modern-btn btn-export-excel" 
                                style={{ border: '1px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.08)', color: '#A78BFA' }}
                                onClick={() => setIsBulkModalOpen(true)}
                                title="Bulk Load Entries from CSV"
                            >
                                <Upload size={15} /> Bulk Upload (CSV)
                            </button>
                        )}

                        {/* Add Record Button */}
                        {canAdd && (
                            <button className="modern-btn btn-new-event-neon" onClick={handleOpenAdd}>
                                <Plus size={16} /> Record Cash Gift
                            </button>
                        )}
                    </div>
                </div>

                {/* 🔍 EXPANDABLE ADVANCED FILTER & GROUPING PANEL WITH BILINGUAL SEARCH 🔍 */}
                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-grid">
                            {/* Bilingual English / Tamil Search Field */}
                            <div className="filter-field-group">
                                <label className="filter-field-label flex-align">
                                    <Search size={13} className="text-purple" /> Search Keyword (பெயர் / ஊர் தேடல்)
                                </label>
                                <TransliteratedInput
                                    value={searchQuery}
                                    onChange={(val) => {
                                        setSearchQuery(val);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Type in English (e.g. Ramesh) for Tamil..."
                                    className="modern-control-sm"
                                />
                            </div>

                            {/* Village Selector */}
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

                            {/* Amount Slab Selector */}
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

                            {/* Grouping Selector */}
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
                                    <option value="name">Group by Contributor Name (பெயர் வாரியாக)</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Status Summary Bar & Reset Action */}
                        <div className="filter-summary-row mt-3 flex-align justify-between">
                            <span className="summary-text-sm">
                                Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} entries • Filtered Subtotal: <strong className="text-emerald">₹ {filteredCash.toLocaleString('en-IN')}</strong>
                            </span>

                            <button className="reset-btn-sm" onClick={handleResetFilters}>
                                <RotateCcw size={13} /> Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 📋 7-COLUMN TABLE WITH STACKED BILINGUAL HEADERS & ROW ACTIONS 📋 */}
            <div className="full-width-card glass-card">
                <div className="table-responsive">
                    <table className="custom-table modern-table compact-table">
                        <thead>
                            <tr>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Contributor Name</span>
                                        <span className="th-ta">பெயர்</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Village</span>
                                        <span className="th-ta">ஊர்</span>
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
                                        <span className="th-en">Gift Amount</span>
                                        <span className="th-ta">மொய் தொகை ₹</span>
                                    </div>
                                </th>
                                <th className="text-right">
                                    <div className="th-bilingual right">
                                        <span className="th-en">Prev Returned Moi</span>
                                        <span className="th-ta">முந்தைய மொய் ₹</span>
                                    </div>
                                </th>
                                <th className="text-right">
                                    <div className="th-bilingual right">
                                        <span className="th-en">Date & Time</span>
                                        <span className="th-ta">தேதி & நேரம்</span>
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
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-6">
                                        No cash gifts match your filters. Click <strong>Reset Filters</strong> or add a new gift!
                                    </td>
                                </tr>
                            ) : groupBy !== 'none' ? (
                                /* GROUPED ACCORDION VIEW */
                                groupedData.map((group) => (
                                    <React.Fragment key={group.key}>
                                        <tr className="group-header-row">
                                            <td colSpan="7">
                                                <div className="group-title-bar">
                                                    <span className="group-name">
                                                        {groupBy === 'village' ? <MapPin size={14} className="text-gold" /> : <User size={14} className="text-purple" />}
                                                        <strong>{group.key}</strong> ({group.items.length} Entries)
                                                    </span>
                                                    <span className="group-subtotal">
                                                        Subtotal: <strong className="text-emerald">₹ {group.totalAmount.toLocaleString('en-IN')}</strong>
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.items.map((tx) => (
                                            <tr key={tx.transactionId} className="table-row-hover grouped-item-row">
                                                <td className="text-left font-semibold pl-6">{tx.contributorName}</td>
                                                <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>
                                                <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>
                                                <td className="text-right amount-col">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                                                <td className="text-right">
                                                    {tx.returnAmount ? (
                                                        <span className="return-amount-col">₹ {Number(tx.returnAmount).toLocaleString('en-IN')}</span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="text-right text-muted text-xs">
                                                    {new Date(tx.transactionDate).toLocaleString('en-IN')}
                                                </td>
                                                <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                        <button
                                                            title="Print Receipt"
                                                            onClick={() => setSelectedReceipt(tx)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.14)', color: '#818CF8', transition: 'all 0.18s ease' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.45)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.color = '#818CF8'; e.currentTarget.style.boxShadow = 'none'; }}
                                                        >
                                                            <Printer size={12} /> Print
                                                        </button>
                                                        {canEdit && (
                                                            <button
                                                                title="Edit Cash Gift"
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
                                                                title="Delete Cash Gift"
                                                                onClick={() => onDeleteMoi && onDeleteMoi(tx.transactionId)}
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
                                /* UNGROUPED PAGINATED VIEW */
                                paginatedTransactions.map((tx) => (
                                    <tr key={tx.transactionId} className="table-row-hover">
                                        <td className="text-left font-semibold">{tx.contributorName}</td>
                                        <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>
                                        <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>
                                        <td className="text-right amount-col">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                                        <td className="text-right">
                                            {tx.returnAmount ? (
                                                <span className="return-amount-col">₹ {Number(tx.returnAmount).toLocaleString('en-IN')}</span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="text-right text-muted text-xs">
                                            {new Date(tx.transactionDate).toLocaleString('en-IN')}
                                        </td>
                                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                <button
                                                    title="Print Receipt"
                                                    onClick={() => setSelectedReceipt(tx)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.14)', color: '#818CF8', transition: 'all 0.18s ease' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.color = '#FFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.45)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.color = '#818CF8'; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    <Printer size={12} /> Print
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        title="Edit Cash Gift"
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
                                                        title="Delete Cash Gift"
                                                        onClick={() => onDeleteMoi && onDeleteMoi(tx.transactionId)}
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

                {/* 📄 PROPER PAGINATION FOOTER (DEFAULT 20 RECORDS PER PAGE) 📄 */}
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

            {/* Add / Edit Modern Modal Popup */}
            <MoiEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingTx={editingTx}
                eventId={event.id}
                settings={settings}
                givenEntries={givenEntries}
            />

            {/* Printable Receipt Popup */}
            <ReceiptModal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                data={selectedReceipt}
                event={event}
                givenEntries={givenEntries}
            />

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onImport={async (data) => {
                    await onRecordMoi({
                        contributorName: data.name,
                        village: data.village,
                        amount: Number(data.amount || 0),
                        giftTerm: data.giftTerm || '1st Time',
                        returnAmount: Number(data.returnAmount || 0),
                        notes: data.notes || '',
                        eventId: event.id
                    });
                }}
                templateType="moi"
            />
        </div>
    );
};
