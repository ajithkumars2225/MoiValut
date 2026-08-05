import React from 'react';
import { Calendar, Plus, Sparkles } from 'lucide-react';

export const TopHeader = ({
    events,
    activeEvent,
    onSelectEvent,
    onOpenCreateEvent,
    activeView,
    currentUser,
    isOnline = true,
}) => {
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Overview of cash collections, gold gifts, and contributors.' },
        moi: { title: 'Moi Cash Entry (பண மொய் பதிவு)', subtitle: 'Record traditional cash contributions with live Tamil transliteration.' },
        given_moi: { title: 'Given Moi Entry (செய்த மொய்)', subtitle: 'Record and track the gifts given to others.' },
        conflicts: { title: 'Conflict Records (மொய் முரண்பாடுகள்)', subtitle: 'Audit ledger entry discrepancies and check returns.' },
        gold: { title: 'Gold Entry (பொன்/நகை சேர்க்கை)', subtitle: 'Record traditional gold gifts, chains, coins, and ornaments.' },
        reports: { title: 'Audit Log (தணிக்கை அறிக்கை)', subtitle: 'Export official reports and audit system event history logs.' },
        events: { title: 'Event Details & Management', subtitle: 'Manage all events, dates, and locations.' },
        settings: { title: 'Settings (அமைப்புகள்)', subtitle: 'Configure regional preferences and defaults.' },
        users: { title: 'User Management (பயனர் மேலாண்மை)', subtitle: 'Manage application users and roles.' },
    };

    const currentMeta = titles[activeView] || { title: 'MoiVault', subtitle: 'Moi Collection Manager' };

    // Privilege check for event creation
    const canCreateEvent = !currentUser || currentUser.role === 'admin' || currentUser.privileges?.events?.add === true;

    return (
        <header className="top-header-container">
            <div className="header-title-area">
                <h2>{currentMeta.title}</h2>
                <p className="subtitle">{currentMeta.subtitle}</p>
            </div>

            <div className="header-actions">
                {/* Connection Status Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: isOnline ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.3)',
                    background: isOnline ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                    color: isOnline ? '#10B981' : '#F59E0B',
                    transition: 'all 0.3s ease',
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isOnline ? '#10B981' : '#F59E0B',
                        display: 'inline-block',
                        boxShadow: isOnline ? '0 0 8px #10B981' : '0 0 8px #F59E0B',
                        animation: !isOnline ? 'pulse 1.5s infinite alternate' : 'none',
                    }} />
                    <span>{isOnline ? 'Online (இணைப்பில்)' : 'Offline (ஆஃப்லைன்)'}</span>
                </div>

                <div className="event-selector-wrap">
                    <Calendar size={16} className="selector-icon" />
                    <select
                        className="event-select"
                        value={activeEvent?.id || ''}
                        onChange={(e) => {
                            const found = events.find((evt) => evt.id === Number(e.target.value));
                            if (found) onSelectEvent(found);
                        }}
                    >
                        <option value="" disabled>Select Event...</option>
                        {events.map((evt) => (
                            <option key={evt.id} value={evt.id}>
                                {evt.name} ({evt.eventDate || 'No Date'})
                            </option>
                        ))}
                    </select>
                </div>

                {canCreateEvent && (
                    <button className="modern-btn btn-new-event-neon" onClick={onOpenCreateEvent}>
                        <Plus size={16} />
                        <span>New Event</span>
                    </button>
                )}
            </div>
        </header>
    );
};
