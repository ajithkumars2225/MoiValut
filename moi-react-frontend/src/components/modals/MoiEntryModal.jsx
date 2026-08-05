import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
    X, Sparkles, Plus, Check, ShieldCheck, Zap, Repeat, History,
    CheckCircle, AlertTriangle, AlertCircle, HelpCircle, Loader, Settings,
} from 'lucide-react';
import { TransliteratedInput } from '../TransliteratedInput';
import { api } from '../../services/api';

export const MoiEntryModal = ({
    isOpen,
    onClose,
    onSave,
    editingTx,
    eventId,
    settings = {},
    givenEntries = [],
}) => {
    const [name, setName] = useState('');
    const [village, setVillage] = useState('');
    const [amount, setAmount] = useState('');
    const [giftTerm, setGiftTerm] = useState('1st Time');
    const [returnAmount, setReturnAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Conflict settings
    const conflictMode     = settings.conflictCheckMode || 'auto';
    const conflictAutoSave = settings.conflictAutoSave !== false;

    // Manual mode: did user click "Check"?
    const [manualChecked, setManualChecked] = useState(false);

    useEffect(() => {
        if (editingTx) {
            setName(editingTx.contributorName || '');
            setVillage(editingTx.village || '');
            setAmount(editingTx.amount ? editingTx.amount.toString() : '');
            setGiftTerm(editingTx.giftTerm || '1st Time');
            setReturnAmount(editingTx.returnAmount ? editingTx.returnAmount.toString() : '');
        } else {
            setName(''); setVillage(''); setAmount('');
            setGiftTerm('1st Time'); setReturnAmount('');
        }
        setError('');
        setManualChecked(false);
    }, [editingTx, isOpen]);

    // ── CORE CONFLICT LOGIC: Compare Prev Return input vs Given Gift ledger ──
    const conflictResult = useMemo(() => {
        const userPrevReturn = Number(returnAmount);
        if (!name.trim()) return null;

        const nameNorm = name.trim().toLowerCase();
        const villageNorm = village.trim().toLowerCase();

        // Search Record Given Gift (givenEntries) for matching recipient name + village
        const matched = givenEntries.filter((g) =>
            g.recipientName?.toLowerCase() === nameNorm &&
            (!villageNorm || g.village?.toLowerCase() === villageNorm)
        );

        const recordedGivenTotal = matched.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

        // If no Record Given Gift found and no Prev Return typed, no conflict check
        if (recordedGivenTotal <= 0 && (!userPrevReturn || userPrevReturn <= 0)) return null;

        // If user hasn't typed Prev Return yet, inform them of the Recorded Given Gift amount
        if (!userPrevReturn || userPrevReturn <= 0) {
            return {
                status: 'NoPreviousRecord',
                icon: HelpCircle,
                color: '#9CA3AF',
                bg: 'rgba(156,163,175,0.1)',
                border: 'rgba(156,163,175,0.25)',
                label: '📋 Record Given Gift-ல் முன்பதிவு உள்ளது',
                note: `Record Given Gift ஏட்டில் '${name.trim()}' நபருக்கு ₹${recordedGivenTotal.toLocaleString('en-IN')} பதிவு உள்ளது. Prev Return பெட்டியில் இதை உள்ளிடவும்.`,
                userPrevReturn: 0,
                recordedGivenTotal,
            };
        }

        // Compare entered Prev Return vs Recorded Given Amount in Given Moi ledger
        const diff = userPrevReturn - recordedGivenTotal;

        if (recordedGivenTotal > 0 && diff === 0) {
            return {
                status: 'Matched',
                icon: CheckCircle,
                color: '#10B981',
                bg: 'rgba(16,185,129,0.12)',
                border: 'rgba(16,185,129,0.35)',
                label: '✅ சரியான திருப்பம் — Matched',
                note: `உள்ளீடு செய்யப்பட்ட Prev Return (₹${userPrevReturn.toLocaleString('en-IN')}), ஏற்கனவே Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகையுடன் (₹${recordedGivenTotal.toLocaleString('en-IN')}) சரியாகப் பொருந்துகிறது!`,
                diff,
                userPrevReturn,
                recordedGivenTotal,
            };
        } else if (recordedGivenTotal > 0 && diff < 0) {
            return {
                status: 'Short',
                icon: AlertTriangle,
                color: '#F59E0B',
                bg: 'rgba(245,158,11,0.12)',
                border: 'rgba(245,158,11,0.35)',
                label: '⚠️ குறைவான திருப்பம் — Short',
                note: `Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகை ₹${recordedGivenTotal.toLocaleString('en-IN')}. ஆனால் Prev Return-ல் ₹${userPrevReturn.toLocaleString('en-IN')} மட்டுமே உள்ளது. (குறைபாடு: ₹${Math.abs(diff).toLocaleString('en-IN')}).`,
                diff,
                userPrevReturn,
                recordedGivenTotal,
            };
        } else if (recordedGivenTotal > 0 && diff > 0) {
            return {
                status: 'Excess',
                icon: AlertCircle,
                color: '#F43F5E',
                bg: 'rgba(244,63,94,0.12)',
                border: 'rgba(244,63,94,0.35)',
                label: '🔺 அதிக திருப்பம் — Excess',
                note: `Record Given Gift-ல் பதிவு செய்யப்பட்ட தொகை ₹${recordedGivenTotal.toLocaleString('en-IN')}. ஆனால் Prev Return-ல் ₹${userPrevReturn.toLocaleString('en-IN')} உள்ளது. (அதிகம்: ₹${diff.toLocaleString('en-IN')}).`,
                diff,
                userPrevReturn,
                recordedGivenTotal,
            };
        } else {
            return {
                status: 'NoPreviousRecord',
                icon: HelpCircle,
                color: '#9CA3AF',
                bg: 'rgba(156,163,175,0.1)',
                border: 'rgba(156,163,175,0.25)',
                label: '❓ Record Given Gift-ல் பதிவு இல்லை',
                note: `Record Given Gift ஏட்டில் '${name.trim()}' நபருக்கு முன்பதிவு எதுவும் இல்லை. உள்ளிடப்பட்ட Prev Return: ₹${userPrevReturn.toLocaleString('en-IN')}.`,
                diff: 0,
                userPrevReturn,
                recordedGivenTotal: 0,
            };
        }
    }, [returnAmount, name, village, givenEntries]);

    // Whether to SHOW the conflict result banner
    const showConflict = !editingTx && conflictResult && (
        conflictMode === 'auto' || manualChecked
    );

    if (!isOpen) return null;

    const QUICK_AMOUNTS = [101, 501, 1001, 2001, 5001, 10001];
    const GIFT_TERMS    = ['1st Time', '2nd Time', '3rd Time', '4th Time', '5th Time'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !amount) return;

        setLoading(true);
        setError('');
        try {
            const numericAmount       = parseFloat(amount);
            const numericReturnAmount = returnAmount ? parseFloat(returnAmount) : null;
            const data = {
                eventId,
                contributorName: name.trim(),
                village: village.trim(),
                amount: numericAmount,
                giftTerm: giftTerm.trim() || '1st Time',
                returnAmount: numericReturnAmount,
            };

            const savedEntry = await onSave(data, editingTx?.transactionId);

            // Auto mode + conflict exists + autoSave enabled → save conflict record to DB
            if (conflictMode === 'auto' && !editingTx && conflictResult && conflictAutoSave) {
                try {
                    await api.checkAndSaveConflict(
                        name.trim(),
                        village.trim(),
                        numericAmount,
                        numericReturnAmount || 0,
                        eventId || null,
                        savedEntry?.transactionId || savedEntry?.id || null
                    );
                } catch (conflictErr) {
                    console.warn('Conflict save failed (non-blocking):', conflictErr);
                }
            }

            if (!editingTx && numericAmount >= 1000) {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }

            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="hyper-modal-card wide-modal spring-popup purple-glow">

                {/* Header */}
                <div className="hyper-header purple-theme">
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple">
                            <Sparkles size={24} className="sparkle-active" />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil">பண மொய் சேர்க்கை</span>
                            <h3>{editingTx ? 'Edit Cash Gift' : 'Record Cash Gift'}</h3>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Conflict mode badge */}
                        {!editingTx && (
                            <div
                                title="Conflict check mode — change in Settings page"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    background: conflictMode === 'auto'
                                        ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.12)',
                                    border: `1px solid ${conflictMode === 'auto'
                                        ? 'rgba(139,92,246,0.35)' : 'rgba(245,158,11,0.3)'}`,
                                    padding: '0.25rem 0.6rem', borderRadius: '8px',
                                }}
                            >
                                <Settings size={11} style={{ color: '#9CA3AF' }} />
                                <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Conflict:</span>
                                <span style={{
                                    fontSize: '0.72rem', fontWeight: 800,
                                    color: conflictMode === 'auto' ? '#A78BFA' : '#FBBF24',
                                }}>
                                    {conflictMode === 'auto' ? '⚡ Auto' : '🖱 Manual'}
                                </span>
                            </div>
                        )}
                        <button className="hyper-close-btn" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="hyper-body">
                    {error && <div className="hyper-alert alert-danger">{error}</div>}

                    {/* Row 1: Village & Name */}
                    <div className="hyper-row-2">
                        <div className="hyper-field">
                            <label className="field-label">Village / Location (ஊர்)</label>
                            <TransliteratedInput
                                value={village}
                                onChange={(v) => { setVillage(v); setManualChecked(false); }}
                                placeholder="Type village (e.g. Madurai)..."
                                className="hyper-input"
                            />
                        </div>
                        <div className="hyper-field">
                            <label className="field-label">
                                Contributor Name (பெயர்) <span className="req">*</span>
                            </label>
                            <TransliteratedInput
                                value={name}
                                onChange={(v) => { setName(v); setManualChecked(false); }}
                                placeholder="Type in English (e.g. Ramesh)..."
                                className="hyper-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Prev Return & Current Gift Amount */}
                    <div className="hyper-row-2">
                        {/* Prev Return */}
                        <div className="hyper-field">
                            <label className="field-label" title="Prev Return (அவர்கள் திரும்பிச் செய்தது ₹)">
                                <History size={13} className="text-gold" />
                                <span>Prev Return (அவர்கள் திரும்பிச் செய்தது ₹)</span>
                            </label>
                            <div className="input-with-symbol">
                                <span className="symbol-badge text-gold">₹</span>
                                <input
                                    type="number" step="0.01" min="0"
                                    className="hyper-input with-indent"
                                    value={returnAmount}
                                    onChange={(e) => { setReturnAmount(e.target.value); setManualChecked(false); }}
                                    placeholder="முந்தைய மொய்..."
                                />
                            </div>
                        </div>

                        {/* Current Gift Amount */}
                        <div className="hyper-field">
                            <label className="field-label" title="Gift Amount (இப்போ வந்த மொய் ₹)">
                                <span>Gift Amount (இப்போ வந்த மொய் ₹)</span> <span className="req">*</span>
                            </label>
                            <div className="input-with-symbol">
                                <span className="symbol-badge">₹</span>
                                <input
                                    type="number" step="0.01" min="1"
                                    className="hyper-input with-indent"
                                    value={amount}
                                    onChange={(e) => { setAmount(e.target.value); setManualChecked(false); }}
                                    placeholder="Enter cash amount..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gift Term */}
                    <div className="hyper-field">
                        <label className="field-label flex-align">
                            <Repeat size={13} className="text-purple" /> Gift Term (முறை / Frequency)
                        </label>
                        <div className="preset-chips-flex mb-1">
                            {GIFT_TERMS.map((term) => (
                                <button key={term} type="button"
                                    className={`gold-chip-pill ${giftTerm === term ? 'selected-purple' : ''}`}
                                    onClick={() => setGiftTerm(term)}>
                                    {term}
                                </button>
                            ))}
                        </div>
                        <input type="text" className="hyper-input" value={giftTerm}
                            onChange={(e) => setGiftTerm(e.target.value)}
                            placeholder="Or type custom term..." />
                    </div>



                    {/* ── MANUAL MODE: Check Button ──────────────────────────────────── */}
                    {conflictMode === 'manual' && !editingTx && (
                        <button
                            type="button"
                            disabled={!returnAmount || Number(returnAmount) <= 0 || !name.trim()}
                            onClick={() => setManualChecked(true)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '0.6rem',
                                padding: '0.8rem 1.25rem', borderRadius: '12px',
                                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                opacity: (!returnAmount || !name.trim()) ? 0.5 : 1,
                                border: `2px solid ${manualChecked && conflictResult ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}`,
                                background: manualChecked && conflictResult
                                    ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.12))'
                                    : 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))',
                                color: manualChecked && conflictResult ? '#34D399' : '#FBBF24',
                                transition: 'all 0.25s',
                            }}
                        >
                            {manualChecked && conflictResult ? <CheckCircle size={17} /> : <Zap size={17} />}
                            {manualChecked && conflictResult
                                ? '✅ Conflict Checked — Click to re-check'
                                : '⚡ Check Conflict — முரண்பாடு சோதனை பண்ணு'}
                        </button>
                    )}

                    {/* ── CONFLICT RESULT BANNER ─────────────────────────────────────── */}
                    {showConflict && (
                        <div style={{
                            background: conflictResult.bg,
                            border: `1px solid ${conflictResult.border}`,
                            borderRadius: '12px', padding: '0.85rem 1rem',
                            display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <conflictResult.icon size={18} style={{ color: conflictResult.color, flexShrink: 0 }} />
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: conflictResult.color }}>
                                    {conflictResult.label}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#D1D5DB', lineHeight: 1.55, margin: 0 }}>
                                {conflictResult.note}
                            </p>
                            {/* Visual comparison row */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    Prev Return (உள்ளீடு):
                                    <strong style={{ color: '#A78BFA' }}> ₹{Number(returnAmount || 0).toLocaleString('en-IN')}</strong>
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    Given Gift Ledger (ஏட்டில் உள்ளது):
                                    <strong style={{ color: '#FBBF24' }}> ₹{Number(conflictResult.recordedGivenTotal || 0).toLocaleString('en-IN')}</strong>
                                </span>
                                {conflictResult.recordedGivenTotal > 0 && (
                                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                        வித்தியாசம் (Diff):
                                        <strong style={{ color: conflictResult.color }}>
                                            {' '}{conflictResult.diff >= 0 ? '+' : ''}₹{Math.abs(conflictResult.diff).toLocaleString('en-IN')}
                                        </strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hint when Prev Return is empty (auto mode only) */}
                    {conflictMode === 'auto' && !editingTx && !returnAmount && (
                        <div style={{
                            background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)',
                            borderRadius: '10px', padding: '0.55rem 0.85rem',
                            display: 'flex', alignItems: 'center', gap: '0.45rem',
                            fontSize: '0.75rem', color: '#7C6FAF',
                        }}>
                            <Zap size={13} />
                            <span>
                                <strong>Conflict Check:</strong> "Prev Return" field enter பண்ணா, current amount-உடன் compare பண்ணி result காட்டும்.
                            </span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="hyper-footer">
                        <button type="button" className="hyper-btn btn-ghost-dark" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="hyper-btn btn-purple-neon" disabled={loading}>
                            {loading
                                ? 'Saving...'
                                : editingTx
                                    ? <><Check size={18} /> Update Gift</>
                                    : <><Plus size={18} /> Record Gift</>}
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
