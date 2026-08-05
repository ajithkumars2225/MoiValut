const BASE_URL = 'http://localhost:8080/api';

// Cache Helper Utilities
const getCache = (key, defaultValue = []) => {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setCache = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to set cache', e);
    }
};

const addToSyncQueue = (action, payload, entityId = null) => {
    const queue = getCache('offline_sync_queue', []);
    const queueId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    queue.push({ queueId, action, payload, entityId });
    setCache('offline_sync_queue', queue);
};

// Applies offline changes directly to local storage caches so user gets instant updates
const applyLocalUpdate = (action, payload, entityId = null) => {
    if (action.endsWith('_EVENT')) {
        let events = getCache('cache_events', []);
        if (action === 'CREATE_EVENT') {
            events.push(payload);
        } else if (action === 'UPDATE_EVENT') {
            events = events.map(e => e.eventId === entityId ? { ...e, ...payload } : e);
        } else if (action === 'DELETE_EVENT') {
            events = events.filter(e => e.eventId !== entityId);
        }
        setCache('cache_events', events);
    } 
    else if (action === 'CREATE_MOI') {
        const eventId = payload.eventId;
        if (eventId) {
            const key = `cache_transactions_event_${eventId}`;
            const txs = getCache(key, []);
            txs.push(payload);
            setCache(key, txs);
        }
    }
    else if (action === 'UPDATE_MOI') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_transactions_event_')) {
                let txs = getCache(key, []);
                const updated = txs.map(t => (t.transactionId === entityId || t.id === entityId) ? { ...t, ...payload } : t);
                setCache(key, updated);
            }
        }
    }
    else if (action === 'DELETE_MOI') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_transactions_event_')) {
                let txs = getCache(key, []);
                const filtered = txs.filter(t => t.transactionId !== entityId && t.id !== entityId);
                setCache(key, filtered);
            }
        }
    }
    else if (action === 'CREATE_GOLD') {
        const eventId = payload.eventId;
        if (eventId) {
            const key = `cache_gold_event_${eventId}`;
            const golds = getCache(key, []);
            golds.push(payload);
            setCache(key, golds);
        }
    }
    else if (action === 'UPDATE_GOLD') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_gold_event_')) {
                let golds = getCache(key, []);
                const updated = golds.map(g => (g.id === entityId || g.goldEntryId === entityId) ? { ...g, ...payload } : g);
                setCache(key, updated);
            }
        }
    }
    else if (action === 'DELETE_GOLD') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_gold_event_')) {
                let golds = getCache(key, []);
                const filtered = golds.filter(g => g.id !== entityId && g.goldEntryId !== entityId);
                setCache(key, filtered);
            }
        }
    }
    else if (action.endsWith('_GIVEN')) {
        let givens = getCache('cache_given_moi', []);
        if (action === 'CREATE_GIVEN') {
            givens.push(payload);
        } else if (action === 'UPDATE_GIVEN') {
            givens = givens.map(g => (g.id === entityId || g.givenMoiEntryId === entityId) ? { ...g, ...payload } : g);
        } else if (action === 'DELETE_GIVEN') {
            givens = givens.filter(g => g.id !== entityId && g.givenMoiEntryId !== entityId);
        }
        setCache('cache_given_moi', givens);

        // Also sync local cache for event-specific given list
        const eventId = payload.eventId;
        if (eventId) {
            let eventGivens = getCache(`cache_given_event_${eventId}`, []);
            if (action === 'CREATE_GIVEN') {
                eventGivens.push(payload);
            } else if (action === 'UPDATE_GIVEN') {
                eventGivens = eventGivens.map(g => (g.id === entityId || g.givenMoiEntryId === entityId) ? { ...g, ...payload } : g);
            } else if (action === 'DELETE_GIVEN') {
                eventGivens = eventGivens.filter(g => g.id !== entityId && g.givenMoiEntryId !== entityId);
            }
            setCache(`cache_given_event_${eventId}`, eventGivens);
        }
    }
    else if (action.endsWith('_CONFLICT')) {
        let conflicts = getCache('cache_conflicts', []);
        if (action === 'CREATE_CONFLICT') {
            conflicts.push(payload);
        } else if (action === 'DELETE_CONFLICT') {
            conflicts = conflicts.filter(c => c.id !== entityId);
        }
        setCache('cache_conflicts', conflicts);
    }
};

export const api = {
    // Background Sync
    syncOfflineData: async () => {
        const queue = getCache('offline_sync_queue', []);
        if (queue.length === 0) return;

        console.log(`Syncing ${queue.length} offline operations...`);
        const remainingQueue = [];

        for (const item of queue) {
            try {
                if (item.action === 'CREATE_EVENT') {
                    const { eventId, ...data } = item.payload;
                    await fetch(`${BASE_URL}/events`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                } else if (item.action === 'UPDATE_EVENT') {
                    await fetch(`${BASE_URL}/events/${item.entityId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });
                } else if (item.action === 'DELETE_EVENT') {
                    await fetch(`${BASE_URL}/events/${item.entityId}`, { method: 'DELETE' });
                } 
                else if (item.action === 'CREATE_MOI') {
                    const { transactionId, ...data } = item.payload;
                    await fetch(`${BASE_URL}/moi`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                } else if (item.action === 'UPDATE_MOI') {
                    await fetch(`${BASE_URL}/moi/${item.entityId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });
                } else if (item.action === 'DELETE_MOI') {
                    await fetch(`${BASE_URL}/moi/${item.entityId}`, { method: 'DELETE' });
                }
                else if (item.action === 'CREATE_GOLD') {
                    const { id, ...data } = item.payload;
                    await fetch(`${BASE_URL}/gold`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                } else if (item.action === 'UPDATE_GOLD') {
                    await fetch(`${BASE_URL}/gold/${item.entityId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });
                } else if (item.action === 'DELETE_GOLD') {
                    await fetch(`${BASE_URL}/gold/${item.entityId}`, { method: 'DELETE' });
                }
                else if (item.action === 'CREATE_GIVEN') {
                    const { id, givenMoiEntryId, ...data } = item.payload;
                    await fetch(`${BASE_URL}/given-moi`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                } else if (item.action === 'UPDATE_GIVEN') {
                    await fetch(`${BASE_URL}/given-moi/${item.entityId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });
                } else if (item.action === 'DELETE_GIVEN') {
                    await fetch(`${BASE_URL}/given-moi/${item.entityId}`, { method: 'DELETE' });
                }
                else if (item.action === 'CREATE_CONFLICT') {
                    await fetch(`${BASE_URL}/conflict`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });
                } else if (item.action === 'DELETE_CONFLICT') {
                    await fetch(`${BASE_URL}/conflict/${item.entityId}`, { method: 'DELETE' });
                }
            } catch (e) {
                console.error(`Failed to sync item ${item.queueId}, keeping in queue`, e);
                remainingQueue.push(item);
            }
        }

        setCache('offline_sync_queue', remainingQueue);
    },

    // Events
    getEvents: async () => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/events`);
            if (!res.ok) throw new Error('Failed to fetch events');
            const data = await res.json();
            setCache('cache_events', data);
            return data;
        } catch {
            return getCache('cache_events', []);
        }
    },

    createEvent: async (eventData) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });
            if (!res.ok) throw new Error('Failed to create event');
            const saved = await res.json();
            
            // Add to cache
            const events = getCache('cache_events', []);
            events.push(saved);
            setCache('cache_events', events);
            return saved;
        } catch {
            const tempId = 'temp-event-' + Date.now();
            const mockSaved = { ...eventData, eventId: tempId, id: tempId };
            addToSyncQueue('CREATE_EVENT', mockSaved);
            applyLocalUpdate('CREATE_EVENT', mockSaved);
            return mockSaved;
        }
    },

    updateEvent: async (eventId, eventData) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });
            if (!res.ok) throw new Error('Failed to update event');
            const saved = await res.json();
            applyLocalUpdate('UPDATE_EVENT', saved, eventId);
            return saved;
        } catch {
            const mockSaved = { ...eventData, eventId };
            addToSyncQueue('UPDATE_EVENT', mockSaved, eventId);
            applyLocalUpdate('UPDATE_EVENT', mockSaved, eventId);
            return mockSaved;
        }
    },

    deleteEvent: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/events/${eventId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete event');
            applyLocalUpdate('DELETE_EVENT', {}, eventId);
        } catch {
            addToSyncQueue('DELETE_EVENT', {}, eventId);
            applyLocalUpdate('DELETE_EVENT', {}, eventId);
        }
    },

    // Moi Transactions (Received Cash)
    getTransactionsByEvent: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi/event/${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            setCache(`cache_transactions_event_${eventId}`, data);
            return data;
        } catch {
            return getCache(`cache_transactions_event_${eventId}`, []);
        }
    },

    getAllTransactions: async () => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi`);
            if (!res.ok) throw new Error('Failed to fetch all transactions');
            const data = await res.json();
            setCache('cache_all_transactions', data);
            return data;
        } catch {
            return getCache('cache_all_transactions', []);
        }
    },

    getVillages: async () => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi/villages`);
            if (!res.ok) throw new Error('Failed to fetch villages');
            const data = await res.json();
            setCache('cache_villages', data);
            return data;
        } catch {
            return getCache('cache_villages', []);
        }
    },

    recordMoi: async (data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to record transaction');
            const saved = await res.json();
            applyLocalUpdate('CREATE_MOI', saved);
            return saved;
        } catch {
            const tempId = 'temp-moi-' + Date.now();
            const mockSaved = {
                ...data,
                transactionId: tempId,
                id: tempId,
                transactionDate: new Date().toISOString(),
                serialNumber: getCache(`cache_transactions_event_${data.eventId}`, []).length + 1
            };
            addToSyncQueue('CREATE_MOI', mockSaved);
            applyLocalUpdate('CREATE_MOI', mockSaved);
            return mockSaved;
        }
    },

    updateMoi: async (id, data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update transaction');
            const saved = await res.json();
            applyLocalUpdate('UPDATE_MOI', saved, id);
            return saved;
        } catch {
            const mockSaved = { ...data, transactionId: id, id };
            addToSyncQueue('UPDATE_MOI', mockSaved, id);
            applyLocalUpdate('UPDATE_MOI', mockSaved, id);
            return mockSaved;
        }
    },

    deleteMoi: async (id) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/moi/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete transaction');
            applyLocalUpdate('DELETE_MOI', {}, id);
        } catch {
            addToSyncQueue('DELETE_MOI', {}, id);
            applyLocalUpdate('DELETE_MOI', {}, id);
        }
    },

    // Given Moi (நாம் செய்த மொய்)
    getGivenMoiByEvent: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/given-moi/event/${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch given moi entries');
            const data = await res.json();
            setCache(`cache_given_event_${eventId}`, data);
            return data;
        } catch {
            return getCache(`cache_given_event_${eventId}`, []);
        }
    },

    getAllGivenMoi: async () => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/given-moi`);
            if (!res.ok) throw new Error('Failed to fetch all given moi entries');
            const data = await res.json();
            setCache('cache_given_moi', data);
            return data;
        } catch {
            return getCache('cache_given_moi', []);
        }
    },

    recordGivenMoi: async (data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/given-moi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to record given moi entry');
            const saved = await res.json();
            applyLocalUpdate('CREATE_GIVEN', saved);
            return saved;
        } catch {
            const tempId = 'temp-given-' + Date.now();
            const mockSaved = {
                ...data,
                givenMoiEntryId: tempId,
                id: tempId,
                givenDate: new Date().toISOString()
            };
            addToSyncQueue('CREATE_GIVEN', mockSaved);
            applyLocalUpdate('CREATE_GIVEN', mockSaved);
            return mockSaved;
        }
    },

    updateGivenMoi: async (id, data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/given-moi/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update given moi entry');
            const saved = await res.json();
            applyLocalUpdate('UPDATE_GIVEN', saved, id);
            return saved;
        } catch {
            const mockSaved = { ...data, givenMoiEntryId: id, id };
            addToSyncQueue('UPDATE_GIVEN', mockSaved, id);
            applyLocalUpdate('UPDATE_GIVEN', mockSaved, id);
            return mockSaved;
        }
    },

    deleteGivenMoi: async (id) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/given-moi/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete given moi entry');
            applyLocalUpdate('DELETE_GIVEN', {}, id);
        } catch {
            addToSyncQueue('DELETE_GIVEN', {}, id);
            applyLocalUpdate('DELETE_GIVEN', {}, id);
        }
    },

    // ─── Conflict Check API ───────────────────────────────────────────────────
    checkConflict: async (recipientName, village, theirCurrentAmount, prevReturnAmount, eventId = null, moiTransactionId = null) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/conflict/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientName,
                    village: village || '',
                    theirCurrentAmount,
                    prevReturnAmount,
                    eventId,
                    moiTransactionId,
                }),
            });
            if (!res.ok) throw new Error('Conflict check failed');
            return res.json();
        } catch {
            // Simulated offline check
            const current = Number(theirCurrentAmount || 0);
            const prev = Number(prevReturnAmount || 0);
            const isConflict = current < prev;
            return {
                isConflict,
                message: isConflict 
                    ? `Conflict detected offline: They previously returned ₹ ${prev.toLocaleString('en-IN')}, but currently only ₹ ${current.toLocaleString('en-IN')} is entered.`
                    : 'No conflict detected offline.',
                recipientName,
                village,
                theirCurrentAmount: current,
                prevReturnAmount: prev
            };
        }
    },

    checkAndSaveConflict: async (recipientName, village, theirCurrentAmount, prevReturnAmount, eventId = null, moiTransactionId = null) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/conflict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientName,
                    village: village || '',
                    theirCurrentAmount,
                    prevReturnAmount,
                    eventId,
                    moiTransactionId,
                }),
            });
            if (!res.ok) throw new Error('Conflict save failed');
            const saved = await res.json();
            
            const conflicts = getCache('cache_conflicts', []);
            conflicts.push(saved);
            setCache('cache_conflicts', conflicts);
            return saved;
        } catch {
            const tempId = 'temp-conflict-' + Date.now();
            const mockSaved = {
                conflictRecordId: tempId,
                id: tempId,
                recipientName,
                village: village || '',
                theirCurrentAmount: Number(theirCurrentAmount),
                prevReturnAmount: Number(prevReturnAmount),
                differenceAmount: Number(prevReturnAmount) - Number(theirCurrentAmount),
                resolved: false,
                checkDate: new Date().toISOString(),
                eventId
            };
            addToSyncQueue('CREATE_CONFLICT', mockSaved);
            applyLocalUpdate('CREATE_CONFLICT', mockSaved);
            return mockSaved;
        }
    },

    getAllConflicts: async () => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/conflict`);
            if (!res.ok) throw new Error('Failed to fetch conflict records');
            const data = await res.json();
            setCache('cache_conflicts', data);
            return data;
        } catch {
            return getCache('cache_conflicts', []);
        }
    },

    getConflictsByEvent: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/conflict/event/${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch conflicts for event');
            const data = await res.json();
            setCache(`cache_conflicts_event_${eventId}`, data);
            return data;
        } catch {
            return getCache(`cache_conflicts_event_${eventId}`, []);
        }
    },

    deleteConflict: async (id) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/conflict/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete conflict record');
            applyLocalUpdate('DELETE_CONFLICT', {}, id);
        } catch {
            addToSyncQueue('DELETE_CONFLICT', {}, id);
            applyLocalUpdate('DELETE_CONFLICT', {}, id);
        }
    },

    // Gold Entries
    getGoldEntriesByEvent: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/gold/event/${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch gold entries');
            const data = await res.json();
            setCache(`cache_gold_event_${eventId}`, data);
            return data;
        } catch {
            return getCache(`cache_gold_event_${eventId}`, []);
        }
    },

    getRecentGoldEntries: async (eventId) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/gold/event/${eventId}/recent`);
            if (!res.ok) throw new Error('Failed to fetch recent gold entries');
            const data = await res.json();
            setCache(`cache_gold_recent_${eventId}`, data);
            return data;
        } catch {
            return getCache(`cache_gold_recent_${eventId}`, []);
        }
    },

    recordGold: async (data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/gold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to record gold entry');
            const saved = await res.json();
            applyLocalUpdate('CREATE_GOLD', saved);
            return saved;
        } catch {
            const tempId = 'temp-gold-' + Date.now();
            const mockSaved = {
                goldEntryId: tempId,
                id: tempId,
                goldDetails: data.goldDetails,
                entryDate: new Date().toISOString(),
                contributor: {
                    name: data.contributorName || 'Offline Contributor',
                    village: data.village || '-'
                },
                eventId: data.eventId
            };
            addToSyncQueue('CREATE_GOLD', mockSaved);
            applyLocalUpdate('CREATE_GOLD', mockSaved);
            return mockSaved;
        }
    },

    updateGold: async (id, data) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/gold/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update gold entry');
            const saved = await res.json();
            applyLocalUpdate('UPDATE_GOLD', saved, id);
            return saved;
        } catch {
            const mockSaved = {
                goldEntryId: id,
                id,
                goldDetails: data.goldDetails,
                contributor: {
                    name: data.contributorName || 'Offline Contributor',
                    village: data.village || '-'
                },
                eventId: data.eventId
            };
            addToSyncQueue('UPDATE_GOLD', mockSaved, id);
            applyLocalUpdate('UPDATE_GOLD', mockSaved, id);
            return mockSaved;
        }
    },

    deleteGold: async (id) => {
        try {
            if (!navigator.onLine) throw new TypeError('Offline');
            const res = await fetch(`${BASE_URL}/gold/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete gold entry');
            applyLocalUpdate('DELETE_GOLD', {}, id);
        } catch {
            addToSyncQueue('DELETE_GOLD', {}, id);
            applyLocalUpdate('DELETE_GOLD', {}, id);
        }
    },

    // Word Report Download
    getWordReportUrl: (eventId) => `${BASE_URL}/reports/overall/word?eventId=${eventId}`,
};
