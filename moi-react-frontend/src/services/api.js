const BASE_URL = 'http://localhost:8080/api';

export const api = {
    // Events
    getEvents: async () => {
        const res = await fetch(`${BASE_URL}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    createEvent: async (eventData) => {
        const res = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
    },

    updateEvent: async (eventId, eventData) => {
        const res = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        });
        if (!res.ok) throw new Error('Failed to update event');
        return res.json();
    },

    deleteEvent: async (eventId) => {
        const res = await fetch(`${BASE_URL}/events/${eventId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete event');
    },

    // Moi Transactions (Received Cash)
    getTransactionsByEvent: async (eventId) => {
        const res = await fetch(`${BASE_URL}/moi/event/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    },

    getAllTransactions: async () => {
        const res = await fetch(`${BASE_URL}/moi`);
        if (!res.ok) throw new Error('Failed to fetch all transactions');
        return res.json();
    },

    getVillages: async () => {
        const res = await fetch(`${BASE_URL}/moi/villages`);
        if (!res.ok) throw new Error('Failed to fetch villages');
        return res.json();
    },

    recordMoi: async (data) => {
        const res = await fetch(`${BASE_URL}/moi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to record transaction');
        return res.json();
    },

    updateMoi: async (id, data) => {
        const res = await fetch(`${BASE_URL}/moi/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update transaction');
        return res.json();
    },

    deleteMoi: async (id) => {
        const res = await fetch(`${BASE_URL}/moi/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete transaction');
    },

    // Given Moi (நாம் செய்த மொய்)
    getGivenMoiByEvent: async (eventId) => {
        const res = await fetch(`${BASE_URL}/given-moi/event/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch given moi entries');
        return res.json();
    },

    getAllGivenMoi: async () => {
        const res = await fetch(`${BASE_URL}/given-moi`);
        if (!res.ok) throw new Error('Failed to fetch all given moi entries');
        return res.json();
    },

    recordGivenMoi: async (data) => {
        const res = await fetch(`${BASE_URL}/given-moi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to record given moi entry');
        return res.json();
    },

    updateGivenMoi: async (id, data) => {
        const res = await fetch(`${BASE_URL}/given-moi/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update given moi entry');
        return res.json();
    },

    deleteGivenMoi: async (id) => {
        const res = await fetch(`${BASE_URL}/given-moi/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete given moi entry');
    },

    // ─── Conflict Check API ───────────────────────────────────────────────────

    /** Check conflict WITHOUT saving to DB (preview only). */
    checkConflict: async (recipientName, village, theirCurrentAmount, prevReturnAmount, eventId = null, moiTransactionId = null) => {
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
    },

    /**
     * Save the conflict result to DB.
     * Comparison is done purely from theirCurrentAmount vs prevReturnAmount.
     */
    checkAndSaveConflict: async (recipientName, village, theirCurrentAmount, prevReturnAmount, eventId = null, moiTransactionId = null) => {
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
        return res.json();
    },

    getAllConflicts: async () => {
        const res = await fetch(`${BASE_URL}/conflict`);
        if (!res.ok) throw new Error('Failed to fetch conflict records');
        return res.json();
    },

    getConflictsByEvent: async (eventId) => {
        const res = await fetch(`${BASE_URL}/conflict/event/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch conflicts for event');
        return res.json();
    },

    deleteConflict: async (id) => {
        const res = await fetch(`${BASE_URL}/conflict/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete conflict record');
    },

    // Gold Entries
    getGoldEntriesByEvent: async (eventId) => {
        const res = await fetch(`${BASE_URL}/gold/event/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch gold entries');
        return res.json();
    },

    getRecentGoldEntries: async (eventId) => {
        const res = await fetch(`${BASE_URL}/gold/event/${eventId}/recent`);
        if (!res.ok) throw new Error('Failed to fetch recent gold entries');
        return res.json();
    },

    recordGold: async (data) => {
        const res = await fetch(`${BASE_URL}/gold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to record gold entry');
        return res.json();
    },

    updateGold: async (id, data) => {
        const res = await fetch(`${BASE_URL}/gold/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update gold entry');
        return res.json();
    },

    deleteGold: async (id) => {
        const res = await fetch(`${BASE_URL}/gold/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete gold entry');
    },

    // Word Report Download
    getWordReportUrl: (eventId) => `${BASE_URL}/reports/overall/word?eventId=${eventId}`,
};
