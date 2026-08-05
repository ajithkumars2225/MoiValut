import React, { useState, useEffect } from 'react';
import { X, Coins, Plus, Check, ShieldCheck, Crown } from 'lucide-react';
import { TransliteratedInput } from '../TransliteratedInput';

export const GoldEntryModal = ({
    isOpen,
    onClose,
    onSave,
    editingGold,
    eventId,
}) => {
    const [name, setName] = useState('');
    const [village, setVillage] = useState('');
    const [goldDetails, setGoldDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingGold) {
            setName(editingGold.contributorName || '');
            setVillage(editingGold.village || '');
            setGoldDetails(editingGold.goldDetails || '');
        } else {
            setName('');
            setVillage('');
            setGoldDetails('');
        }
        setError('');
    }, [editingGold, isOpen]);

    if (!isOpen) return null;

    const GOLD_PRESETS = [
        '1 Sovereign Gold Chain (1 சவரன் சங்கிலி)',
        '0.5 Sovereign Gold Ring (அரை சவரன் மோதிரம்)',
        '2 Sovereigns Gold Chain (2 சவரன் கொடி)',
        '1 Sovereign Gold Coin (1 சவரன் காசு)',
        '4 Grams Gold Ring (4 கிராம் மோதிரம்)',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !goldDetails.trim()) return;

        setLoading(true);
        setError('');
        try {
            const data = {
                eventId,
                contributorName: name.trim(),
                village: village.trim(),
                goldDetails: goldDetails.trim(),
            };

            await onSave(data, editingGold?.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save gold entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="hyper-modal-card spring-popup gold-glow">
                {/* Header */}
                <div className="hyper-header gold-theme">
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-gold">
                            <Coins size={24} className="sparkle-gold" />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil gold-tag">பொன் / நகை சேர்க்கை</span>
                            <h3>{editingGold ? 'Edit Gold Gift' : 'Record Gold Gift'}</h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="hyper-body">
                    {error && <div className="hyper-alert alert-danger">{error}</div>}

                    <div className="hyper-field">
                        <label className="field-label">
                            Contributor Name (பெயர்) <span className="req">*</span>
                        </label>
                        <TransliteratedInput
                            value={name}
                            onChange={setName}
                            placeholder="Type in English (e.g. Ramesh)..."
                            className="hyper-input"
                            required
                        />
                    </div>

                    <div className="hyper-field">
                        <label className="field-label">Village / Location (ஊர்)</label>
                        <TransliteratedInput
                            value={village}
                            onChange={setVillage}
                            placeholder="Type village (e.g. Madurai)..."
                            className="hyper-input"
                        />
                    </div>

                    <div className="hyper-field">
                        <label className="field-label">
                            Gold Gift Details (நகை விவரம்) <span className="req">*</span>
                        </label>
                        <TransliteratedInput
                            value={goldDetails}
                            onChange={setGoldDetails}
                            placeholder="e.g. 1 Sovereign Gold Chain..."
                            className="hyper-input"
                            isTextArea
                            required
                        />
                    </div>

                    {/* Gold Presets */}
                    <div className="preset-pill-box gold-pill-box">
                        <div className="pill-header">
                            <Crown size={14} className="text-gold" />
                            <span className="font-tamil">மாதிரி நகை விவரங்கள்:</span>
                        </div>
                        <div className="preset-chips-flex">
                            {GOLD_PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="gold-chip-pill"
                                    onClick={() => setGoldDetails(preset)}
                                >
                                    + {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="hyper-footer">
                        <button type="button" className="hyper-btn btn-ghost-dark" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="hyper-btn btn-gold-neon" disabled={loading}>
                            {loading ? 'Saving...' : editingGold ? <><Check size={18} /> Update Gold</> : <><Plus size={18} /> Record Gold</>}
                        </button>
                    </div>
                </form>

                <div className="hyper-sub-footer">
                    <ShieldCheck size={14} /> Secured by PostgreSQL & .NET 9 Engine
                </div>
            </div>
        </div>
    );
};
