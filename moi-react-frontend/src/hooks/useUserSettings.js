/**
 * useUserSettings — User-based persistent settings hook.
 *
 * Settings are namespaced per logged-in username.
 * Falls back to 'default' namespace if no user is stored.
 *
 * Usage:
 *   const [settings, updateSettings] = useUserSettings();
 *   updateSettings({ conflictCheckMode: 'manual' });
 */

import { useState, useCallback } from 'react';

export const DEFAULT_SETTINGS = {
    // ─── Conflict Check ────────────────────────────────────────────────────
    conflictCheckMode: 'auto',          // 'auto' | 'manual'
    conflictAutoSave: true,             // Save conflict records automatically
    conflictHighlightShort: true,       // Highlight short payments in red
    conflictHighlightExcess: true,      // Highlight excess payments in orange

    // ─── Appearance ────────────────────────────────────────────────────────
    isDarkMode: true,                   // dark / light theme
    sidebarCollapsed: false,            // sidebar default collapsed state

    // ─── Table Display ────────────────────────────────────────────────────
    defaultPageSize: 20,                // rows per page: 10 | 20 | 50 | 100
    showTamilHeaders: true,             // show Tamil sub-headers in tables

    // ─── Export ────────────────────────────────────────────────────────────
    defaultExportFormat: 'excel',       // 'excel' | 'pdf'
    includeGoldInExport: true,
};

const getStorageKey = () => {
    // Namespace settings by logged-in username
    const username = sessionStorage.getItem('loggedInUser') || 'Admin';
    return `user_settings_${username.toLowerCase()}`;
};

const loadSettings = () => {
    try {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults (so new settings added later get defaults)
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load user settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
};

const saveSettings = (settings) => {
    try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save user settings:', e);
    }
};

export const useUserSettings = () => {
    const [settings, setSettings] = useState(() => loadSettings());

    const updateSettings = useCallback((partial) => {
        setSettings((prev) => {
            const next = { ...prev, ...partial };
            saveSettings(next);
            return next;
        });
    }, []);

    const resetSettings = useCallback(() => {
        const defaults = { ...DEFAULT_SETTINGS };
        saveSettings(defaults);
        setSettings(defaults);
    }, []);

    return [settings, updateSettings, resetSettings];
};
