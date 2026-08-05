import React from 'react';
import { Printer, X } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, data, event, givenEntries = [] }) => {
    if (!isOpen || !data) return null;

    const isCash = data.amount !== undefined && data.goldDetails === undefined;
    const eventName = event?.name || 'மொய் விழா';
    const eventDate = event?.eventDate
        ? new Date(event.eventDate).toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : '-';
    const eventVenue = event?.location || '-';

    const recordedDate = new Date(data.transactionDate || data.entryDate).toLocaleString('ta-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    // Find all "given moi" entries for this contributor (namma podha moi)
    const contributorName = (data.contributorName || '').toLowerCase().trim();
    const matchedGivenEntries = givenEntries.filter(
        (g) => (g.recipientName || '').toLowerCase().trim() === contributorName
    );
    const totalGivenByUs = matchedGivenEntries.reduce((sum, g) => sum + Number(g.amount || 0), 0);

    // What they returned (from the moi record itself)
    const returnedByThem = data.returnAmount ? Number(data.returnAmount) : 0;

    // Balance: what we gave minus what they returned
    const balanceAmount = totalGivenByUs - returnedByThem;

    const hasReference = isCash && (totalGivenByUs > 0 || returnedByThem > 0);

    const handlePrint = () => window.print();

    return (
        <>
            <style>{`
                @media print {
                    body > *:not(.print-receipt-root) { display: none !important; }
                    .no-print { display: none !important; }
                    .print-receipt-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
                    .receipt-card { box-shadow: none !important; border: 2px solid #333 !important; width: 80mm !important; margin: 0 auto; }
                }
            `}</style>

            <div className="hyper-backdrop print-receipt-root" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="hyper-modal-card spring-popup receipt-modal-wrap" style={{ maxWidth: '480px', width: '100%', padding: 0, overflow: 'hidden', borderRadius: '20px' }}>

                    {/* Modal Header */}
                    <div className="hyper-header no-print" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>🧾</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#E2E8F0' }}>மொய் ரசீது / Gift Receipt</h3>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8' }}>அச்சிடத்தக்க அதிகாரப்பூர்வ ரசீது</p>
                            </div>
                        </div>
                        <button className="hyper-close-btn" onClick={onClose}><X size={18} /></button>
                    </div>

                    {/* ══════════ PRINTABLE RECEIPT CARD ══════════ */}
                    <div className="receipt-card" style={{
                        background: '#fff', color: '#1a1a1a',
                        fontFamily: "'Noto Sans Tamil', 'Latha', serif",
                        margin: '1.2rem', borderRadius: '12px',
                        border: '1.5px solid #d4af37', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}>
                        {/* Top Gold Banner */}
                        <div style={{ background: 'linear-gradient(135deg, #d4af37, #f5c842, #c8972f)', textAlign: 'center', padding: '0.7rem 1rem 0.5rem' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>🏛️</div>
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '0.03em' }}>மொய் பதிவு ரசீது</div>
                            <div style={{ fontSize: '0.72rem', color: '#4a3000', fontWeight: 600 }}>MOI GIFT RECEIPT — MoiVault</div>
                        </div>

                        {/* Event Section */}
                        <div style={{ background: '#fffbf0', borderBottom: '1px dashed #d4af37', padding: '0.75rem 1.2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ color: '#666', paddingBottom: '0.35rem', width: '44%', fontWeight: 600 }}>விழா பெயர் / Event:</td>
                                        <td style={{ fontWeight: 800, color: '#1a1a1a', paddingBottom: '0.35rem' }}>{eventName}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', paddingBottom: '0.35rem', fontWeight: 600 }}>தேதி / Date:</td>
                                        <td style={{ fontWeight: 700, color: '#1a1a1a', paddingBottom: '0.35rem' }}>{eventDate}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', fontWeight: 600 }}>இடம் / Venue:</td>
                                        <td style={{ fontWeight: 700, color: '#1a1a1a' }}>{eventVenue}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Contributor Section */}
                        <div style={{ background: '#fff', borderBottom: '1px dashed #d4af37', padding: '0.75rem 1.2rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>
                                மொய் வழங்கியவர் விவரம் / Contributor Details
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ color: '#666', paddingBottom: '0.35rem', width: '44%', fontWeight: 600 }}>பெயர் / Name:</td>
                                        <td style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a1a1a', paddingBottom: '0.35rem' }}>{data.contributorName}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', paddingBottom: '0.35rem', fontWeight: 600 }}>ஊர் / Village:</td>
                                        <td style={{ fontWeight: 700, color: '#1a1a1a', paddingBottom: '0.35rem' }}>{data.village || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', fontWeight: 600 }}>வகை / Type:</td>
                                        <td style={{ fontWeight: 700, color: isCash ? '#059669' : '#d4af37' }}>
                                            {isCash ? '💵 பண மொய் (Cash Gift)' : '🏅 பொன் மொய் (Gold Gift)'}
                                        </td>
                                    </tr>
                                    {data.giftTerm && (
                                        <tr>
                                            <td style={{ color: '#666', paddingTop: '0.35rem', fontWeight: 600 }}>முறை / Term:</td>
                                            <td style={{ fontWeight: 700, color: '#1a1a1a', paddingTop: '0.35rem' }}>{data.giftTerm}</td>
                                        </tr>
                                    )}
                                    {isCash && returnedByThem > 0 && (
                                        <tr>
                                            <td style={{ color: '#666', paddingTop: '0.35rem', fontWeight: 600 }}>திரும்ப செய்தது:</td>
                                            <td style={{ fontWeight: 700, color: '#059669', paddingTop: '0.35rem' }}>₹ {returnedByThem.toLocaleString('en-IN')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Amount Hero Box */}
                        <div style={{
                            background: isCash ? 'linear-gradient(135deg, #064e3b, #065f46)' : 'linear-gradient(135deg, #78350f, #92400e)',
                            padding: '0.9rem 1.2rem', textAlign: 'center', borderBottom: '1px dashed #d4af37',
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem', fontWeight: 600 }}>
                                {isCash ? 'இன்று கொடுத்த மொய் தொகை / Amount Given Today' : 'நகை விவரம் / Gold Details'}
                            </div>
                            <div style={{ fontSize: isCash ? '2rem' : '1.1rem', fontWeight: 900, color: '#FFD700', textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: '0.04em' }}>
                                {isCash ? `₹ ${Number(data.amount).toLocaleString('en-IN')}` : data.goldDetails}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ background: '#fffbf0', padding: '0.55rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#888' }}>
                            <span>பதிவு நேரம்: {recordedDate}</span>
                            <span style={{ fontWeight: 700, color: '#d4af37' }}>✔ MoiVault</span>
                        </div>
                    </div>
                    {/* ══════════ END RECEIPT CARD ══════════ */}

                    {/* Footer Buttons */}
                    <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', padding: '0 1.2rem 1.2rem' }}>
                        <button className="hyper-btn btn-ghost-dark" onClick={onClose}>மூடு / Close</button>
                        <button
                            onClick={handlePrint}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.4rem', borderRadius: '10px',
                                background: 'linear-gradient(135deg,#d4af37,#f5c842)',
                                color: '#1a1a1a', fontWeight: 800, fontSize: '0.88rem',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
                            }}
                        >
                            <Printer size={16} /> அச்சிடு / Print
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
