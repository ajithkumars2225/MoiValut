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
    Calendar,
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

    // Villages list for filter
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
            'Status (நிலை)': item.status === 'Pending' ? 'நிலுவை (Pending)' : item.status === 'ClosedWithEntry' ? 'மொய் செய்து முடிந்தது' : 'மொய் இன்றி முடிந்தது',
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
        <div className="view-container space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white font-tamil flex items-center gap-2">
                            நிலுவை மொய் மேலாண்மை <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">Pending Returns</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-tamil mt-0.5">
                            நமக்கு மொய் செய்தவர்களின் குடும்ப விசேஷத்திற்கு திருப்பியளிக்க வேண்டிய நிலுவை மொய்களை மேலாண்மை செய்யவும்.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleExportExcel}
                        className="hyper-btn-secondary text-xs font-tamil flex items-center gap-1.5"
                        title="Excel கோப்பாக பதிவிறக்குக"
                    >
                        <FileSpreadsheet size={16} className="text-emerald-400" />
                        <span>Excel Export</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="hyper-btn-secondary text-xs font-tamil flex items-center gap-1.5"
                    >
                        <Printer size={16} className="text-blue-400" />
                        <span>Print</span>
                    </button>
                    {canAdd && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="hyper-btn-primary text-xs font-tamil flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500"
                        >
                            <Plus size={16} />
                            <span>நிலுவை மொய் சேர்க்க (+ Add Pending)</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 font-tamil">நிலுவையில் உள்ளவை (Pending)</p>
                        <h3 className="text-2xl font-bold text-amber-400 font-mono mt-1">{stats.pendingCount}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">மொத்த நிலுவைத் தொகை: ₹{stats.pendingAmountTotal.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                        <AlertCircle size={24} />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 font-tamil">மொய் செய்து முடிந்தவை (With Entry)</p>
                        <h3 className="text-2xl font-bold text-purple-400 font-mono mt-1">{stats.closedWithEntryCount}</h3>
                        <p className="text-xs text-purple-300/70 font-tamil mt-0.5">செய்த மொய் பதிவுடன் முடிந்தது</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                        <Send size={24} />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 font-tamil">நேரடியாக முடிந்தவை (Without Entry)</p>
                        <h3 className="text-2xl font-bold text-slate-300 font-mono mt-1">{stats.closedWithoutEntryCount}</h3>
                        <p className="text-xs text-slate-400 font-tamil mt-0.5">காரணத்துடன் முடிந்தது</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400">
                        <FileX size={24} />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 font-tamil">மொத்த பதிவுகள் (Total Records)</p>
                        <h3 className="text-2xl font-bold text-emerald-400 font-mono mt-1">{stats.totalCount}</h3>
                        <p className="text-xs text-emerald-300/70 font-tamil mt-0.5">வரலாறு உட்பட</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters Bar & Tabs */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tamil transition-all ${
                            statusFilter === 'all'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        onClick={() => setStatusFilter('all')}
                    >
                        அனைத்தும் (All - {stats.totalCount})
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tamil transition-all flex items-center gap-1.5 ${
                            statusFilter === 'Pending'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        onClick={() => setStatusFilter('Pending')}
                    >
                        <AlertCircle size={14} /> நிலுவையில் உள்ளவை (Pending - {stats.pendingCount})
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tamil transition-all flex items-center gap-1.5 ${
                            statusFilter === 'ClosedWithEntry'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        onClick={() => setStatusFilter('ClosedWithEntry')}
                    >
                        <CheckCircle size={14} /> மொய் செய்து முடிந்தவை ({stats.closedWithEntryCount})
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tamil transition-all flex items-center gap-1.5 ${
                            statusFilter === 'ClosedWithoutEntry'
                                ? 'bg-slate-700 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        onClick={() => setStatusFilter('ClosedWithoutEntry')}
                    >
                        <FileX size={14} /> நேரடியாக முடிந்தவை ({stats.closedWithoutEntryCount})
                    </button>
                </div>

                {/* Search & Inputs */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <TransliteratedInput
                            className="hyper-input pl-9 font-tamil"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="பெயர், ஊர், விசேஷம் தேடவும்..."
                        />
                    </div>

                    {/* Village Dropdown */}
                    <div className="w-full sm:w-56">
                        <select
                            className="hyper-input font-tamil"
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

            {/* Main Records Table */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider font-tamil">
                                <th className="p-3.5 w-12 text-center">#</th>
                                <th className="p-3.5">நபர் பெயர் (Contributor Name)</th>
                                <th className="p-3.5">ஊர் (Village)</th>
                                <th className="p-3.5 text-right">நமக்கு தந்த மொய் (Received Amount)</th>
                                <th className="p-3.5">நிகழ்ச்சி / விசேஷம்</th>
                                <th className="p-3.5 text-center">நிலை (Status)</th>
                                <th className="p-3.5">குறிப்புகள் / முடித்த விவரம்</th>
                                <th className="p-3.5 text-right">நடவடிக்கை (Action)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-slate-500 font-tamil">
                                        <Clock size={40} className="mx-auto mb-3 opacity-30 text-amber-400" />
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
                                            className={`hover:bg-slate-800/40 transition-colors ${
                                                isPending ? 'bg-amber-950/10' : ''
                                            }`}
                                        >
                                            <td className="p-3.5 text-center font-mono text-slate-400 text-xs">
                                                {index + 1}
                                            </td>

                                            <td className="p-3.5 font-bold text-white font-tamil">
                                                {item.contributorName}
                                            </td>

                                            <td className="p-3.5 text-slate-300 font-tamil">
                                                {item.village ? (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={13} className="text-slate-400 shrink-0" />
                                                        {item.village}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>

                                            <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                                                ₹{(item.receivedAmount || 0).toLocaleString()}
                                            </td>

                                            <td className="p-3.5 text-slate-300 text-xs font-tamil">
                                                {item.occasion || '-'}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-3.5 text-center">
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-tamil">
                                                        <AlertCircle size={13} />
                                                        நிலுவையில் உள்ளது
                                                    </span>
                                                )}
                                                {isClosedWithEntry && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 font-tamil">
                                                        <CheckCircle size={13} />
                                                        மொய் செய்து முடிந்தது
                                                    </span>
                                                )}
                                                {isClosedWithoutEntry && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 font-tamil">
                                                        <FileX size={13} />
                                                        மொய் இன்றி முடிந்தது
                                                    </span>
                                                )}
                                            </td>

                                            {/* Notes / Closure details */}
                                            <td className="p-3.5 text-xs text-slate-400 font-tamil max-w-xs truncate">
                                                {item.notes || '-'}
                                                {item.closedAt && (
                                                    <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                                                        Closed: {new Date(item.closedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isPending && canEdit && (
                                                        <button
                                                            onClick={() => handleOpenCloseModal(item)}
                                                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-tamil flex items-center gap-1 shadow-sm transition-all"
                                                            title="நிலுவையை முடித்து வைக்குக"
                                                        >
                                                            <CheckCircle size={14} />
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
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="அழிப்பது (Delete)"
                                                        >
                                                            <Trash2 size={16} />
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
                        <div className="hyper-modal-header">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                    <Clock size={20} />
                                </div>
                                <h3 className="hyper-modal-title font-tamil">புதிய நிலுவை மொய் பதிவு (+ Pending Return)</h3>
                            </div>
                            <button className="hyper-icon-btn" onClick={() => setIsAddModalOpen(false)}>
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateNewPending} className="hyper-modal-body space-y-4">
                            <div className="space-y-2">
                                <label className="hyper-label font-tamil">நபர் பெயர் (Contributor Name) *</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newContributorName}
                                    onChange={setNewContributorName}
                                    placeholder="பெயர் உள்ளிடவும்"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">ஊர் (Village)</label>
                                    <TransliteratedInput
                                        className="hyper-input font-tamil"
                                        value={newVillage}
                                        onChange={setNewVillage}
                                        placeholder="ஊர் உள்ளிடவும்"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">வந்த தொகை (Received ₹)</label>
                                    <input
                                        type="number"
                                        className="hyper-input"
                                        value={newReceivedAmount}
                                        onChange={(e) => setNewReceivedAmount(e.target.value)}
                                        placeholder="எ.கா. 1001"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="hyper-label font-tamil">விசேஷம் / காரணம்</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newOccasion}
                                    onChange={setNewOccasion}
                                    placeholder="எ.கா. திருமணம் / மஞ்சள் நீராட்டு"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="hyper-label font-tamil">குறிப்புகள் (Notes)</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={newNotes}
                                    onChange={setNewNotes}
                                    placeholder="கூடுதல் விபரம்"
                                />
                            </div>

                            <div className="hyper-modal-footer pt-3 flex justify-end gap-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    className="hyper-btn-secondary font-tamil"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    ரத்து செய் (Cancel)
                                </button>
                                <button
                                    type="submit"
                                    className="hyper-btn-primary font-tamil bg-amber-600 hover:bg-amber-500"
                                    disabled={isSubmitting}
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
