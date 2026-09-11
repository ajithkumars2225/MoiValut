import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Send, FileX, IndianRupee, Coins, Loader, AlertCircle } from 'lucide-react';
import { TransliteratedInput } from '../TransliteratedInput';

const OCCASIONS = [
    'திருமணம் (Marriage)',
    'காதுகுத்து (Ear Piercing)',
    'மஞ்சள் நீராட்டு (Puberty)',
    'கிரகப்பிரவேசம் (House Warming)',
    'பிறந்தநாள் (Birthday)',
    'மற்றவை (Other)',
];

const PRESET_AMOUNTS = [501, 1001, 2001, 5001, 10001];

export const ClosePendingModal = ({
    isOpen,
    onClose,
    pendingItem,
    onCloseWithEntry,
    onCloseWithoutEntry,
}) => {
    const [closeOption, setCloseOption] = useState('with_entry'); // 'with_entry' | 'without_entry'

    // Form fields for Option 1 (Given Moi)
    const [givenAmount, setGivenAmount] = useState('');
    const [giftType, setGiftType] = useState('Cash');
    const [goldDetails, setGoldDetails] = useState('');
    const [occasion, setOccasion] = useState('திருமணம் (Marriage)');
    const [customOccasion, setCustomOccasion] = useState('');
    const [giftTerm, setGiftTerm] = useState('Return Moi');
    const [givenDate, setGivenDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');

    // Form fields for Option 2 (Without Entry)
    const [closeReason, setCloseReason] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (pendingItem) {
            setGivenAmount(pendingItem.receivedAmount ? pendingItem.receivedAmount.toString() : '');
            setGiftType('Cash');
            setGoldDetails('');
            setOccasion(pendingItem.occasion || 'திருமணம் (Marriage)');
            setCustomOccasion('');
            setGiftTerm('Return Moi');
            setGivenDate(new Date().toISOString().slice(0, 10));
            setNotes(pendingItem.notes ? `Closed pending return. Original notes: ${pendingItem.notes}` : '');
            setCloseReason('');
            setCloseOption('with_entry');
        }
    }, [pendingItem, isOpen]);

    if (!isOpen || !pendingItem) return null;

    const handleConfirm = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (closeOption === 'with_entry') {
                const finalOccasion = occasion === 'மற்றவை (Other)' ? (customOccasion || 'மற்றவை') : occasion;
                const givenMoiData = {
                    recipientName: pendingItem.contributorName,
                    village: pendingItem.village || '',
                    giftType,
                    goldDetails: giftType === 'Gold' ? goldDetails.trim() : '',
                    occasion: finalOccasion,
                    giftTerm,
                    amount: givenAmount ? Number(givenAmount) : 0,
                    givenDate: new Date(givenDate).toISOString(),
                    notes: notes.trim(),
                    eventId: pendingItem.eventId || null,
                };
                await onCloseWithEntry(pendingItem.id || pendingItem.pendingReturnId, givenMoiData);
            } else {
                await onCloseWithoutEntry(pendingItem.id || pendingItem.pendingReturnId, closeReason.trim());
            }
            onClose();
        } catch (err) {
            alert('Error closing pending return: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="hyper-backdrop">
            <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '680px', width: '92%' }}>
                {/* Header */}
                <div className="hyper-modal-header">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-400 border border-amber-500/30">
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <h3 className="hyper-modal-title font-tamil">நிலுவை மொய் முடித்தல் (Close Pending Return)</h3>
                            <p className="hyper-modal-sub font-tamil">
                                நபர்: <strong>{pendingItem.contributorName}</strong> ({pendingItem.village || 'ஊர் இல்லை'}) | வந்த தொகை: ₹{pendingItem.receivedAmount || 0}
                            </p>
                        </div>
                    </div>
                    <button className="hyper-icon-btn" onClick={onClose} disabled={isSubmitting}>
                        <X size={18} />
                    </button>
                </div>

                {/* Option Selector Cards */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 border-b border-slate-800/80">
                    <button
                        type="button"
                        onClick={() => setCloseOption('with_entry')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            closeOption === 'with_entry'
                                ? 'bg-purple-950/40 border-purple-500/80 text-purple-200 ring-2 ring-purple-500/30'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1.5 font-bold font-tamil text-sm text-purple-300">
                            <Send size={16} />
                            <span>1. மொய் செய்து பதிவு செய்து முடிக்க (With Entry)</span>
                        </div>
                        <p className="text-xs text-slate-400 font-tamil leading-relaxed">
                            அவர்களின் விசேஷத்தில் நாம் செய்த மொய் விவரங்களை பதிவு செய்து நிலுவையை முடிக்கும் முறை.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCloseOption('without_entry')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            closeOption === 'without_entry'
                                ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/30'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1.5 font-bold font-tamil text-sm text-amber-300">
                            <FileX size={16} />
                            <span>2. மொய் இன்றி நேரடியாக முடிக்க (Without Entry)</span>
                        </div>
                        <p className="text-xs text-slate-400 font-tamil leading-relaxed">
                            புதிய மொய் பதிவு இன்றி காரணத்துடன் நிலுவையை நேரடியாக முடித்தல்.
                        </p>
                    </button>
                </div>

                {/* Main Form Body */}
                <form onSubmit={handleConfirm} className="hyper-modal-body space-y-4">
                    {closeOption === 'with_entry' ? (
                        <>
                            <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2 font-tamil">
                                <AlertCircle size={16} className="shrink-0 text-purple-400" />
                                <span>
                                    இப் படிவம் மூலம் <strong>{pendingItem.contributorName}</strong> பெயரில் "செய்த மொய் (Given Moi)" பதிவு செய்யப்பட்டு, நிலுவை முடித்து வைக்கப்படும்.
                                </span>
                            </div>

                            {/* Gift Type Toggle */}
                            <div className="flex items-center gap-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-xs font-semibold text-slate-300 font-tamil">மொய் வகை:</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            giftType === 'Cash'
                                                ? 'bg-purple-600 text-white shadow-md'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                        onClick={() => setGiftType('Cash')}
                                    >
                                        <IndianRupee size={14} /> பணம் (Cash)
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            giftType === 'Gold'
                                                ? 'bg-amber-600 text-white shadow-md'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                        onClick={() => setGiftType('Gold')}
                                    >
                                        <Coins size={14} /> பொன் (Gold)
                                    </button>
                                </div>
                            </div>

                            {giftType === 'Cash' ? (
                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">செய்த மொய் தொகை (Amount ₹) *</label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="number"
                                            className="hyper-input pl-9"
                                            value={givenAmount}
                                            onChange={(e) => setGivenAmount(e.target.value)}
                                            placeholder="எ.கா. 1001"
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {PRESET_AMOUNTS.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 border border-slate-700/60 hover:border-purple-500 text-slate-300 hover:text-white transition-all font-mono"
                                                onClick={() => setGivenAmount(amt.toString())}
                                            >
                                                +₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">பொன் விபரம் (Gold Details) *</label>
                                    <TransliteratedInput
                                        className="hyper-input"
                                        value={goldDetails}
                                        onChange={setGoldDetails}
                                        placeholder="எ.கா. 1 சவரன் தங்க சங்கிலி"
                                        required
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Occasion */}
                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">விசேஷம் / நிகழ்ச்சி *</label>
                                    <select
                                        className="hyper-input font-tamil"
                                        value={occasion}
                                        onChange={(e) => setOccasion(e.target.value)}
                                    >
                                        {OCCASIONS.map((occ) => (
                                            <option key={occ} value={occ}>
                                                {occ}
                                            </option>
                                        ))}
                                    </select>
                                    {occasion === 'மற்றவை (Other)' && (
                                        <TransliteratedInput
                                            className="hyper-input mt-2 font-tamil"
                                            value={customOccasion}
                                            onChange={setCustomOccasion}
                                            placeholder="நிகழ்ச்சி பெயர் உள்ளிடவும்"
                                            required
                                        />
                                    )}
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <label className="hyper-label font-tamil">மொய் செய்த தேதி *</label>
                                    <input
                                        type="date"
                                        className="hyper-input"
                                        value={givenDate}
                                        onChange={(e) => setGivenDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="hyper-label font-tamil">குறிப்புகள் (Notes / Remarks)</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="கூடுதல் விவரங்கள் (தேவையென்றால்)"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2 font-tamil">
                                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                                <span>
                                    <strong>{pendingItem.contributorName}</strong> என்பவரின் நிலுவை மொய் பதிவு எவ்வித புதிய மொய் பதிவும் இன்றி முடித்து வைக்கப்படும்.
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="hyper-label font-tamil">நிலுவை முடிப்பதற்கான காரணம் / குறிப்பு</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={closeReason}
                                    onChange={setCloseReason}
                                    placeholder="எ.கா. நேரில் சென்று வாழ்த்து தெரிவிக்கப்பட்டது / நேரடியாக தொகையை திருப்பியளிக்கப்பட்டது"
                                    rows={3}
                                />
                            </div>
                        </>
                    )}

                    {/* Footer Actions */}
                    <div className="hyper-modal-footer pt-3 flex justify-end gap-2 border-t border-slate-800">
                        <button
                            type="button"
                            className="hyper-btn-secondary font-tamil"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            ரத்து செய் (Cancel)
                        </button>
                        <button
                            type="submit"
                            className={`hyper-btn-primary font-tamil flex items-center gap-2 ${
                                closeOption === 'with_entry' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-amber-600 hover:bg-amber-500'
                            }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader size={16} className="animate-spin" />
                            ) : (
                                <CheckCircle size={16} />
                            )}
                            <span>
                                {closeOption === 'with_entry'
                                    ? 'மொய் பதிவு செய்து நிலுவை முடி (Save & Close)'
                                    : 'நிலுவை முடித்து வை (Close Pending)'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
