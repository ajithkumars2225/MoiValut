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
            setNotes(pendingItem.notes ? `Closed pending return. Notes: ${pendingItem.notes}` : '');
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
            <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '680px', width: '94%' }}>
                {/* Header */}
                <div className="hyper-header purple-theme">
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil">நிலுவை மொய் முடித்தல் (Close Pending Return)</span>
                            <h3 className="font-tamil" style={{ marginTop: '2px', fontSize: '1.1rem' }}>
                                {pendingItem.contributorName} ({pendingItem.village || 'ஊர் இல்லை'}) &nbsp;
                                <span style={{ color: '#34D399', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    (வந்த தொகை: ₹{pendingItem.receivedAmount || 0})
                                </span>
                            </h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose} disabled={isSubmitting}>
                        <X size={18} />
                    </button>
                </div>

                {/* Option Selector Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem 1.25rem 0.5rem 1.25rem' }}>
                    <button
                        type="button"
                        onClick={() => setCloseOption('with_entry')}
                        style={{
                            padding: '0.85rem',
                            borderRadius: '12px',
                            border: closeOption === 'with_entry' ? '2px solid #8B5CF6' : '1px solid var(--border-color)',
                            background: closeOption === 'with_entry' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-control-sm)',
                            color: closeOption === 'with_entry' ? '#FFF' : 'var(--text-muted)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div className="font-tamil" style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <Send size={15} /> 1. மொய் செய்து பதிவு செய்ய (With Entry)
                        </div>
                        <div className="font-tamil" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            நாம் செய்த மொய் விபரங்களை பதிவு செய்து நிலுவையை முடித்தல்.
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCloseOption('without_entry')}
                        style={{
                            padding: '0.85rem',
                            borderRadius: '12px',
                            border: closeOption === 'without_entry' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                            background: closeOption === 'without_entry' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-control-sm)',
                            color: closeOption === 'without_entry' ? '#FFF' : 'var(--text-muted)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div className="font-tamil" style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <FileX size={15} /> 2. நேரடியாக முடிக்க (Without Entry)
                        </div>
                        <div className="font-tamil" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            மொய் பதிவின்றி காரணத்துடன் நேரடியாக முடித்தல்.
                        </div>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleConfirm} className="hyper-body" style={{ paddingTop: '0.5rem' }}>
                    {closeOption === 'with_entry' ? (
                        <>
                            {/* Gift Type Toggle */}
                            <div className="hyper-field">
                                <label className="field-label font-tamil">மொய் வகை (Gift Type)</label>
                                <div className="hyper-row-2">
                                    <button
                                        type="button"
                                        className={`preset-pill-btn flex-align justify-center ${giftType === 'Cash' ? 'selected-purple' : ''}`}
                                        style={{ padding: '0.55rem', borderRadius: '10px', fontWeight: 'bold' }}
                                        onClick={() => setGiftType('Cash')}
                                    >
                                        <IndianRupee size={15} /> பணம் (Cash)
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-pill-btn flex-align justify-center ${giftType === 'Gold' ? 'selected-purple' : ''}`}
                                        style={{
                                            padding: '0.55rem',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            background: giftType === 'Gold' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : undefined,
                                        }}
                                        onClick={() => setGiftType('Gold')}
                                    >
                                        <Coins size={15} /> பொன் (Gold)
                                    </button>
                                </div>
                            </div>

                            {giftType === 'Cash' ? (
                                <div className="hyper-field">
                                    <label className="field-label font-tamil">செய்த மொய் தொகை (Given Amount ₹) *</label>
                                    <div className="input-with-symbol">
                                        <span className="symbol-badge">₹</span>
                                        <input
                                            type="number"
                                            className="hyper-input with-indent"
                                            value={givenAmount}
                                            onChange={(e) => setGivenAmount(e.target.value)}
                                            placeholder="எ.கா. 1001"
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="preset-chips-flex" style={{ marginTop: '0.4rem' }}>
                                        {PRESET_AMOUNTS.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                className="preset-pill-btn"
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                                                onClick={() => setGivenAmount(amt.toString())}
                                            >
                                                +₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="hyper-field">
                                    <label className="field-label font-tamil">பொன் விபரம் (Gold Details) *</label>
                                    <TransliteratedInput
                                        className="hyper-input"
                                        value={goldDetails}
                                        onChange={setGoldDetails}
                                        placeholder="எ.கா. 1 சவரன் தங்க சங்கிலி"
                                        required
                                    />
                                </div>
                            )}

                            <div className="hyper-row-2">
                                <div className="hyper-field">
                                    <label className="field-label font-tamil">விசேஷம் / நிகழ்ச்சி *</label>
                                    <select
                                        className="hyper-input modern-control font-tamil"
                                        value={occasion}
                                        onChange={(e) => setOccasion(e.target.value)}
                                    >
                                        {OCCASIONS.map((occ) => (
                                            <option key={occ} value={occ}>
                                                {occ}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hyper-field">
                                    <label className="field-label font-tamil">மொய் செய்த தேதி *</label>
                                    <input
                                        type="date"
                                        className="hyper-input"
                                        value={givenDate}
                                        onChange={(e) => setGivenDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {occasion === 'மற்றவை (Other)' && (
                                <div className="hyper-field">
                                    <label className="field-label font-tamil">விசேஷ பெயர் உள்ளிடவும்</label>
                                    <TransliteratedInput
                                        className="hyper-input font-tamil"
                                        value={customOccasion}
                                        onChange={setCustomOccasion}
                                        placeholder="நிகழ்ச்சி பெயர் உள்ளிடவும்"
                                        required
                                    />
                                </div>
                            )}

                            <div className="hyper-field">
                                <label className="field-label font-tamil">குறிப்புகள் (Notes / Remarks)</label>
                                <TransliteratedInput
                                    className="hyper-input font-tamil"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="கூடுதல் விவரங்கள் (தேவையென்றால்)"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="hyper-field">
                            <div
                                style={{
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.82rem',
                                    color: '#FBBF24',
                                }}
                                className="font-tamil"
                            >
                                <AlertCircle size={16} />
                                <span>
                                    <strong>{pendingItem.contributorName}</strong> என்பவரின் நிலுவை பதிவு புதிய மொய் இன்றி முடித்து வைக்கப்படும்.
                                </span>
                            </div>

                            <label className="field-label font-tamil">நிலுவை முடிப்பதற்கான காரணம் / குறிப்பு</label>
                            <TransliteratedInput
                                className="hyper-input font-tamil"
                                value={closeReason}
                                onChange={setCloseReason}
                                placeholder="எ.கா. நேரில் சென்று வாழ்த்து தெரிவிக்கப்பட்டது / நேரடியாக தொகையை திருப்பியளிக்கப்பட்டது"
                            />
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="hyper-footer" style={{ marginTop: '1rem' }}>
                        <button type="button" className="hyper-btn btn-ghost-dark font-tamil" onClick={onClose} disabled={isSubmitting}>
                            ரத்து செய் (Cancel)
                        </button>
                        <button
                            type="submit"
                            className={`hyper-btn ${closeOption === 'with_entry' ? 'btn-purple-neon' : 'btn-export-pdf'}`}
                            disabled={isSubmitting}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
                        >
                            {isSubmitting ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
                            <span className="font-tamil">
                                {closeOption === 'with_entry' ? 'மொய் பதிவு செய்து முடி (Save & Close)' : 'நிலுவை முடித்து வை (Close Pending)'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
