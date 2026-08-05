import React, { useState, useMemo, useRef } from 'react';
import {
    Calendar,
    MapPin,
    Trash2,
    Edit2,
    CheckCircle2,
    Plus,
    Image as ImageIcon,
    Eye,
    X,
    Upload,
    IndianRupee,
    Coins,
    Gift,
    Sparkles,
    Search,
    Download,
    Printer,
    Check,
} from 'lucide-react';

export const EventsView = ({
    events = [],
    activeEvent,
    transactions = [],
    givenEntries = [],
    goldEntries = [],
    onSelectEvent,
    onOpenCreateEvent,
    onOpenEditEvent,
    onDeleteEvent,
    privileges,
}) => {
    const [viewingImage, setViewingImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const canAdd    = !privileges || privileges.add === true;
    const canEdit   = !privileges || privileges.edit === true;
    const canDelete = !privileges || privileges.delete === true;
    const [targetEventForUpload, setTargetEventForUpload] = useState(null);

    // Filter events by search
    const filteredEvents = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return events;
        return events.filter((e) =>
            e.name?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            e.eventDate?.toLowerCase().includes(q)
        );
    }, [events, searchQuery]);

    // Compute stats per event
    const getEventStats = (eventId) => {
        const evtTx = transactions.filter((t) => t.eventId === eventId);
        const evtGiven = givenEntries.filter((g) => g.eventId === eventId);
        const evtGold = goldEntries.filter((ge) => ge.eventId === eventId);

        const totalCash = evtTx.reduce((sum, t) => sum + Number(t.amount || 0) + Number(t.returnAmount || 0), 0);
        const totalGiven = evtGiven.reduce((sum, g) => sum + Number(g.amount || 0), 0);
        const totalGoldCount = evtGold.length;
        const totalGuests = evtTx.length;

        return { totalCash, totalGiven, totalGoldCount, totalGuests };
    };

    // Quick Invitation Upload trigger
    const handleTriggerUpload = (evt) => {
        setTargetEventForUpload(evt);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !targetEventForUpload) return;

        if (file.size > 5 * 1024 * 1024) {
            window.customAlert('Image file size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const updatedData = {
                name: targetEventForUpload.name,
                eventDate: targetEventForUpload.eventDate,
                location: targetEventForUpload.location,
                invitationImage: reader.result,
            };
            onOpenEditEvent(targetEventForUpload, updatedData);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="view-content fade-in">
            {/* Hidden File Input for Direct Card Upload */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* Header & Action Toolbar */}
            <div className="full-width-card glass-card compact-list-header mb-4">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-purple-sm"><Sparkles size={16} /></div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">Event Details & Management (நிகழ்வுகள் மேலாண்மை)</h2>
                            <span className="collection-pill-sm">
                                {events.length} Events Total • Click any event card box to switch active functions
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        <div className="search-box-sm">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                className="search-input-sm"
                                placeholder="Search events by name, location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {canAdd && (
                            <button className="modern-btn btn-gradient-purple shadow-btn" onClick={onOpenCreateEvent}>
                                <Plus size={16} /> + New Event (புதிய விசேஷம்)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 📦 EVENT BOX CARDS GRID (அழைப்பிதழ் படத்துடன் கூடிய பெட்டி வடிவம்) 📦 */}
            <div className="events-box-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '1.4rem'
            }}>
                {filteredEvents.length === 0 ? (
                    <div className="full-width-card glass-card text-center py-10" style={{ gridColumn: '1 / -1' }}>
                        <Calendar size={36} className="text-purple mb-2" />
                        <h3 style={{ color: '#FFF' }}>No Events Found</h3>
                        <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
                            Click <strong>+ New Event</strong> above to add your first function collection!
                        </p>
                    </div>
                ) : (
                    filteredEvents.map((evt) => {
                        const isActive = activeEvent?.id === evt.id;
                        const stats = getEventStats(evt.id);

                        return (
                            <div
                                key={evt.id}
                                className={`event-box-card glass-card ${isActive ? 'active-event-box' : ''}`}
                                style={{
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    border: isActive ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: isActive ? '0 0 35px rgba(139,92,246,0.35)' : '0 8px 25px rgba(0,0,0,0.3)',
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* 🖼️ INVITATION IMAGE BANNER (அழைப்பிதழ் காட்சிப் பகுதி) */}
                                <div style={{
                                    height: '210px',
                                    width: '100%',
                                    position: 'relative',
                                    background: 'linear-gradient(135deg, rgba(30,27,75,0.9), rgba(15,23,42,0.95))',
                                    overflow: 'hidden',
                                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    {evt.invitationImage ? (
                                        <>
                                            <img
                                                src={evt.invitationImage}
                                                alt={evt.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.5s ease',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => setViewingImage(evt)}
                                            />
                                            {/* Image Hover Overlay Tag */}
                                            <div
                                                style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                                                    padding: '0.85rem 1rem', cursor: 'pointer'
                                                }}
                                                onClick={() => setViewingImage(evt)}
                                            >
                                                <span style={{
                                                    background: 'rgba(0,0,0,0.65)', color: '#A78BFA',
                                                    backdropFilter: 'blur(8px)', border: '1px solid rgba(139,92,246,0.4)',
                                                    padding: '0.25rem 0.65rem', borderRadius: '8px',
                                                    fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem'
                                                }}>
                                                    <ImageIcon size={13} /> Invitation Card Attached
                                                </span>

                                                <button
                                                    type="button"
                                                    style={{
                                                        background: '#8B5CF6', color: '#FFF', border: 'none',
                                                        padding: '0.3rem 0.75rem', borderRadius: '8px',
                                                        fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                        boxShadow: '0 4px 14px rgba(139,92,246,0.5)'
                                                    }}
                                                    onClick={(e) => { e.stopPropagation(); setViewingImage(evt); }}
                                                >
                                                    <Eye size={13} /> View Invitation
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* Default Luxury Tamil Invitation Banner Mockup */
                                        <div style={{
                                            height: '100%', width: '100%',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            padding: '1.25rem', textAlign: 'center',
                                            background: 'radial-gradient(circle at center, rgba(139,92,246,0.2) 0%, rgba(15,23,42,0.9) 100%)',
                                            border: '1px dashed rgba(245,158,11,0.3)',
                                            borderRadius: '16px', margin: '0.5rem', width: 'calc(100% - 1rem)'
                                        }}>
                                            <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>🌺 🪔 🌺</div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#FBBF24', fontWeight: 700 }}>
                                                அழைப்பிதழ் / INVITATION CARD
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', margin: '0.3rem 0' }}>
                                                {evt.name}
                                            </div>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        background: 'rgba(245,158,11,0.15)', color: '#FBBF24',
                                                        border: '1px solid rgba(245,158,11,0.4)',
                                                        padding: '0.35rem 0.85rem', borderRadius: '8px',
                                                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => handleTriggerUpload(evt)}
                                                >
                                                    <Upload size={13} /> Upload Invitation Image (பத்திரிகை பதிவேற்று)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 📝 CARD BODY DETAILS */}
                                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>

                                    {/* Active Status Badge & Title */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.3 }}>
                                                {evt.name}
                                            </h3>
                                        </div>
                                        {isActive ? (
                                            <span style={{
                                                background: 'rgba(16,185,129,0.18)', color: '#34D399',
                                                border: '1px solid rgba(16,185,129,0.4)',
                                                padding: '0.25rem 0.65rem', borderRadius: '8px',
                                                fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                boxShadow: '0 0 12px rgba(16,185,129,0.3)'
                                            }}>
                                                <CheckCircle2 size={13} /> Active (தற்போது)
                                            </span>
                                        ) : (
                                            <span style={{
                                                background: 'rgba(255,255,255,0.06)', color: '#9CA3AF',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.25rem 0.6rem', borderRadius: '8px',
                                                fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap'
                                            }}>
                                                Available
                                            </span>
                                        )}
                                    </div>

                                    {/* Date & Venue Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: '#D1D5DB' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <Calendar size={14} style={{ color: '#A78BFA', flexShrink: 0 }} />
                                            <span>
                                                {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('en-IN', {
                                                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                                }) : 'Date Not Set'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <MapPin size={14} style={{ color: '#FBBF24', flexShrink: 0 }} />
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {evt.location || 'Venue Not Set'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 📊 MINI STATS GRID (3 SUMMARY BOXES) */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
                                        marginTop: '0.3rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        {/* Cash Received */}
                                        <div style={{
                                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: '10px', padding: '0.5rem', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 2 }}>வந்த பணம்</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34D399' }}>
                                                ₹{stats.totalCash.toLocaleString('en-IN')}
                                            </div>
                                        </div>

                                        {/* Given Moi */}
                                        <div style={{
                                            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                                            borderRadius: '10px', padding: '0.5rem', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 2 }}>செய்த மொய்</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#A78BFA' }}>
                                                ₹{stats.totalGiven.toLocaleString('en-IN')}
                                            </div>
                                        </div>

                                        {/* Gold Gifts */}
                                        <div style={{
                                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                                            borderRadius: '10px', padding: '0.5rem', textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: 2 }}>பொன் வரவு</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FBBF24' }}>
                                                {stats.totalGoldCount} items
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ⚙️ CARD FOOTER ACTIONS BAR */}
                                <div style={{
                                    padding: '0.85rem 1.2rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderTop: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
                                }}>
                                    {isActive ? (
                                        <span style={{
                                            fontSize: '0.78rem', color: '#34D399', fontWeight: 800,
                                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                                        }}>
                                            <Check size={15} /> Currently Active
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="modern-btn btn-gradient-purple"
                                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
                                            onClick={() => onSelectEvent(evt)}
                                        >
                                            Select Event (தேர்ந்தெடு)
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {canEdit && (
                                            <button
                                                className="action-btn-sm view-btn"
                                                title="Upload / Change Invitation Image"
                                                onClick={() => handleTriggerUpload(evt)}
                                                style={{
                                                    background: 'rgba(245,158,11,0.18)', color: '#FBBF24',
                                                    border: '1px solid rgba(245,158,11,0.3)', padding: '0.35rem 0.5rem',
                                                    borderRadius: 7, cursor: 'pointer'
                                                }}
                                            >
                                                <Upload size={13} />
                                            </button>
                                        )}

                                        {canEdit && (
                                            <button
                                                className="action-btn-sm edit-btn"
                                                title="Edit Event Details"
                                                onClick={() => onOpenEditEvent(evt)}
                                                style={{
                                                    background: 'rgba(139,92,246,0.18)', color: '#A78BFA',
                                                    border: '1px solid rgba(139,92,246,0.3)', padding: '0.35rem 0.5rem',
                                                    borderRadius: 7, cursor: 'pointer'
                                                }}
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                className="action-btn-sm delete-btn"
                                                title="Delete Event"
                                                onClick={() => onDeleteEvent(evt.id)}
                                                style={{
                                                    background: 'rgba(244,63,94,0.15)', color: '#FB7185',
                                                    border: '1px solid rgba(244,63,94,0.3)', padding: '0.35rem 0.5rem',
                                                    borderRadius: 7, cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 🖼️ INVITATION IMAGE HIGH-RES LIGHTBOX MODAL 🖼️ */}
            {viewingImage && (
                <div className="hyper-backdrop" onClick={() => setViewingImage(null)}>
                    <div className="hyper-modal-card spring-popup purple-glow" style={{ maxWidth: '680px', width: '92%' }}>
                        <div className="hyper-header purple-theme" style={{ padding: '1rem 1.3rem' }}>
                            <div className="hyper-title-group">
                                <div className="hyper-icon-box glow-purple" style={{ width: 38, height: 38 }}>
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <span className="hyper-tag">INVITATION CARD LIGHTBOX (அழைப்பிதழ் காட்சி)</span>
                                    <h3 style={{ fontSize: '1.15rem', color: '#FFF' }}>{viewingImage.name}</h3>
                                </div>
                            </div>
                            <button className="hyper-close-btn" onClick={() => setViewingImage(null)} style={{ width: 32, height: 32 }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="hyper-body flex-center" style={{ padding: '1.25rem', background: '#090D16' }}>
                            <img
                                src={viewingImage.invitationImage}
                                alt={viewingImage.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    borderRadius: '16px',
                                    objectFit: 'contain',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}
                            />
                        </div>

                        <div className="hyper-footer" style={{ padding: '0.85rem 1.3rem', justifyContent: 'space-between' }}>
                            <button
                                type="button"
                                className="hyper-btn btn-ghost-dark"
                                onClick={() => handleTriggerUpload(viewingImage)}
                                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                            >
                                <Upload size={14} /> Change Invitation Image
                            </button>

                            <button
                                type="button"
                                className="hyper-btn btn-purple-neon"
                                onClick={() => setViewingImage(null)}
                                style={{ fontSize: '0.8rem', padding: '0.45rem 1.25rem' }}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
