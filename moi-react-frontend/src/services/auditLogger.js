// ── AUDIT LOGGER SERVICE (கணக்கு தணிக்கைப் பதிவு சேவை) ─────────────────────────
const STORAGE_KEY = 'moivault_audit_logs';

/**
 * Audit Action Types:
 * - 'CREATE' : New record added
 * - 'UPDATE' : Record edited/changed
 * - 'DELETE' : Record deleted
 * - 'CHECK'  : Conflict check performed
 */

export const getStoredAuditLogs = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to read audit logs:', e);
        return [];
    }
};

export const saveStoredAuditLogs = (logs) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to save audit logs:', e);
    }
};

/**
 * Record a new audit log entry
 */
export const recordAuditLog = ({
    actionType, // 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK'
    module,     // 'Moi Entry' | 'Given Moi' | 'Gold Entry' | 'Events' | 'Conflict Check'
    recordName, // Name of person or event
    village = '-',
    oldValue = null,
    newValue = null,
    details = '',
    eventId = null,
    user = 'Admin',
}) => {
    const logs = getStoredAuditLogs();
    const newEntry = {
        id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        actionType,
        module,
        recordName,
        village: village || '-',
        oldValue,
        newValue,
        details: details || `${actionType} action performed on ${recordName}`,
        eventId,
        user: user || 'Admin',
    };

    const updatedLogs = [newEntry, ...logs];
    saveStoredAuditLogs(updatedLogs);
    return newEntry;
};

export const clearAuditLogs = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const deleteSingleAuditLog = (logId) => {
    const logs = getStoredAuditLogs();
    const updated = logs.filter(l => l.id !== logId);
    saveStoredAuditLogs(updated);
    return updated;
};
