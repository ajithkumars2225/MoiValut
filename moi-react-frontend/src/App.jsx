import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { CustomPopup } from './components/CustomPopup';
import { EventModal } from './components/modals/EventModal';
import { DashboardView } from './views/DashboardView';
import { MoiEntryView } from './views/MoiEntryView';
import { GivenMoiEntryView } from './views/GivenMoiEntryView';
import { GoldEntryView } from './views/GoldEntryView';
import { ReportsView } from './views/ReportsView';
import { EventsView } from './views/EventsView';
import { LoginView } from './views/LoginView';
import { ConflictRecordsView } from './views/ConflictRecordsView';
import { SettingsView } from './views/SettingsView';
import { UserManagementView } from './views/UserManagementView';
import { useUserSettings } from './hooks/useUserSettings';
import { recordAuditLog } from './services/auditLogger';
import { getCurrentUser, clearCurrentUser } from './services/userManager';

export function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        sessionStorage.getItem('isLoggedIn') === 'true'
    );
    const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

    // User-based persistent settings
    const [settings, updateSettings, resetSettings] = useUserSettings();

    const [events, setEvents] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);

    const getDefaultViewForUser = (user) => {
        if (!user) return 'dashboard';
        if (user.role === 'admin') return 'dashboard';
        const order = ['dashboard', 'events', 'moi', 'given_moi', 'conflicts', 'gold', 'reports', 'settings'];
        const first = order.find(v => user.privileges?.[v]?.view);
        return first || 'dashboard';
    };

    const [activeView, setActiveView] = useState(() => {
        const user = getCurrentUser();
        return getDefaultViewForUser(user);
    });
    const [isDarkMode, setIsDarkMode] = useState(() => settings.isDarkMode ?? true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => settings.sidebarCollapsed ?? false);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [transactions, setTransactions] = useState([]);
    const [givenEntries, setGivenEntries] = useState([]);
    const [goldEntries, setGoldEntries] = useState([]);
    const [conflictRecords, setConflictRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [customModal, setCustomModal] = useState({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        resolve: null
    });

    useEffect(() => {
        window.customConfirm = (message, title = 'Confirm Action (உறுதிப்படுத்தல்)') => {
            return new Promise((resolve) => {
                const event = new CustomEvent('show-custom-confirm', {
                    detail: { message, title, resolve }
                });
                window.dispatchEvent(event);
            });
        };

        window.customAlert = (message, title = 'Notification (அறிவிப்பு)') => {
            return new Promise((resolve) => {
                const event = new CustomEvent('show-custom-alert', {
                    detail: { message, title, resolve }
                });
                window.dispatchEvent(event);
            });
        };

        const handleConfirmEvent = (e) => {
            setCustomModal({
                isOpen: true,
                type: 'confirm',
                title: e.detail.title,
                message: e.detail.message,
                resolve: e.detail.resolve
            });
        };

        const handleAlertEvent = (e) => {
            setCustomModal({
                isOpen: true,
                type: 'alert',
                title: e.detail.title,
                message: e.detail.message,
                resolve: e.detail.resolve
            });
        };

        window.addEventListener('show-custom-confirm', handleConfirmEvent);
        window.addEventListener('show-custom-alert', handleAlertEvent);

        return () => {
            window.removeEventListener('show-custom-confirm', handleConfirmEvent);
            window.removeEventListener('show-custom-alert', handleAlertEvent);
        };
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            api.syncOfflineData().then(() => {
                loadEvents();
                if (activeEvent) {
                    loadEventData(activeEvent.id);
                }
            });
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (navigator.onLine) {
            api.syncOfflineData();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [activeEvent]);

    // Sync theme changes from settings
    useEffect(() => {
        if (settings.isDarkMode !== undefined) {
            setIsDarkMode(settings.isDarkMode);
        }
    }, [settings.isDarkMode]);

    useEffect(() => {
        if (isLoggedIn && currentUser) {
            const hasViewPriv = currentUser.role === 'admin' || currentUser.privileges?.[activeView]?.view;
            if (!hasViewPriv && activeView !== 'users') {
                setActiveView(getDefaultViewForUser(currentUser));
            }
        }
    }, [isLoggedIn, currentUser, activeView]);

    useEffect(() => {
        if (settings.sidebarCollapsed !== undefined) {
            setIsSidebarCollapsed(settings.sidebarCollapsed);
        }
    }, [settings.sidebarCollapsed]);

    useEffect(() => {
        if (isLoggedIn) {
            loadEvents();
            loadAllConflicts();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (activeEvent && isLoggedIn) {
            loadEventData(activeEvent.id);
        } else {
            setTransactions([]);
            setGivenEntries([]);
            setGoldEntries([]);
        }
    }, [activeEvent, isLoggedIn]);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            updateSettings({ sidebarCollapsed: next });
            return next;
        });
    };

    const handleToggleTheme = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            updateSettings({ isDarkMode: next });
            return next;
        });
    };

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await api.getEvents();
            setEvents(data);
            if (data.length > 0 && !activeEvent) {
                setActiveEvent(data[0]);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadEventData = async (eventId) => {
        try {
            const [txList, givenList, goldList] = await Promise.all([
                api.getTransactionsByEvent(eventId),
                api.getGivenMoiByEvent(eventId),
                api.getGoldEntriesByEvent(eventId),
            ]);
            setTransactions(txList);
            setGivenEntries(givenList);
            setGoldEntries(goldList);
        } catch (err) {
            console.error('Error fetching event details:', err);
        }
    };

    const loadAllConflicts = async () => {
        try {
            const data = await api.getAllConflicts();
            setConflictRecords(data);
        } catch (err) {
            console.error('Error fetching conflict records:', err);
        }
    };

    const handleLogout = () => {
        clearCurrentUser();
        setCurrentUser(null);
        setIsLoggedIn(false);
    };

    const handleOpenCreateEvent = () => {
        setEditingEvent(null);
        setIsEventModalOpen(true);
    };

    const handleOpenEditEvent = (evt) => {
        setEditingEvent(evt);
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = async (eventData, eventId) => {
        if (eventId) {
            const oldEvt = events.find((e) => e.id === eventId);
            const updated = await api.updateEvent(eventId, eventData);
            setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
            if (activeEvent?.id === eventId) setActiveEvent(updated);

            recordAuditLog({
                actionType: 'UPDATE',
                module: 'Events',
                recordName: eventData.name,
                village: eventData.location || '-',
                oldValue: oldEvt ? {
                    'நிகழ்ச்சி பெயர் (Event Name)': oldEvt.name,
                    'தேதி (Ceremony Date)': oldEvt.eventDate || '-',
                    'இடம் (Location)': oldEvt.location || '-'
                } : null,
                newValue: {
                    'நிகழ்ச்சி பெயர் (Event Name)': eventData.name,
                    'தேதி (Ceremony Date)': eventData.eventDate || '-',
                    'இடம் (Location)': eventData.location || '-'
                },
                details: `விசேஷம் "${eventData.name}" விவரங்கள் திருத்தப்பட்டன.`,
                eventId: eventId
            });
        } else {
            const newEvent = await api.createEvent(eventData);
            setEvents((prev) => [...prev, newEvent]);
            setActiveEvent(newEvent);

            recordAuditLog({
                actionType: 'CREATE',
                module: 'Events',
                recordName: eventData.name,
                village: eventData.location || '-',
                newValue: {
                    'நிகழ்ச்சி பெயர் (Event Name)': eventData.name,
                    'தேதி (Ceremony Date)': eventData.eventDate || '-',
                    'இடம் (Location)': eventData.location || '-'
                },
                details: `புதிய விசேஷம் "${eventData.name}" உருவாக்கப்பட்டது.`,
                eventId: newEvent.id
            });
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this event and all its entries?');
        if (!confirmed) return;
        try {
            const oldEvt = events.find((e) => e.id === eventId);
            await api.deleteEvent(eventId);
            const updated = events.filter((e) => e.id !== eventId);
            setEvents(updated);
            if (activeEvent?.id === eventId) setActiveEvent(updated[0] || null);

            recordAuditLog({
                actionType: 'DELETE',
                module: 'Events',
                recordName: oldEvt?.name || 'Event',
                village: oldEvt?.location || '-',
                oldValue: oldEvt ? {
                    'நிகழ்ச்சி பெயர் (Event Name)': oldEvt.name,
                    'தேதி (Ceremony Date)': oldEvt.eventDate || '-',
                    'இடம் (Location)': oldEvt.location || '-'
                } : null,
                details: `விசேஷம் "${oldEvt?.name || 'Event'}" நீக்கப்பட்டது.`,
                eventId: eventId
            });
        } catch (err) {
            alert('Failed to delete event: ' + err.message);
        }
    };

    // Received Cash Transactions
    const handleRecordMoi = async (data) => {
        const res = await api.recordMoi(data);
        if (activeEvent) await loadEventData(activeEvent.id);
        await loadAllConflicts();

        recordAuditLog({
            actionType: 'CREATE',
            module: 'Moi Entry',
            recordName: data.contributorName || 'Cash Gift',
            village: data.village || '-',
            newValue: {
                'பெயர் (Name)': data.contributorName,
                'ஊர் (Village)': data.village || '-',
                'தொகை (Amount)': Number(data.amount),
                'முறை (Gift Term)': data.giftTerm || '1st Time',
                'திரும்பிச் செய்தது (Return)': Number(data.returnAmount || 0)
            },
            details: `${data.contributorName} அவர்களுக்கு ₹${Number(data.amount).toLocaleString('en-IN')} வந்த பண மொய் பதிவு செய்யப்பட்டது.`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleUpdateMoi = async (id, data) => {
        const oldTx = transactions.find((t) => (t.id === id || t.transactionId === id));
        const res = await api.updateMoi(id, data);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'UPDATE',
            module: 'Moi Entry',
            recordName: data.contributorName || oldTx?.contributorName || 'Cash Gift',
            village: data.village || oldTx?.village || '-',
            oldValue: oldTx ? {
                'வ.எண் (S.No)': oldTx.serialNumber || oldTx.id || oldTx.transactionId,
                'பெயர் (Name)': oldTx.contributorName,
                'ஊர் (Village)': oldTx.village || '-',
                'தொகை (Amount)': Number(oldTx.amount),
                'முறை (Gift Term)': oldTx.giftTerm || '1st Time',
                'திரும்பிச் செய்தது (Return)': Number(oldTx.returnAmount || 0)
            } : null,
            newValue: {
                'பெயர் (Name)': data.contributorName,
                'ஊர் (Village)': data.village || '-',
                'தொகை (Amount)': Number(data.amount),
                'முறை (Gift Term)': data.giftTerm || '1st Time',
                'திரும்பிச் செய்தது (Return)': Number(data.returnAmount || 0)
            },
            details: `${data.contributorName} அவர்களின் பண மொய் பதிவு திருத்தப்பட்டது (₹${oldTx?.amount || 0} ➔ ₹${data.amount}).`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleDeleteMoi = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this transaction?');
        if (!confirmed) return;
        const oldTx = transactions.find((t) => (t.id === id || t.transactionId === id));
        await api.deleteMoi(id);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'DELETE',
            module: 'Moi Entry',
            recordName: oldTx?.contributorName || 'Cash Gift',
            village: oldTx?.village || '-',
            oldValue: oldTx ? {
                'வ.எண் (S.No)': oldTx.serialNumber || oldTx.id || oldTx.transactionId,
                'பெயர் (Name)': oldTx.contributorName,
                'ஊர் (Village)': oldTx.village || '-',
                'தொகை (Amount)': Number(oldTx.amount),
                'முறை (Gift Term)': oldTx.giftTerm || '1st Time',
                'திரும்பிச் செய்தது (Return)': Number(oldTx.returnAmount || 0)
            } : null,
            details: `${oldTx?.contributorName || 'உறுப்பினர்'} அவர்களின் ₹${oldTx?.amount || 0} பண மொய் பதிவு நீக்கப்பட்டது.`,
            eventId: activeEvent?.id
        });
    };

    // Given Cash Transactions
    const handleRecordGivenMoi = async (data) => {
        const res = await api.recordGivenMoi(data);
        if (activeEvent) await loadEventData(activeEvent.id);
        await loadAllConflicts();

        recordAuditLog({
            actionType: 'CREATE',
            module: 'Given Moi',
            recordName: data.recipientName || 'Given Gift',
            village: data.village || '-',
            newValue: {
                'பெயர் (Name)': data.recipientName,
                'ஊர் (Village)': data.village || '-',
                'தொகை (Amount)': Number(data.amount),
                'சுபநிகழ்ச்சி (Occasion)': data.occasion || '-',
                'முறை (Gift Term)': data.giftTerm || '1st Time'
            },
            details: `${data.recipientName} அவர்களுக்கு செய்த ₹${Number(data.amount).toLocaleString('en-IN')} மொய் பதிவு செய்யப்பட்டது.`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleUpdateGivenMoi = async (id, data) => {
        const oldEntry = givenEntries.find((g) => (g.id === id || g.givenMoiEntryId === id));
        const res = await api.updateGivenMoi(id, data);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'UPDATE',
            module: 'Given Moi',
            recordName: data.recipientName || oldEntry?.recipientName || 'Given Gift',
            village: data.village || oldEntry?.village || '-',
            oldValue: oldEntry ? {
                'பெயர் (Name)': oldEntry.recipientName,
                'ஊர் (Village)': oldEntry.village || '-',
                'தொகை (Amount)': Number(oldEntry.amount),
                'சுபநிகழ்ச்சி (Occasion)': oldEntry.occasion || '-',
                'முறை (Gift Term)': oldEntry.giftTerm || '1st Time'
            } : null,
            newValue: {
                'பெயர் (Name)': data.recipientName,
                'ஊர் (Village)': data.village || '-',
                'தொகை (Amount)': Number(data.amount),
                'சுபநிகழ்ச்சி (Occasion)': data.occasion || '-',
                'முறை (Gift Term)': data.giftTerm || '1st Time'
            },
            details: `${data.recipientName} அவர்களின் செய்த மொய் பதிவு திருத்தப்பட்டது (₹${oldEntry?.amount || 0} ➔ ₹${data.amount}).`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleDeleteGivenMoi = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this given gift record?');
        if (!confirmed) return;
        const oldEntry = givenEntries.find((g) => (g.id === id || g.givenMoiEntryId === id));
        await api.deleteGivenMoi(id);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'DELETE',
            module: 'Given Moi',
            recordName: oldEntry?.recipientName || 'Given Gift',
            village: oldEntry?.village || '-',
            oldValue: oldEntry ? {
                'பெயர் (Name)': oldEntry.recipientName,
                'ஊர் (Village)': oldEntry.village || '-',
                'தொகை (Amount)': Number(oldEntry.amount),
                'சுபநிகழ்ச்சி (Occasion)': oldEntry.occasion || '-',
                'முறை (Gift Term)': oldEntry.giftTerm || '1st Time'
            } : null,
            details: `${oldEntry?.recipientName || 'நபர்'} அவர்களின் செய்த ₹${oldEntry?.amount || 0} மொய் பதிவு நீக்கப்பட்டது.`,
            eventId: activeEvent?.id
        });
    };

    // Gold Entries
    const handleRecordGold = async (data) => {
        const res = await api.recordGold(data);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'CREATE',
            module: 'Gold Entry',
            recordName: data.contributorName || 'Gold Gift',
            village: data.village || '-',
            newValue: {
                'வ.எண் (S.No)': res.serialNumber || 'New',
                'பெயர் (Name)': data.contributorName,
                'ஊர் (Village)': data.village || '-',
                'பொன் / நகை விவரம் (Gold Details)': data.goldDetails
            },
            details: `${data.contributorName} அவர்களின் பொன் வரவு பதிவு செய்யப்பட்டது (${data.goldDetails}).`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleUpdateGold = async (id, data) => {
        const oldGold = goldEntries.find((g) => (g.id === id || g.goldEntryId === id));
        const res = await api.updateGold(id, data);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'UPDATE',
            module: 'Gold Entry',
            recordName: data.contributorName || oldGold?.contributorName || 'Gold Gift',
            village: data.village || oldGold?.village || '-',
            oldValue: oldGold ? {
                'வ.எண் (S.No)': oldGold.serialNumber || oldGold.id,
                'பெயர் (Name)': oldGold.contributorName,
                'ஊர் (Village)': oldGold.village || '-',
                'பொன் / நகை விவரம் (Gold Details)': oldGold.goldDetails
            } : null,
            newValue: {
                'பெயர் (Name)': data.contributorName,
                'ஊர் (Village)': data.village || '-',
                'பொன் / நகை விவரம் (Gold Details)': data.goldDetails
            },
            details: `${data.contributorName} அவர்களின் பொன் வரவு விவரம் திருத்தப்பட்டது.`,
            eventId: activeEvent?.id
        });
        return res;
    };

    const handleDeleteGold = async (id) => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this gold entry?');
        if (!confirmed) return;
        const oldGold = goldEntries.find((g) => (g.id === id || g.goldEntryId === id));
        await api.deleteGold(id);
        if (activeEvent) await loadEventData(activeEvent.id);

        recordAuditLog({
            actionType: 'DELETE',
            module: 'Gold Entry',
            recordName: oldGold?.contributorName || 'Gold Gift',
            village: oldGold?.village || '-',
            oldValue: oldGold ? {
                'வ.எண் (S.No)': oldGold.serialNumber || oldGold.id,
                'பெயர் (Name)': oldGold.contributorName,
                'ஊர் (Village)': oldGold.village || '-',
                'பொன் / நகை விவரம் (Gold Details)': oldGold.goldDetails
            } : null,
            details: `${oldGold?.contributorName || 'நபர்'} அவர்களின் பொன் வரவு பதிவு நீக்கப்பட்டது.`,
            eventId: activeEvent?.id
        });
    };

    // Conflict Records
    const handleDeleteConflict = async (id) => {
        try {
            const oldConf = conflictRecords.find((c) => c.id === id);
            await api.deleteConflict(id);
            setConflictRecords((prev) => prev.filter((r) => r.id !== id));

            recordAuditLog({
                actionType: 'DELETE',
                module: 'Conflict Check',
                recordName: oldConf?.recipientName || 'Conflict Record',
                village: oldConf?.village || '-',
                oldValue: oldConf ? {
                    'பெயர் (Name)': oldConf.recipientName,
                    'ஊர் (Village)': oldConf.village || '-',
                    'நிலை (Status)': oldConf.conflictStatus,
                    'நாம் போட்ட தொகை (Ledger)': Number(oldConf.theirTotalGiftAmount ?? oldConf.theirCurrentAmount ?? 0),
                    'அவர்கள் திரும்பிச் செய்தது (Return)': Number(oldConf.ourGivenAmount ?? oldConf.ourPrevGivenAmount ?? 0)
                } : null,
                details: `${oldConf?.recipientName || 'நபர்'} அவர்களின் முரண்பாடு தணிக்கைப் பதிவு நீக்கப்பட்டது.`,
                eventId: activeEvent?.id
            });
        } catch (err) {
            alert('Failed to delete conflict record: ' + err.message);
        }
    };

    if (!isLoggedIn) {
        return (
            <LoginView
                onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                    setActiveView(getDefaultViewForUser(user));
                }}
            />
        );
    }

    return (
        <div className={`app-shell ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            <Sidebar
                activeView={activeView}
                onViewChange={setActiveView}
                isDarkMode={isDarkMode}
                onToggleTheme={handleToggleTheme}
                onLogout={handleLogout}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={handleToggleSidebar}
                currentUser={currentUser}
            />

            <main className="main-viewport">
                <TopHeader
                    events={events}
                    activeEvent={activeEvent}
                    onSelectEvent={setActiveEvent}
                    onOpenCreateEvent={handleOpenCreateEvent}
                    activeView={activeView}
                    currentUser={currentUser}
                    isOnline={isOnline}
                />

                <div className="content-container">
                    {activeView === 'dashboard' && (
                        <DashboardView
                            event={activeEvent}
                            transactions={transactions}
                            goldEntries={goldEntries}
                            givenEntries={givenEntries}
                            onNavigate={setActiveView}
                            onOpenCreateEvent={handleOpenCreateEvent}
                            onOpenAddCash={() => setActiveView('moi')}
                            onOpenAddGold={() => setActiveView('gold')}
                            privileges={currentUser?.privileges?.dashboard}
                        />
                    )}

                    {activeView === 'moi' && (
                        <MoiEntryView
                            event={activeEvent}
                            transactions={transactions}
                            givenEntries={givenEntries}
                            onRecordMoi={handleRecordMoi}
                            onUpdateMoi={handleUpdateMoi}
                            onDeleteMoi={handleDeleteMoi}
                            settings={settings}
                            privileges={currentUser?.privileges?.moi}
                        />
                    )}

                    {activeView === 'given_moi' && (
                        <GivenMoiEntryView
                            event={activeEvent}
                            givenEntries={givenEntries}
                            onRecordGivenMoi={handleRecordGivenMoi}
                            onUpdateGivenMoi={handleUpdateGivenMoi}
                            onDeleteGivenMoi={handleDeleteGivenMoi}
                            settings={settings}
                            privileges={currentUser?.privileges?.given_moi}
                        />
                    )}

                    {activeView === 'conflicts' && (
                        <ConflictRecordsView
                            conflictRecords={conflictRecords}
                            onDeleteConflict={handleDeleteConflict}
                            privileges={currentUser?.privileges?.conflicts}
                        />
                    )}

                    {activeView === 'gold' && (
                        <GoldEntryView
                            event={activeEvent}
                            goldEntries={goldEntries}
                            onRecordGold={handleRecordGold}
                            onUpdateGold={handleUpdateGold}
                            onDeleteGold={handleDeleteGold}
                            privileges={currentUser?.privileges?.gold}
                        />
                    )}

                    {activeView === 'reports' && (
                        <ReportsView
                            event={activeEvent}
                            transactions={transactions}
                            goldEntries={goldEntries}
                            privileges={currentUser?.privileges?.reports}
                        />
                    )}

                    {activeView === 'events' && (
                        <EventsView
                            events={events}
                            activeEvent={activeEvent}
                            transactions={transactions}
                            givenEntries={givenEntries}
                            goldEntries={goldEntries}
                            onSelectEvent={setActiveEvent}
                            onOpenCreateEvent={handleOpenCreateEvent}
                            onOpenEditEvent={handleOpenEditEvent}
                            onDeleteEvent={handleDeleteEvent}
                            privileges={currentUser?.privileges?.events}
                        />
                    )}

                    {activeView === 'settings' && (
                        <SettingsView
                            settings={settings}
                            onUpdateSettings={updateSettings}
                            onResetSettings={resetSettings}
                            privileges={currentUser?.privileges?.settings}
                        />
                    )}

                    {activeView === 'users' && (
                        <UserManagementView />
                    )}
                </div>
            </main>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={handleSaveEvent}
                editingEvent={editingEvent}
            />

            {customModal.isOpen && (
                <CustomPopup
                    type={customModal.type}
                    title={customModal.title}
                    message={customModal.message}
                    onConfirm={() => {
                        if (customModal.resolve) customModal.resolve(true);
                        setCustomModal((prev) => ({ ...prev, isOpen: false }));
                    }}
                    onCancel={() => {
                        if (customModal.resolve) customModal.resolve(false);
                        setCustomModal((prev) => ({ ...prev, isOpen: false }));
                    }}
                />
            )}
        </div>
    );
}

export default App;
