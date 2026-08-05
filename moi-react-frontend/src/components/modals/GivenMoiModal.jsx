import React, { useState, useEffect } from 'react';
import { X, Send, IndianRupee, Coins, Loader } from 'lucide-react';
import { TransliteratedInput } from '../TransliteratedInput';

const OCCASIONS = [
    'திருமணம் (Marriage)',
    'காதுகுத்து (Ear Piercing)',
    'மஞ்சள் நீராட்டு (Puberty)',
    'கிரகப்பிரவேசம் (House Warming)',
    'பிறந்தநாள் (Birthday)',
    'மற்றவை (Other)',
];

const GIFT_TERMS = [
    { id: '1st Time', label: '1st Time (1-ஆம் முறை)' },
    { id: '2nd Time', label: '2nd Time (2-ஆம் முறை)' },
    { id: '3rd Time', label: '3rd Time (3-ஆம் முறை)' },
    { id: 'Return Moi', label: 'Return Moi (திரும்ப செய்த மொய்)' },
    { id: 'Special Gift', label: 'Special Gift (சிறப்பு மொய்)' },
];

const PRESET_AMOUNTS = [501, 1001, 2001, 5001, 10001];

export const GivenMoiModal = ({ isOpen, onClose, onSave, editingEntry, eventId }) => {
    const [recipientName, setRecipientName] = useState('');
    const [village, setVillage] = useState('');
    const [giftType, setGiftType] = useState('Cash');
    const [goldDetails, setGoldDetails] = useState('');
    const [occasion, setOccasion] = useState('திருமணம் (Marriage)');
    const [customOccasion, setCustomOccasion] = useState('');
    const [giftTerm, setGiftTerm] = useState('1st Time');
    const [amount, setAmount] = useState('');
    const [givenDate, setGivenDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingEntry) {
            setRecipientName(editingEntry.recipientName || '');
            setVillage(editingEntry.village || '');
            setGiftType(editingEntry.giftType || 'Cash');
            setGoldDetails(editingEntry.goldDetails || '');
            setOccasion(editingEntry.occasion || 'திருமணம் (Marriage)');
            setGiftTerm(editingEntry.giftTerm || '1st Time');
            setAmount(editingEntry.amount?.toString() || '');
            setGivenDate(editingEntry.givenDate
                ? new Date(editingEntry.givenDate).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10));
            setNotes(editingEntry.notes || '');
        } else {
            setRecipientName('');
            setVillage('');
            setGiftType('Cash');
            setGoldDetails('');
            setOccasion('திருமணம் (Marriage)');
            setCustomOccasion('');
            setGiftTerm('1st Time');
            setAmount('');
            setGivenDate(new Date().toISOString().slice(0, 10));
            setNotes('');
        }
    }, [editingEntry, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recipientName.trim()) { alert('Please enter recipient name (பெயர்).'); return; }
        if (!amount || Number(amount) <= 0) { alert('Please enter a valid gift amount (தொகை).'); return; }
        if (giftType === 'Gold' && !goldDetails.trim()) { alert('Please enter gold details (பொன் விபரம்).'); return; }

        const finalOccasion = occasion === 'மற்றவை (Other)' ? (customOccasion || 'மற்றவை') : occasion;

        try {
            setIsSubmitting(true);

            const givenMoiData = {
                recipientName: recipientName.trim(),
                village: village.trim(),
                giftType,
                goldDetails: giftType === 'Gold' ? goldDetails.trim() : '',
                occasion: finalOccasion,
                giftTerm,
                amount: Number(amount),
                givenDate: new Date(givenDate).toISOString(),
                notes: notes.trim(),
                eventId: eventId || null,
            };

            await onSave(givenMoiData, editingEntry?.id);
            onClose();
        } catch (err) {
            alert('Failed to save given moi entry: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="hyper-backdrop">
            <div className="hyper-modal-card purple-glow spring-popup" style={{ maxWidth: '660px' }}>
                <div className="hyper-header purple-theme">
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple"><Send size={20} /></div>
                        <div>
                            <span className="hyper-tag">Given Moi Ledger (நாம் செய்த மொய்)</span>
                            <h3>{editingEntry ? 'Edit Given Gift Entry' : 'Record Given Gift (நாம் செய்த மொய் பதிவு)'}</h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="hyper-body">
                    {/* Gift Type Toggle */}
                    <div className="hyper-field">
                        <label className="field-label">Select Gift Type (மொய் வகை)</label>
                        <div className="hyper-row-2">
                            <button type="button"
                                className={`preset-pill-btn flex-align justify-center ${giftType === 'Cash' ? 'selected-purple' : ''}`}
                                style={{ padding: '0.65rem', borderRadius: '10px' }}
                                onClick={() => setGiftType('Cash')}>
                                <IndianRupee size={16} /> Cash Gift (பண மொய்)
                            </button>
                            <button type="button"
                                className={`preset-pill-btn flex-align justify-center ${giftType === 'Gold' ? 'selected-purple' : ''}`}
                                style={{ padding: '0.65rem', borderRadius: '10px', background: giftType === 'Gold' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : undefined }}
                                onClick={() => setGiftType('Gold')}>
                                <Coins size={16} /> Gold Gift (பொன் மொய்)
                            </button>
                        </div>
                    </div>

                    {/* Gold Details */}
                    {giftType === 'Gold' && (
                        <div className="hyper-field">
                            <label className="field-label">Gold Details (பொன் விபரம்) <span className="req">*</span></label>
                            <TransliteratedInput value={goldDetails} onChange={setGoldDetails}
                                placeholder="e.g. 1 Savaran Gold Ring (1 சவரன் தங்க மோதிரம்)..."
                                className="hyper-input" />
                        </div>
                    )}

                    {/* Row 1: Village & Name */}
                    <div className="hyper-row-2">
                        <div className="hyper-field">
                            <label className="field-label">Village / Location (ஊர்)</label>
                            <TransliteratedInput value={village} onChange={setVillage}
                                placeholder="Type English for Tamil village..." className="hyper-input" />
                        </div>
                        <div className="hyper-field">
                            <label className="field-label">Recipient Name (பெயர்) <span className="req">*</span></label>
                            <TransliteratedInput value={recipientName} onChange={setRecipientName}
                                placeholder="Type English for Tamil name..." className="hyper-input" />
                        </div>
                    </div>

                    {/* Row 2: Occasion & Gift Term */}
                    <div className="hyper-row-2">
                        <div className="hyper-field">
                            <label className="field-label">Occasion / Function (சுபநிகழ்ச்சி)</label>
                            <select className="hyper-input modern-control" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="hyper-field">
                            <label className="field-label">Gift Term (முறை — Default 3 Terms)</label>
                            <select className="hyper-input modern-control" value={giftTerm} onChange={(e) => setGiftTerm(e.target.value)}>
                                {GIFT_TERMS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Term Quick Chips */}
                    <div className="preset-chips-flex">
                        {GIFT_TERMS.map((t) => (
                            <button key={t.id} type="button"
                                className={`preset-pill-btn ${giftTerm === t.id ? 'selected-purple' : ''}`}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                onClick={() => setGiftTerm(t.id)}>
                                {t.id}
                            </button>
                        ))}
                    </div>

                    {/* Custom Occasion */}
                    {occasion === 'மற்றவை (Other)' && (
                        <div className="hyper-field">
                            <label className="field-label">Specify Occasion (நிகழ்ச்சி விபரம்)</label>
                            <input type="text" className="hyper-input" value={customOccasion}
                                onChange={(e) => setCustomOccasion(e.target.value)}
                                placeholder="e.g. காதுகுத்து விழா..." />
                        </div>
                    )}

                    {/* Amount */}
                    <div className="hyper-field">
                        <label className="field-label">
                            {giftType === 'Gold' ? 'Gold Equivalent Value (பொன் மதிப்பு ₹)' : 'Gift Amount (நாம் கொடுத்த தொகை ₹)'}
                            <span className="req"> *</span>
                        </label>
                        <div className="input-with-symbol">
                            <span className="symbol-badge">₹</span>
                            <input type="number" className="hyper-input with-indent"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 1001" min="1" required />
                        </div>

                    </div>

                    {/* Date & Notes */}
                    <div className="hyper-row-2">
                        <div className="hyper-field">
                            <label className="field-label">Given Date (கொடுத்த தேதி)</label>
                            <input type="date" className="hyper-input" value={givenDate} onChange={(e) => setGivenDate(e.target.value)} />
                        </div>
                        <div className="hyper-field">
                            <label className="field-label">Notes / Remarks (குறிப்புகள்)</label>
                            <input type="text" className="hyper-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="hyper-footer">
                        <button type="button" className="hyper-btn btn-ghost-dark" onClick={onClose}>Cancel</button>
                        <button type="submit" className="hyper-btn btn-purple-neon" disabled={isSubmitting}>
                            {isSubmitting ? <Loader size={15} className="spin" /> : <Send size={16} />}
                            {editingEntry ? 'Update Entry' : '+ Record Given Gift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
