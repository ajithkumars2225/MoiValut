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
    Upload,
} from 'lucide-react';
import { GivenMoiModal } from '../components/modals/GivenMoiModal';
import { TransliteratedInput } from '../components/TransliteratedInput';
import { BulkUploadModal } from '../components/modals/BulkUploadModal';
import { ColumnToggleDropdown } from '../components/ColumnToggleDropdown';
import { SortableTh } from '../components/SortableTh';

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
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const canAdd    = !privileges || privileges.add === true;
    const canEdit   = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;

    // 🌐 PORTABLE FILTER & SEARCH STATES (URL & SESSION STORAGE SYNCED) 🌐
    const [searchQuery, setSearchQuery] = useState(() => getInitialState('search', ''));
    const [selectedVillage, setSelectedVillage] = useState(() => getInitialState('village', ''));
    const [selectedOccasion, setSelectedOccasion] = useState('all');
    const [selectedGiftType, setSelectedGiftType] = useState('all');
    const [selectedTerm, setSelectedTerm] = useState('all');
    const [amountOp, setAmountOp] = useState('all'); // 'all' | '=' | '>' | '>=' | '<' | '<=' | '!=' | 'between'
    const [amountVal, setAmountVal] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [notesQuery, setNotesQuery] = useState('');
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
            if (groupBy && groupBy !== 'none') params.set('group', groupBy);
            if (currentPage > 1) params.set('page', currentPage);
            if (pageSize !== 20) params.set('pageSize', pageSize);

            sessionStorage.setItem('given_filter_search', searchQuery);
            sessionStorage.setItem('given_filter_village', selectedVillage);
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
    }, [searchQuery, selectedVillage, groupBy, isFilterExpanded, currentPage, pageSize]);

    // Unique Villages List
    const uniqueVillages = useMemo(() => {
        const set = new Set();
        givenEntries.forEach((tx) => {
            if (tx.village) set.add(tx.village);
        });
        return Array.from(set).sort();
    }, [givenEntries]);

    // Unique Occasions List
    const uniqueOccasions = useMemo(() => {
        const set = new Set();
        givenEntries.forEach((tx) => {
            if (tx.occasion) set.add(tx.occasion);
        });
        return Array.from(set).sort();
    }, [givenEntries]);

    // Unique Terms List
    const uniqueTerms = useMemo(() => {
        const set = new Set();
        givenEntries.forEach((tx) => {
            if (tx.giftTerm) set.add(tx.giftTerm);
        });
        return Array.from(set).sort();
    }, [givenEntries]);

    // Comprehensive Filtering Logic across all columns with Mathematical Amount Operations
    const filteredEntries = useMemo(() => {
        return givenEntries.filter((tx) => {
            const q = searchQuery.toLowerCase().trim();
            if (q) {
                const matchName = tx.recipientName.toLowerCase().includes(q);
                const matchVillage = tx.village && tx.village.toLowerCase().includes(q);
                const matchOccasion = tx.occasion && tx.occasion.toLowerCase().includes(q);
                const matchGold = tx.goldDetails && tx.goldDetails.toLowerCase().includes(q);
                const matchAmount = tx.amount.toString().includes(q);
                const matchNotes = tx.notes && tx.notes.toLowerCase().includes(q);
                if (!matchName && !matchVillage && !matchOccasion && !matchGold && !matchAmount && !matchNotes) return false;
            }

            if (selectedVillage && tx.village !== selectedVillage) return false;
            if (selectedOccasion && selectedOccasion !== 'all' && (tx.occasion || '') !== selectedOccasion) return false;
            if (selectedGiftType && selectedGiftType !== 'all' && (tx.giftType || 'Cash') !== selectedGiftType) return false;
            if (selectedTerm && selectedTerm !== 'all' && (tx.giftTerm || '1st Time') !== selectedTerm) return false;

            // Mathematical Amount Operations Filter
            const amt = Number(tx.amount || 0);
            if (amountOp === '=') {
                if (amountVal !== '' && amt !== Number(amountVal)) return false;
            } else if (amountOp === '>') {
                if (amountVal !== '' && amt <= Number(amountVal)) return false;
            } else if (amountOp === '>=') {
                if (amountVal !== '' && amt < Number(amountVal)) return false;
            } else if (amountOp === '<') {
                if (amountVal !== '' && amt >= Number(amountVal)) return false;
            } else if (amountOp === '<=') {
                if (amountVal !== '' && amt > Number(amountVal)) return false;
            } else if (amountOp === '!=') {
                if (amountVal !== '' && amt === Number(amountVal)) return false;
            } else if (amountOp === 'between') {
                if (minAmount !== '' && amt < Number(minAmount)) return false;
                if (maxAmount !== '' && amt > Number(maxAmount)) return false;
            }

            if (notesQuery.trim()) {
                const nq = notesQuery.toLowerCase().trim();
                if (!tx.notes || !tx.notes.toLowerCase().includes(nq)) return false;
            }

            return true;
        });
    }, [givenEntries, searchQuery, selectedVillage, selectedOccasion, selectedGiftType, selectedTerm, amountOp, amountVal, minAmount, maxAmount, notesQuery]);

    // Reset Filters Helper
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedVillage('');
        setSelectedOccasion('all');
        setSelectedGiftType('all');
        setSelectedTerm('all');
        setAmountOp('all');
        setAmountVal('');
        setMinAmount('');
        setMaxAmount('');
        setNotesQuery('');
        setGroupBy('none');
        setCurrentPage(1);
    };

    // 📊 TABLE COLUMN CONFIGURATION & VISIBILITY 📊
    const GIVEN_MOI_COLUMNS = [
        { id: 'recipientName', labelEn: 'Recipient Name', labelTa: 'பெயர்' },
        { id: 'village', labelEn: 'Village', labelTa: 'ஊர்' },
        { id: 'occasion', labelEn: 'Occasion / Function', labelTa: 'சுபநிகழ்ச்சி' },
        { id: 'giftTerm', labelEn: 'Gift Term', labelTa: 'முறை' },
        { id: 'amount', labelEn: 'Given Amount', labelTa: 'நாம் கொடுத்த தொகை ₹' },
        { id: 'givenDate', labelEn: 'Given Date', labelTa: 'கொடுத்த தேதி' },
        { id: 'notes', labelEn: 'Notes', labelTa: 'குறிப்பு', defaultVisible: false },
        { id: 'actions', labelEn: 'Actions', labelTa: 'செயல்கள்' }
    ];

    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('given_visible_columns');
            return saved ? JSON.parse(saved) : {
                recipientName: true,
                village: true,
                occasion: true,
                giftTerm: true,
                amount: true,
                givenDate: true,
                notes: false,
                actions: true
            };
        } catch {
            return {
                recipientName: true,
                village: true,
                occasion: true,
                giftTerm: true,
                amount: true,
                givenDate: true,
                notes: false,
                actions: true
            };
        }
    });

    const handleVisibleColumnsChange = (newCols) => {
        setVisibleColumns(newCols);
        try {
            localStorage.setItem('given_visible_columns', JSON.stringify(newCols));
        } catch (e) {
            console.error(e);
        }
    };

    // 🔀 SORTING STATE 🔀
    const [sortField, setSortField] = useState('givenDate');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedEntries = useMemo(() => {
        if (!sortField || !sortDirection) return filteredEntries;

        return [...filteredEntries].sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (sortField === 'amount') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else if (sortField === 'givenDate') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB, 'ta')
                    : valB.localeCompare(valA, 'ta');
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredEntries, sortField, sortDirection]);

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;

        const groups = {};
        sortedEntries.forEach((tx) => {
            const key = groupBy === 'village' ? (tx.village || 'Unspecified Village') : (tx.occasion || 'General Occasion');
            if (!groups[key]) {
                groups[key] = { key, items: [], totalAmount: 0 };
            }
            groups[key].items.push(tx);
            groups[key].totalAmount += Number(tx.amount || 0);
        });

        return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [sortedEntries, groupBy]);

    // Pagination Calculation
    const totalRecords = sortedEntries.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginatedEntries = useMemo(() => {
        if (groupBy !== 'none') return sortedEntries;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedEntries.slice(startIndex, startIndex + pageSize);
    }, [sortedEntries, currentPage, pageSize, groupBy]);

    const totalGivenCash = givenEntries.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const filteredGivenCash = filteredEntries.reduce((sum, t) => sum + Number(t.amount || 0), 0);
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

    // Helper to generate dynamic PDF table header according to visibleColumns
    const getPdfHeaderHtml = () => {
        let ths = `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: center;"># (வ.எண்)</th>`;
        if (visibleColumns.recipientName !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: left;">Recipient Name (பெறுபவர் பெயர்)</th>`;
        if (visibleColumns.village !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: left;">Village (ஊர் பெயர்)</th>`;
        if (visibleColumns.occasion !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: left;">Occasion (சுபநிகழ்ச்சி)</th>`;
        if (visibleColumns.giftTerm !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: center;">Gift Term (முறை)</th>`;
        if (visibleColumns.amount !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: right;">Amount Given (கொடுத்த தொகை ₹)</th>`;
        if (visibleColumns.givenDate !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: right;">Given Date (கொடுத்த தேதி)</th>`;
        if (visibleColumns.notes !== false) ths += `<th style="background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; text-align: left;">Notes (குறிப்பு)</th>`;
        return `<tr>${ths}</tr>`;
    };

    // Helper to generate dynamic PDF row according to visibleColumns
    const getPdfRowHtml = (tx, idx) => {
        let tds = `<td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>`;
        if (visibleColumns.recipientName !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px;">${tx.recipientName} ${tx.giftType === 'Gold' ? `<br/><span style="font-size: 10px; color: #D97706; font-weight: normal;">🪙 ${tx.goldDetails || 'Gold'}</span>` : ''}</td>`;
        if (visibleColumns.village !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.village || '-'}</td>`;
        if (visibleColumns.occasion !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.occasion || '-'}</td>`;
        if (visibleColumns.giftTerm !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${tx.giftTerm || '1st Time'}</td>`;
        if (visibleColumns.amount !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #7C3AED; font-size: 12px;">₹ ${Number(tx.amount).toLocaleString('en-IN')}</td>`;
        if (visibleColumns.givenDate !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-size: 10px; color: #6B7280;">${new Date(tx.givenDate).toLocaleDateString('en-IN')}</td>`;
        if (visibleColumns.notes !== false) tds += `<td style="padding: 7px; border: 1px solid #E5E7EB; font-size: 11px;">${tx.notes || '-'}</td>`;
        return `<tr>${tds}</tr>`;
    };

    // Helper to generate dynamic Excel object according to visibleColumns
    const getExcelRowObject = (tx, idx) => {
        const row = { 'S.No (வ.எண்)': idx + 1 };
        if (visibleColumns.recipientName !== false) row['Recipient Name (பெறுபவர் பெயர்)'] = tx.recipientName;
        if (visibleColumns.village !== false) row['Village (ஊர் பெயர்)'] = tx.village || '-';
        if (visibleColumns.occasion !== false) row['Occasion (சுபநிகழ்ச்சி)'] = tx.occasion || '-';
        if (visibleColumns.giftTerm !== false) row['Gift Term (முறை)'] = tx.giftTerm || '1st Time';
        if (visibleColumns.amount !== false) row['Amount Given (கொடுத்த தொகை ₹)'] = Number(tx.amount || 0);
        if (visibleColumns.givenDate !== false) row['Given Date (கொடுத்த தேதி)'] = new Date(tx.givenDate).toLocaleDateString('en-IN');
        if (visibleColumns.notes !== false) row['Notes (குறிப்பு)'] = tx.notes || '';
        return row;
    };

    // Excel Export (Filtered dataset + Multi-sheet tabs when grouped by Village)
    const handleExportExcel = () => {
        if (sortedEntries.length === 0) {
            window.customAlert('No filtered records available to export.');
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
                const sheetData = group.items.map((tx, idx) => getExcelRowObject(tx, idx));
                const sheet = XLSX.utils.json_to_sheet(sheetData);
                const safeTabName = group.key.replace(/[\\/?*\[\]]/g, '').slice(0, 30);
                XLSX.utils.book_append_sheet(workbook, sheet, safeTabName);
            });
        } else {
            const exportData = sortedEntries.map((tx, idx) => getExcelRowObject(tx, idx));
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Given_Moi_Gifts');
        }

        const fileName = `Given_Moi_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // PDF Export (Filtered dataset + Separate physical page per village when grouped)
    const handleExportPDF = () => {
        if (sortedEntries.length === 0) {
            window.customAlert('No filtered records available to export.');
            return;
        }

        const printWindow = window.open('', '_blank');
        let bodyHtml = '';

        if (groupBy === 'village' && groupedData) {
            const ROWS_PER_FIRST_PAGE = 26; // First page of village (has summary box)
            const ROWS_PER_SUB_PAGE = 30;   // Continuation pages of same village

            let currentSheetNumber = 1; // Sheet 1 is Index Page
            const villageIndexList = [];
            const villagePageBlocksHtml = [];

            groupedData.forEach((group) => {
                const items = group.items;
                const villageStartPage = currentSheetNumber + 1;

                // Break village items into chunked arrays per sheet
                const chunks = [];
                if (items.length <= ROWS_PER_FIRST_PAGE) {
                    chunks.push(items);
                } else {
                    chunks.push(items.slice(0, ROWS_PER_FIRST_PAGE));
                    let offset = ROWS_PER_FIRST_PAGE;
                    while (offset < items.length) {
                        chunks.push(items.slice(offset, offset + ROWS_PER_SUB_PAGE));
                        offset += ROWS_PER_SUB_PAGE;
                    }
                }

                const villageEndPage = villageStartPage + chunks.length - 1;

                villageIndexList.push({
                    village: group.key,
                    count: items.length,
                    totalAmount: group.totalAmount,
                    startPage: villageStartPage,
                    endPage: villageEndPage,
                    totalPagesForVillage: chunks.length
                });

                chunks.forEach((chunkItems, cIdx) => {
                    currentSheetNumber++;
                    const pageNo = currentSheetNumber;
                    const isMultiPage = chunks.length > 1;
                    const pagePartLabel = isMultiPage ? ` (பாகம் ${cIdx + 1}/${chunks.length})` : '';
                    const globalStartIndex = cIdx === 0 ? 0 : ROWS_PER_FIRST_PAGE + (cIdx - 1) * ROWS_PER_SUB_PAGE;

                    const rowsHtml = chunkItems.map((tx, idx) => getPdfRowHtml(tx, globalStartIndex + idx)).join('');

                    villagePageBlocksHtml.push(`
                        <div class="print-sheet-block" style="page-break-after: always; break-after: page; box-sizing: border-box; padding-bottom: 6px;">
                            <div class="village-header-top-center" style="text-align: center; margin-bottom: 10px; border-bottom: 2px solid #7C3AED; padding-bottom: 6px;">
                                <div style="font-size: 22px; font-weight: 900; color: #6D28D9; text-transform: uppercase; letter-spacing: 0.5px;">
                                    📍 ஊர்: ${group.key}${pagePartLabel}
                                </div>
                                <div style="font-size: 13px; font-weight: 700; color: #374151; margin-top: 3px;">
                                    Given Moi Ledger (நாம் செய்த மொய் பட்டியல்)
                                </div>
                            </div>

                            ${cIdx === 0 ? `
                                <div class="summary-box" style="justify-content: center; background: #F3F4F6; padding: 8px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 12px; border: 1px solid #E5E7EB; display: flex; gap: 20px;">
                                    <div class="summary-item">மொத்த பதிவுகள்: <strong>${group.items.length}</strong></div>
                                    <div class="summary-item">ஊர் மொத்த தொகைக் கொடுத்தது: <span class="summary-val" style="color: #7C3AED; font-weight: 800; font-size: 14px;">₹ ${group.totalAmount.toLocaleString('en-IN')}</span></div>
                                </div>
                            ` : ''}

                            <div>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        ${getPdfHeaderHtml()}
                                    </thead>
                                    <tbody>
                                        ${rowsHtml}
                                    </tbody>
                                </table>
                            </div>

                            <div class="sheet-explicit-footer" style="margin-top: 14px; border-top: 2px solid #7C3AED; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; background: #FFF;">
                                <span style="font-weight: 800; color: #6D28D9; font-size: 11px;">Given Moi Ledger &nbsp;|&nbsp; ஊர்: ${group.key}${pagePartLabel}</span>
                                <span style="font-size: 13px; font-weight: 900; color: #111827; background: #F3F4F6; padding: 3px 12px; border-radius: 6px; border: 1px solid #CBD5E1;">
                                    பக்கம் ${pageNo} / __TOTAL_PAGES__
                                </span>
                            </div>
                        </div>
                    `);
                });
            });

            const totalDocPages = currentSheetNumber;

            // Generate Index Rows
            const indexRowsHtml = villageIndexList.map((idxItem, idx) => `
                <tr>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${idx + 1}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; font-weight: bold; font-size: 12px; color: #6D28D9;">${idxItem.village}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px; font-weight: 600;">${idxItem.count}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #7C3AED; font-size: 12px;">₹ ${idxItem.totalAmount.toLocaleString('en-IN')}</td>
                    <td style="padding: 7px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: #4F46E5; font-size: 11px;">
                        ${idxItem.startPage === idxItem.endPage ? `பக்கம் ${idxItem.startPage}` : `பக்கம் ${idxItem.startPage} - ${idxItem.endPage}`}
                    </td>
                </tr>
            `).join('');

            const indexPageHtml = `
                <div class="print-sheet-block index-page" style="page-break-after: always; break-after: page; box-sizing: border-box; padding-bottom: 6px;">
                    <div style="text-align: center; margin-bottom: 14px; border-bottom: 2px solid #7C3AED; padding-bottom: 8px;">
                        <div style="font-size: 22px; font-weight: 900; color: #6D28D9; text-transform: uppercase; letter-spacing: 0.5px;">
                            📜 கிராமங்கள் பொருளடக்கம் (Village Index Page)
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #374151; margin-top: 3px;">
                            Given Moi Ledger (நாம் செய்த மொய் விவரங்கள்)
                        </div>
                    </div>

                    <div class="summary-box" style="justify-content: center; background: #F3F4F6; padding: 10px 16px; border-radius: 8px; font-size: 12px; margin-bottom: 14px; border: 1px solid #E5E7EB; display: flex; gap: 24px;">
                        <div class="summary-item">மொத்த ஊர்கள்: <strong style="font-size: 14px; color: #6D28D9;">${groupedData.length}</strong></div>
                        <div class="summary-item">மொத்த பதிவுகள்: <strong style="font-size: 14px; color: #111827;">${sortedEntries.length}</strong></div>
                        <div class="summary-item">மொத்த கொடுத்தது: <span style="color: #7C3AED; font-weight: 800; font-size: 14px;">₹ ${filteredGivenCash.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="background: #7C3AED; color: white; padding: 8px; font-size: 11px; border: 1px solid #6D28D9; text-align: center;">#</th>
                                    <th style="background: #7C3AED; color: white; padding: 8px; font-size: 11px; border: 1px solid #6D28D9; text-align: left;">Village (ஊர் பெயர்)</th>
                                    <th style="background: #7C3AED; color: white; padding: 8px; font-size: 11px; border: 1px solid #6D28D9; text-align: center;">Entries (எண்ணிக்கை)</th>
                                    <th style="background: #7C3AED; color: white; padding: 8px; font-size: 11px; border: 1px solid #6D28D9; text-align: right;">Total Amount Given (தொகை ₹)</th>
                                    <th style="background: #7C3AED; color: white; padding: 8px; font-size: 11px; border: 1px solid #6D28D9; text-align: center;">Start Page (பக்கம்)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${indexRowsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="sheet-explicit-footer" style="margin-top: 14px; border-top: 2px solid #7C3AED; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; background: #FFF;">
                        <span style="font-weight: 800; color: #6D28D9; font-size: 11px;">Given Moi Ledger &nbsp;|&nbsp; பொருளடக்கம்</span>
                        <span style="font-size: 13px; font-weight: 900; color: #111827; background: #F3F4F6; padding: 3px 12px; border-radius: 6px; border: 1px solid #CBD5E1;">
                            பக்கம் 1 / ${totalDocPages}
                        </span>
                    </div>
                </div>
            `;

            // Replace total pages placeholder in all village pages
            bodyHtml = indexPageHtml + villagePageBlocksHtml.join('').replace(/__TOTAL_PAGES__/g, totalDocPages);
        } else {
            // Standard Single PDF Report for Filtered Dataset - Chunk into 30 items per sheet
            const ROWS_PER_PAGE = 30;
            const chunks = [];
            let offset = 0;
            while (offset < sortedEntries.length) {
                chunks.push(sortedEntries.slice(offset, offset + ROWS_PER_PAGE));
                offset += ROWS_PER_PAGE;
            }

            const totalDocPages = chunks.length || 1;

            bodyHtml = chunks.map((chunkItems, cIdx) => {
                const pageNo = cIdx + 1;
                const globalStartIndex = cIdx * ROWS_PER_PAGE;
                const rowsHtml = chunkItems.map((tx, idx) => getPdfRowHtml(tx, globalStartIndex + idx)).join('');

                return `
                    <div class="print-sheet-block" style="page-break-after: always; break-after: page; box-sizing: border-box; padding-bottom: 6px;">
                        ${cIdx === 0 ? `
                            <div class="header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 8px; margin-bottom: 12px;">
                                <div>
                                    <h2 style="margin: 0; color: #6D28D9; font-size: 18px;">Given Moi Ledger (நாம் செய்த மொய் பட்டியல்)</h2>
                                </div>
                            </div>

                            <div class="summary-box" style="background: #F3F4F6; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 14px; border: 1px solid #E5E7EB; display: flex; gap: 18px;">
                                <div class="summary-item">Filtered Total Given: <span class="summary-val" style="color: #7C3AED; font-size: 14px; font-weight: 800;">₹ ${filteredGivenCash.toLocaleString('en-IN')}</span></div>
                                <div class="summary-item">Total Given Overall: <span class="summary-val" style="color: #6D28D9; font-size: 14px; font-weight: 800;">₹ ${totalGivenCash.toLocaleString('en-IN')}</span></div>
                                <div class="summary-item">Entries: <strong>${sortedEntries.length}</strong></div>
                            </div>
                        ` : `
                            <div style="border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 10px; font-size: 12px; font-weight: 700; color: #6D28D9;">
                                Given Moi Ledger (நாம் செய்த மொய் பட்டியல் - தொடர்ச்சி)
                            </div>
                        `}

                        <div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    ${getPdfHeaderHtml()}
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div class="sheet-explicit-footer" style="margin-top: 14px; border-top: 2px solid #7C3AED; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; background: #FFF;">
                            <span style="font-weight: 800; color: #6D28D9; font-size: 11px;">Given Moi Ledger</span>
                            <span style="font-size: 13px; font-weight: 900; color: #111827; background: #F3F4F6; padding: 3px 12px; border-radius: 6px; border: 1px solid #CBD5E1;">
                                பக்கம் ${pageNo} / ${totalDocPages}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Given Moi Ledger Report</title>
                <style>
                    @page { size: A4; margin: 10mm 10mm 10mm 30mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #111827; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; margin-bottom: 14px; }
                    h2 { margin: 0; color: #6D28D9; font-size: 18px; }
                    .summary-box { background: #F3F4F6; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; border: 1px solid #E5E7EB; display: flex; gap: 18px; }
                    .summary-item { font-weight: 600; }
                    .summary-val { color: #059669; font-size: 14px; font-weight: 800; }
                    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                    th { background: #7C3AED; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #6D28D9; letter-spacing: 0.5px; }
                    tr:nth-child(even) { background-color: #F9FAFB; }
                    .print-sheet-block { width: 100%; box-sizing: border-box; }
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

    const activeFilterCount = (searchQuery ? 1 : 0) +
        (selectedVillage ? 1 : 0) +
        (selectedOccasion !== 'all' && selectedOccasion ? 1 : 0) +
        (selectedGiftType !== 'all' && selectedGiftType ? 1 : 0) +
        (selectedTerm !== 'all' && selectedTerm ? 1 : 0) +
        (amountOp !== 'all' && amountOp ? 1 : 0) +
        (amountVal || minAmount || maxAmount ? 1 : 0) +
        (notesQuery ? 1 : 0) +
        (groupBy !== 'none' ? 1 : 0);

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
                                        {/* Column Show/Hide Dropdown */}
                        <ColumnToggleDropdown
                            columns={GIVEN_MOI_COLUMNS}
                            visibleColumns={visibleColumns}
                            onChange={handleVisibleColumnsChange}
                        />

                        {/* Filter Toggle Button */}
                        <button
                            className={`modern-btn btn-filter-toggle ${isFilterExpanded ? 'active-filter' : ''}`}
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        >
                            <Filter size={15} />
                            <span>Column Filters</span>
                            {activeFilterCount > 0 && <span className="active-count-badge">{activeFilterCount}</span>}
                            {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Export Excel */}
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel} title="Export to Excel">
                            <FileSpreadsheet size={15} /> Excel
                        </button>

                        {/* Export PDF */}
                        <button className="modern-btn btn-export-pdf" onClick={handleExportPDF} title="Print PDF">
                            <Printer size={15} /> PDF
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

                        {/* Add Given Gift Button */}
                        {canAdd && (
                            <button className="modern-btn btn-new-event-neon" onClick={handleOpenAdd}>
                                <Plus size={16} /> Record Given Gift
                            </button>
                        )}
                    </div>
                </div>

                {/* 🔍 EXPANDABLE COLUMN FILTER DRAWER 🔍 */}
                {isFilterExpanded && (
                    <div className="advanced-filter-drawer mt-3 pt-3 border-t">
                        <div className="filter-drawer-header flex-align justify-between mb-3 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Filter size={14} /> Advanced Column Filters (வடிகட்டி & விருப்பங்கள்)
                            </span>
                            <button 
                                type="button"
                                onClick={() => setIsFilterExpanded(false)}
                                style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                                title="Collapse Filter Panel"
                            >
                                <ChevronUp size={14} /> Collapse (சுருக்குக)
                            </button>
                        </div>
                        <div className="filter-drawer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {/* 1. Name Filter */}
                            <div className="filter-field-group">
                                <label className="filter-field-label flex-align">
                                    <Search size={13} className="text-purple" /> Recipient Name (பெயர்)
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

                            {/* 2. Village Filter */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Village (ஊர்)</label>
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

                            {/* 3. Occasion Filter */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Occasion (சுபநிகழ்ச்சி)</label>
                                <select
                                    className="modern-control-sm"
                                    value={selectedOccasion}
                                    onChange={(e) => {
                                        setSelectedOccasion(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Occasions</option>
                                    {uniqueOccasions.map((occ) => (
                                        <option key={occ} value={occ}>{occ}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. Gift Type Filter */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Gift Type (மொய் வகை)</label>
                                <select
                                    className="modern-control-sm"
                                    value={selectedGiftType}
                                    onChange={(e) => {
                                        setSelectedGiftType(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Gift Types</option>
                                    <option value="Cash">Cash Gift (பண மொய்)</option>
                                    <option value="Gold">Gold Gift (பொன் மொய்)</option>
                                </select>
                            </div>

                            {/* 5. Gift Term Filter */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Gift Term (முறை)</label>
                                <select
                                    className="modern-control-sm"
                                    value={selectedTerm}
                                    onChange={(e) => {
                                        setSelectedTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Terms</option>
                                    <option value="1st Time">1st Time</option>
                                    <option value="2nd Time">2nd Time</option>
                                    <option value="3rd Time">3rd Time</option>
                                    {uniqueTerms.filter(t => !['1st Time', '2nd Time', '3rd Time'].includes(t)).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 6. Mathematical Amount Operator Selector */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Amount Math Filter (தொகை கணிதம்)</label>
                                <select
                                    className="modern-control-sm"
                                    value={amountOp}
                                    onChange={(e) => {
                                        setAmountOp(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Amounts (அனைத்தும்)</option>
                                    <option value="=">= Equal to (சமம்)</option>
                                    <option value=">">&gt; Greater than (அதிகம்)</option>
                                    <option value=">=">&gt;= Greater than or Equal (அதிகம்/சமம்)</option>
                                    <option value="<">&lt; Less than (குறைவு)</option>
                                    <option value="<=">&lt;= Less than or Equal (குறைவு/சமம்)</option>
                                    <option value="!=">!= Not Equal (சமமில்லை)</option>
                                    <option value="between">Between Range (தொகை வரம்பு)</option>
                                </select>
                            </div>

                            {/* 7. Amount Value (for =, >, >=, <, <=, !=) */}
                            {amountOp !== 'all' && amountOp !== 'between' && (
                                <div className="filter-field-group">
                                    <label className="filter-field-label">Amount Value (தொகை ₹)</label>
                                    <input
                                        type="number"
                                        className="modern-control-sm"
                                        placeholder={`Enter amount for ${amountOp}...`}
                                        value={amountVal}
                                        onChange={(e) => { setAmountVal(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                            )}

                            {/* 8. Between Min & Max Amount */}
                            {amountOp === 'between' && (
                                <>
                                    <div className="filter-field-group">
                                        <label className="filter-field-label">Min Amount (குறைந்த ₹)</label>
                                        <input
                                            type="number"
                                            className="modern-control-sm"
                                            placeholder="Min ₹"
                                            value={minAmount}
                                            onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                                        />
                                    </div>

                                    <div className="filter-field-group">
                                        <label className="filter-field-label">Max Amount (அதிக ₹)</label>
                                        <input
                                            type="number"
                                            className="modern-control-sm"
                                            placeholder="Max ₹"
                                            value={maxAmount}
                                            onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                                        />
                                    </div>
                                </>
                            )}

                            {/* 11. Notes Search */}
                            <div className="filter-field-group">
                                <label className="filter-field-label">Notes (குறிப்பு தேடல்)</label>
                                <input
                                    type="text"
                                    className="modern-control-sm"
                                    placeholder="Search notes..."
                                    value={notesQuery}
                                    onChange={(e) => { setNotesQuery(e.target.value); setCurrentPage(1); }}
                                />
                            </div>

                            {/* 12. Grouping Selector */}
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

                        {/* Filter Status Summary Bar & Reset Action */}
                        <div className="filter-summary-row mt-3 flex-align justify-between">
                            <span className="summary-text-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                Showing <strong>{filteredEntries.length}</strong> of {givenEntries.length} entries
                                <span style={{ opacity: 0.3 }}>•</span>
                                <span>கொடுத்த தொகை: <strong className="text-purple">₹ {filteredGivenCash.toLocaleString('en-IN')}</strong></span>
                            </span>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button className="reset-btn-sm" onClick={handleResetFilters}>
                                    <RotateCcw size={13} /> Reset Filters
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsFilterExpanded(false)}
                                    style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                                    title="Collapse Filter Panel"
                                >
                                    <ChevronUp size={14} /> Collapse Filters (சுருக்குக)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 📋 TABLE VIEW 📋 */}
            <div className="full-width-card glass-card table-card">
                <div className="table-responsive">
                    <table className="custom-table modern-table compact-table">
                        <thead>
                            <tr>
                                {visibleColumns.recipientName !== false && (
                                    <SortableTh
                                        field="recipientName"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Recipient Name"
                                        labelTa="பெயர்"
                                        align="left"
                                    />
                                )}
                                {visibleColumns.village !== false && (
                                    <SortableTh
                                        field="village"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Village"
                                        labelTa="ஊர்"
                                        align="left"
                                    />
                                )}
                                {visibleColumns.occasion !== false && (
                                    <SortableTh
                                        field="occasion"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Occasion / Function"
                                        labelTa="சுபநிகழ்ச்சி"
                                        align="left"
                                    />
                                )}
                                {visibleColumns.giftTerm !== false && (
                                    <SortableTh
                                        field="giftTerm"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Gift Term"
                                        labelTa="முறை"
                                        align="center"
                                    />
                                )}
                                {visibleColumns.amount !== false && (
                                    <SortableTh
                                        field="amount"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Given Amount"
                                        labelTa="நாம் கொடுத்த தொகை ₹"
                                        align="right"
                                    />
                                )}
                                {visibleColumns.givenDate !== false && (
                                    <SortableTh
                                        field="givenDate"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        labelEn="Given Date"
                                        labelTa="கொடுத்த தேதி"
                                        align="right"
                                    />
                                )}
                                {visibleColumns.notes !== false && (
                                    <th className="text-left">
                                        <div className="th-bilingual">
                                            <span className="th-en">Notes</span>
                                            <span className="th-ta">குறிப்பு</span>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.actions !== false && (
                                    <th className="text-center">
                                        <div className="th-bilingual center">
                                            <span className="th-en">Actions</span>
                                            <span className="th-ta">செயல்கள்</span>
                                        </div>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center text-muted py-6">
                                        No given gifts match your filters. Click <strong>Record Given Gift</strong> to add your first entry!
                                    </td>
                                </tr>
                            ) : groupBy !== 'none' ? (
                                groupedData.map((group) => (
                                    <React.Fragment key={group.key}>
                                        <tr className="group-header-row">
                                            <td colSpan={Object.values(visibleColumns).filter(Boolean).length}>
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
                                                {visibleColumns.recipientName !== false && (
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
                                                )}
                                                {visibleColumns.village !== false && <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>}
                                                {visibleColumns.occasion !== false && <td className="text-left">{tx.occasion || '-'}</td>}
                                                {visibleColumns.giftTerm !== false && <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>}
                                                {visibleColumns.amount !== false && <td className="text-right amount-col text-purple">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>}
                                                {visibleColumns.givenDate !== false && (
                                                    <td className="text-right text-muted text-xs">
                                                        {new Date(tx.givenDate).toLocaleDateString('en-IN')}
                                                    </td>
                                                )}
                                                {visibleColumns.notes !== false && <td className="text-left text-xs">{tx.notes || '-'}</td>}
                                                {visibleColumns.actions !== false && (
                                                    <td className="text-center" style={{ whiteSpace: 'nowrap', width: '85px' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                            {canEdit && (
                                                                <button
                                                                    title="Edit Entry (திருத்து)"
                                                                    onClick={() => handleEdit(tx)}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.14)', color: '#A78BFA', transition: 'all 0.18s ease' }}
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    title="Delete Entry (நீக்கு)"
                                                                    onClick={() => onDeleteGivenMoi && onDeleteGivenMoi(tx.id)}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.14)', color: '#FB7185', transition: 'all 0.18s ease' }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                paginatedEntries.map((tx) => (
                                    <tr key={tx.id} className="table-row-hover">
                                        {visibleColumns.recipientName !== false && (
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
                                        )}
                                        {visibleColumns.village !== false && <td className="text-left"><span className="badge-village">{tx.village || '-'}</span></td>}
                                        {visibleColumns.occasion !== false && <td className="text-left">{tx.occasion || '-'}</td>}
                                        {visibleColumns.giftTerm !== false && <td className="text-center"><span className="badge-term-tag">{tx.giftTerm || '1st Time'}</span></td>}
                                        {visibleColumns.amount !== false && <td className="text-right amount-col text-purple">₹ {Number(tx.amount).toLocaleString('en-IN')}</td>}
                                        {visibleColumns.givenDate !== false && (
                                            <td className="text-right text-muted text-xs">
                                                {new Date(tx.givenDate).toLocaleDateString('en-IN')}
                                            </td>
                                        )}
                                        {visibleColumns.notes !== false && <td className="text-left text-xs">{tx.notes || '-'}</td>}
                                        {visibleColumns.actions !== false && (
                                            <td className="text-center" style={{ whiteSpace: 'nowrap', width: '85px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                                    {canEdit && (
                                                        <button
                                                            title="Edit Entry (திருத்து)"
                                                            onClick={() => handleEdit(tx)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.14)', color: '#A78BFA', transition: 'all 0.18s ease' }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            title="Delete Entry"
                                                            onClick={() => onDeleteGivenMoi && onDeleteGivenMoi(tx.id)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.14)', color: '#FB7185', transition: 'all 0.18s ease' }}
                                                        >
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
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

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onImport={async (data) => {
                    await onRecordGivenMoi({
                        recipientName: data.name,
                        village: data.village,
                        giftType: data.giftType || 'Cash',
                        goldDetails: data.goldDetails || '',
                        amount: Number(data.amount || 0),
                        occasion: data.occasion || 'மற்றவை',
                        giftTerm: data.giftTerm || '1st Time',
                        givenDate: data.givenDate ? new Date(data.givenDate).toISOString() : new Date().toISOString(),
                        notes: data.notes || '',
                        eventId: event.id
                    });
                }}
                templateType="given_moi"
            />
        </div>
    );
};
