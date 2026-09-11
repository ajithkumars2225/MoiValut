import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    Clock,
    Plus,
    Search,
    CheckCircle,
    FileX,
    AlertCircle,
    IndianRupee,
    Trash2,
    Edit2,
    FileSpreadsheet,
    Printer,
    MapPin,
    Send,
} from 'lucide-react';
import { ClosePendingModal } from '../components/modals/ClosePendingModal';
import { TransliteratedInput } from '../components/TransliteratedInput';

export const PendingReturnsView = ({
    pendingReturns = [],
    onCreatePendingReturn,
    onUpdatePendingReturn,
    onClosePendingWithEntry,
    onClosePendingWithoutEntry,
    onDeletePendingReturn,
    events = [],
    selectedEventId,
    privileges,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'ClosedWithEntry' | 'ClosedWithoutEntry'
    const [selectedVillage, setSelectedVillage] = useState('');

    // Modal states
    const [selectedPendingItem, setSelectedPendingItem] = useState(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Pending Return form state
    const [newContributorName, setNewContributorName] = useState('');
    const [newVillage, setNewVillage] = useState('');
    const [newReceivedAmount, setNewReceivedAmount] = useState('');
    const [newOccasion, setNewOccasion] = useState('திருமணம் (Marriage)');
    const [newNotes, setNewNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canAdd = !privileges || privileges.add === true;
    const canEdit = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;

    // Unique Villages list
    const villages = useMemo(() => {
        const set = new Set();
        pendingReturns.forEach((item) => {
            if (item.village) set.add(item.village.trim());
        });
        return Array.from(set).sort();
    }, [pendingReturns]);

    // Stats calculations
    const stats = useMemo(() => {
        let totalCount = pendingReturns.length;
        let pendingCount = 0;
        let closedWithEntryCount = 0;
        let closedWithoutEntryCount = 0;
        let pendingAmountTotal = 0;

        pendingReturns.forEach((p) => {
            if (p.status === 'Pending' || !p.status) {
                pendingCount++;
                pendingAmountTotal += p.receivedAmount || 0;
            } else if (p.status === 'ClosedWithEntry') {
                closedWithEntryCount++;
            } else if (p.status === 'ClosedWithoutEntry') {
                closedWithoutEntryCount++;
            }
        });

        return {
            totalCount,
            pendingCount,
            closedWithEntryCount,
            closedWithoutEntryCount,
            pendingAmountTotal,
        };
    }, [pendingReturns]);

    // Filtering logic
    const filteredItems = useMemo(() => {
        return pendingReturns.filter((item) => {
            // Event filter
            if (selectedEventId && item.eventId && item.eventId !== selectedEventId) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'Pending' && item.status && item.status !== 'Pending') return false;
                if (statusFilter === 'ClosedWithEntry' && item.status !== 'ClosedWithEntry') return false;
                if (statusFilter === 'ClosedWithoutEntry' && item.status !== 'ClosedWithoutEntry') return false;
            }
            // Village filter
            if (selectedVillage && item.village?.trim() !== selectedVillage) return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = item.contributorName?.toLowerCase().includes(q);
                const villageMatch = item.village?.toLowerCase().includes(q);
                const occasionMatch = item.occasion?.toLowerCase().includes(q);
                const notesMatch = item.notes?.toLowerCase().includes(q);
                return nameMatch || villageMatch || occasionMatch || notesMatch;
            }

            return true;
        });
    }, [pendingReturns, statusFilter, selectedVillage, searchQuery, selectedEventId]);

    // Handlers
    const handleOpenCloseModal = (item) => {
        setSelectedPendingItem(item);
        setIsCloseModalOpen(true);
    };

    const handleCreateNewPending = async (e) => {
        e.preventDefault();
        if (!newContributorName.trim()) {
            alert('நபர் பெயர் உள்ளிடவும் (Please enter contributor name).');
            return;
        }
        try {
            setIsSubmitting(true);
            const data = {
                contributorName: newContributorName.trim(),
                village: newVillage.trim(),
                receivedAmount: newReceivedAmount ? Number(newReceivedAmount) : 0,
                occasion: newOccasion,
                notes: newNotes.trim(),
                eventId: selectedEventId || null,
                status: 'Pending',
            };
            await onCreatePendingReturn(data);
            setIsAddModalOpen(false);
            setNewContributorName('');
            setNewVillage('');
            setNewReceivedAmount('');
            setNewOccasion('திருமணம் (Marriage)');
            setNewNotes('');
        } catch (err) {
            alert('Error adding pending return: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Excel export
    const handleExportExcel = () => {
        const exportData = filteredItems.map((item, idx) => ({
            'S.No': idx + 1,
            'Contributor Name (பெயர்)': item.contributorName,
            'Village (ஊர்)': item.village || '-',
            'Received Amount (வந்த தொகை ₹)': item.receivedAmount || 0,
            'Occasion (விசேஷம்)': item.occasion || '-',
            'Status (நிலை)':
                item.status === 'Pending'
                    ? 'நிலுவை (Pending)'
                    : item.status === 'ClosedWithEntry'
                    ? 'மொய் செய்து முடிந்தது'
                    : 'மொய் இன்றி முடிந்தது',
            'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
            'Closed Date': item.closedAt ? new Date(item.closedAt).toLocaleDateString() : '-',
            'Notes (குறிப்புகள்)': item.notes || '-',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Returns');
        XLSX.writeFile(wb, `Pending_Returns_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="view-content fade-in">
            {/* 🌟 PAGE HEADER BAR 🌟 */}
            <div className="full-width-card glass-card compact-list-header mb-3">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div
                            className="badge-icon-purple-sm"
                            style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#FBBF24',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                            }}
                        >
                            <Clock size={18} />
                        </div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm font-tamil">
                                நிலுவை மொய் மேலாண்மை{' '}
                                <span className="text-xs text-muted" style={{ fontWeight: 'normal', opacity: 0.75 }}>
                                    (Pending Returns)
                                </span>
                            </h2>
                            <span className="collection-pill-sm font-tamil">
                                மொத்த நிலுவைத் தொகை:{' '}
                                <strong className="text-gold">₹ {stats.pendingAmountTotal.toLocaleString('en-IN')}</strong> ({stats.pendingCount} நிலுவைகள்)
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        {/* Quick Search */}
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <TransliteratedInput
                                value={searchQuery}
                                onChange={(val) => setSearchQuery(val)}
                                placeholder="தேடுக (பெயர், ஊர், விசேஷம்)..."
                                className="search-input-sm font-tamil"
                            />
                        </div>

                        {/* Export Excel */}
                        <button className="modern-btn btn-export-excel" onClick={handleExportExcel} title="Export to Excel">
                            <FileSpreadsheet size={15} /> Excel
                        </button>

                        {/* Export PDF */}
                        <button className="modern-btn btn-export-pdf" onClick={handlePrint} title="Print PDF">
                            <Printer size={15} /> PDF
                        </button>

                        {/* Add Pending Button */}
                        {canAdd && (
                            <button
                                className="modern-btn btn-new-event-neon"
                                style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <Plus size={15} /> <span className="font-tamil">+ நிலுவை மொய் சேர்க்க</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 📊 KPI 4-COLUMN STAT CARDS GRID 📊 */}
            <div className="kpi-4-col-grid mb-3">
                {/* Card 1: Pending Count */}
                <div className="kpi-card glass-card amber-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title font-tamil">நிலுவையில் உள்ளவை (Pending)</span>
                        <div className="kpi-icon-bg amber-icon">
                            <AlertCircle size={18} />
                        </div>
                    </div>
                    <div className="kpi-value text-gold" style={{ fontFamily: 'monospace' }}>
                        {stats.pendingCount}
                    </div>
                    <div className="kpi-foot font-tamil" style={{ color: '#FBBF24', fontWeight: 'bold' }}>
                        நிலுவைத் தொகை: ₹{stats.pendingAmountTotal.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* Card 2: Closed With Entry */}
                <div className="kpi-card glass-card purple-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title font-tamil">மொய் செய்து முடிந்தவை</span>
                        <div className="kpi-icon-bg purple-icon">
                            <Send size={18} />
                        </div>
                    </div>
                    <div className="kpi-value text-purple" style={{ fontFamily: 'monospace' }}>
                        {stats.closedWithEntryCount}
                    </div>
                    <div className="kpi-foot font-tamil">செய்த மொய் பதிவுடன் முடிந்தது</div>
                </div>

                {/* Card 3: Closed Without Entry */}
                <div className="kpi-card glass-card blue-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title font-tamil">நேரடியாக முடிந்தவை</span>
                        <div className="kpi-icon-bg blue-icon">
                            <FileX size={18} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ fontFamily: 'monospace', color: '#60A5FA' }}>
                        {stats.closedWithoutEntryCount}
                    </div>
                    <div className="kpi-foot font-tamil">காரணத்துடன் முடிந்தது</div>
                </div>

                {/* Card 4: Total Historical Records */}
                <div className="kpi-card glass-card emerald-kpi">
                    <div className="kpi-top">
                        <span className="kpi-title font-tamil">மொத்த பதிவுகள் (Total)</span>
                        <div className="kpi-icon-bg emerald-icon">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <div className="kpi-value text-emerald" style={{ fontFamily: 'monospace' }}>
                        {stats.totalCount}
                    </div>
                    <div className="kpi-foot font-tamil">வரலாற்று பதிவுகள்</div>
                </div>
            </div>

            {/* 🔍 FILTER TABS & VILLAGE SELECTOR BAR 🔍 */}
            <div className="full-width-card glass-card mb-3" style={{ padding: '0.85rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {/* Status Filter Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                            className="page-nav-btn font-tamil"
                            style={{
                                background: statusFilter === 'all' ? '#8B5CF6' : undefined,
                                color: statusFilter === 'all' ? '#FFF' : undefined,
                                borderColor: statusFilter === 'all' ? '#8B5CF6' : undefined,
                                fontWeight: statusFilter === 'all' ? 'bold' : undefined,
                            }}
                            onClick={() => setStatusFilter('all')}
                        >
                            அனைத்தும் (All - {stats.totalCount})
                        </button>

                        <button
                            className="page-nav-btn font-tamil"
                            style={{
                                background: statusFilter === 'Pending' ? 'rgba(245, 158, 11, 0.25)' : undefined,
                                color: statusFilter === 'Pending' ? '#FBBF24' : undefined,
                                borderColor: statusFilter === 'Pending' ? 'rgba(245, 158, 11, 0.5)' : undefined,
                                fontWeight: statusFilter === 'Pending' ? 'bold' : undefined,
                            }}
                            onClick={() => setStatusFilter('Pending')}
                        >
                            <AlertCircle size={13} /> நிலுவையில் உள்ளவை ({stats.pendingCount})
                        </button>

                        <button
                            className="page-nav-btn font-tamil"
                            style={{
                                background: statusFilter === 'ClosedWithEntry' ? 'rgba(139, 92, 246, 0.25)' : undefined,
                                color: statusFilter === 'ClosedWithEntry' ? '#A78BFA' : undefined,
                                borderColor: statusFilter === 'ClosedWithEntry' ? 'rgba(139, 92, 246, 0.5)' : undefined,
                                fontWeight: statusFilter === 'ClosedWithEntry' ? 'bold' : undefined,
                            }}
                            onClick={() => setStatusFilter('ClosedWithEntry')}
                        >
                            <CheckCircle size={13} /> மொய் செய்து முடிந்தவை ({stats.closedWithEntryCount})
                        </button>

                        <button
                            className="page-nav-btn font-tamil"
                            style={{
                                background: statusFilter === 'ClosedWithoutEntry' ? 'rgba(156, 163, 175, 0.2)' : undefined,
                                color: statusFilter === 'ClosedWithoutEntry' ? '#E2E8F0' : undefined,
                                borderColor: statusFilter === 'ClosedWithoutEntry' ? 'rgba(156, 163, 175, 0.4)' : undefined,
                                fontWeight: statusFilter === 'ClosedWithoutEntry' ? 'bold' : undefined,
                            }}
                            onClick={() => setStatusFilter('ClosedWithoutEntry')}
                        >
                            <FileX size={13} /> நேரடியாக முடிந்தவை ({stats.closedWithoutEntryCount})
                        </button>
                    </div>

                    {/* Village Dropdown */}
                    <div style={{ minWidth: '220px' }}>
                        <select
                            className="modern-control-sm font-tamil"
                            value={selectedVillage}
                            onChange={(e) => setSelectedVillage(e.target.value)}
                        >
                            <option value="">அனைத்து ஊர்களும் (All Villages)</option>
                            {villages.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 📋 MAIN RECORDS TABLE 📋 */}
            <div className="full-width-card glass-card table-card">
                <div className="table-responsive">
                    <table className="custom-table modern-table compact-table">
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '40px' }}>
                                    #
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Contributor Name</span>
                                        <span className="th-ta">நபர் பெயர்</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Village</span>
                                        <span className="th-ta">ஊர்</span>
                                    </div>
                                </th>
                                <th className="text-right">
                                    <div className="th-bilingual right">
                                        <span className="th-en">Received Amount</span>
                                        <span className="th-ta">வந்த மொய் ₹</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Occasion</span>
                                        <span className="th-ta">விசேஷம்</span>
                                    </div>
                                </th>
                                <th className="text-center">
                                    <div className="th-bilingual center">
                                        <span className="th-en">Status</span>
                                        <span className="th-ta">நிலை</span>
                                    </div>
                                </th>
                                <th className="text-left">
                                    <div className="th-bilingual">
                                        <span className="th-en">Notes / Closure Details</span>
                                        <span className="th-ta">குறிப்புகள்</span>
                                    </div>
                                </th>
                                <th className="text-center">
                                    <div className="th-bilingual center">
                                        <span className="th-en">Action</span>
                                        <span className="th-ta">செயல்</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-6 font-tamil">
                                        <Clock size={36} style={{ display: 'block', margin: '0 auto 8px auto', opacity: 0.3, color: '#F59E0B' }} />
                                        நிலுவை மொய் பதிவுகள் எதுவும் இல்லை (No pending return records found).
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => {
                                    const isPending = !item.status || item.status === 'Pending';
                                    const isClosedWithEntry = item.status === 'ClosedWithEntry';
                                    const isClosedWithoutEntry = item.status === 'ClosedWithoutEntry';

                                    return (
                                        <tr
                                            key={item.id || item.pendingReturnId || index}
                                            className="table-row-hover"
                                            style={{
                                                background: isPending ? 'rgba(245, 158, 11, 0.04)' : undefined,
                                            }}
                                        >
                                            <td className="text-center text-muted text-xs font-mono">{index + 1}</td>

                                            <td className="text-left font-semibold font-tamil" style={{ color: 'var(--text-header)' }}>
                                                {item.contributorName}
                                            </td>

                                            <td className="text-left font-tamil">
                                                <span className="badge-village">{item.village || '-'}</span>
                                            </td>

                                            <td className="text-right amount-col font-mono font-bold">
                                                ₹ {(item.receivedAmount || 0).toLocaleString('en-IN')}
                                            </td>

                                            <td className="text-left text-xs font-tamil">{item.occasion || '-'}</td>

                                            {/* Status Badge */}
                                            <td className="text-center">
                                                {isPending && (
                                                    <span
                                                        className="badge-term-tag font-tamil"
                                                        style={{
                                                            background: 'rgba(245, 158, 11, 0.2)',
                                                            color: '#FBBF24',
                                                            borderColor: 'rgba(245, 158, 11, 0.4)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <AlertCircle size={12} /> நிலுவையில் உள்ளது
                                                    </span>
                                                )}
                                                {isClosedWithEntry && (
                                                    <span
                                                        className="badge-term-tag font-tamil"
                                                        style={{
                                                            background: 'rgba(139, 92, 246, 0.2)',
                                                            color: '#A78BFA',
                                                            borderColor: 'rgba(139, 92, 246, 0.4)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <CheckCircle size={12} /> மொய் செய்து முடிந்தது
                                                    </span>
                                                )}
                                                {isClosedWithoutEntry && (
                                                    <span
                                                        className="badge-term-tag font-tamil"
                                                        style={{
                                                            background: 'rgba(156, 163, 175, 0.15)',
                                                            color: '#9CA3AF',
                                                            borderColor: 'rgba(156, 163, 175, 0.3)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <FileX size={12} /> மொய் இன்றி முடிந்தது
                                                    </span>
                                                )}
                                            </td>

                                            {/* Notes / Closure details */}
                                            <td className="text-left text-xs text-muted font-tamil">
                                                {item.notes || '-'}
                                                {item.closedAt && (
                                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#6B7280', fontFamily: 'monospace', marginTop: '2px' }}>
                                                        Closed: {new Date(item.closedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="text-center">
                                                <div className="row-actions-flex">
                                                    {isPending && canEdit && (
                                                        <button
                                                            onClick={() => handleOpenCloseModal(item)}
                                                            className="modern-btn font-tamil"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #D97706, #B45309)',
                                                                color: '#FFF',
                                                                padding: '0.35rem 0.75rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.3rem',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                            }}
                                                            title="நிலுவையை முடித்து வைக்குக"
                                                        >
                                                            <CheckCircle size={13} />
                                                            <span>நிலுவை முடித்தல்</span>
                                                        </button>
                                                    )}

                                                    {canDelete && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Delete pending record for ${item.contributorName}?`)) {
                                                                    onDeletePendingReturn(item.id || item.pendingReturnId);
                                                                }
                                                            }}
                                                            className="action-btn-sm delete-btn"
                                                            title="அழிப்பது (Delete)"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Close Pending Modal */}
            <ClosePendingModal
                isOpen={isCloseModalOpen}
                onClose={() => {
                    setIsCloseModalOpen(false);
                    setSelectedPendingItem(null);
                }}
                pendingItem={selectedPendingItem}
                onCloseWithEntry={onClosePendingWithEntry}
                onCloseWithoutEntry={onClosePendingWithoutEntry}
            />

            {/* Add Pending Modal */}
            {isAddModalOpen && (
                <div className="hyper-backdrop">
                    <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '520px' }}>
                        <div className="hyper-header purple-theme">
                            <div className="hyper-title-group">
                                <div className="hyper-icon-box glow-purple">
                                    <Clock size={20} />
                                </div>
                                <h3 className="font-tamil" style={{ margin: 0 }}>
                                    புதிய நிலுவை மொய் பதிவு (+ Pending Return)
                                </h3>
                            </div>
                            <button className="hyper-close-btn" onClick={() => setIsAddModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateNewPending} className="hyper-body">
                            <div className="hyper-field">
                                <label className="field-label font-tamil">நபர் பெயர் (Contributor Name) *</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newContributorName}
                                    onChange={setNewContributorName}
                                    placeholder="பெயர் உள்ளிடவும்"
                                    required
                                />
                            </div>

                            <div className="hyper-row-2">
                                <div className="hyper-field">
                                    <label className="field-label font-tamil">ஊர் (Village)</label>
                                    <TransliteratedInput
                                        className="hyper-input font-tamil"
                                        value={newVillage}
                                        onChange={setNewVillage}
                                        placeholder="ஊர் உள்ளிடவும்"
                                    />
                                </div>

                                <div className="hyper-field">
                                    <label className="field-label font-tamil">வந்த தொகை (Received ₹)</label>
                                    <input
                                        type="number"
                                        className="hyper-input"
                                        value={newReceivedAmount}
                                        onChange={(e) => setNewReceivedAmount(e.target.value)}
                                        placeholder="எ.கா. 1001"
                                    />
                                </div>
                            </div>

                            <div className="hyper-field">
                                <label className="field-label font-tamil">விசேஷம் / காரணம்</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newOccasion}
                                    onChange={setNewOccasion}
                                    placeholder="எ.கா. திருமணம் / மஞ்சள் நீராட்டு"
                                />
                            </div>

                            <div className="hyper-field">
                                <label className="field-label font-tamil">குறிப்புகள் (Notes)</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newNotes}
                                    onChange={setNewNotes}
                                    placeholder="கூடுதல் விபரம்"
                                />
                            </div>

                            <div className="hyper-footer">
                                <button type="button" className="hyper-btn btn-ghost-dark font-tamil" onClick={() => setIsAddModalOpen(false)}>
                                    ரத்து செய் (Cancel)
                                </button>
                                <button
                                    type="submit"
                                    className="hyper-btn btn-purple-neon font-tamil"
                                    disabled={isSubmitting}
                                    style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}
                                >
                                    சேமிக்கவும் (Save Pending)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
