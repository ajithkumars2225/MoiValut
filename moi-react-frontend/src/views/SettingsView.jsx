import React, { useState } from 'react';
import {
    Settings,
    Zap,
    MousePointer,
    CheckCircle,
    AlertTriangle,
    Save,
    RotateCcw,
    ShieldCheck,
    Monitor,
    Table2,
    FileDown,
    ChevronDown,
    ChevronUp,
    Info,
    User,
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../hooks/useUserSettings';

// Reusable Section Card
const SettingsSection = ({ icon: Icon, title, subtitle, accentColor = '#8B5CF6', children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="glass-card full-width-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Section Header */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.2)', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderBottom: open ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor,
                    }}>
                        <Icon size={17} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F9FAFB' }}>{title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 1 }}>{subtitle}</div>
                    </div>
                </div>
                {open ? <ChevronUp size={16} style={{ color: '#6B7280' }} /> : <ChevronDown size={16} style={{ color: '#6B7280' }} />}
            </button>

            {/* Section Body */}
            {open && (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

// Toggle Switch
const ToggleSwitch = ({ checked, onChange, id }) => (
    <label htmlFor={id} style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: checked ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
            transition: '0.25s', boxShadow: checked ? '0 0 10px rgba(139,92,246,0.4)' : 'none',
        }} />
        <span style={{
            position: 'absolute', top: 3, left: checked ? 22 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: '#FFF', transition: '0.25s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }} />
    </label>
);

// Setting Row
const SettingRow = ({ label, tamLabel, description, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#E2E8F0' }}>{label}</span>
                {tamLabel && (
                    <span style={{ fontFamily: 'var(--font-tamil)', fontSize: '0.75rem', color: '#A78BFA' }}>
                        ({tamLabel})
                    </span>
                )}
            </div>
            {description && (
                <p style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {description}
                </p>
            )}
        </div>
        <div style={{ flexShrink: 0 }}>
            {children}
        </div>
    </div>
);

// Mode Radio Select
const ModeSelect = ({ value, onChange, options }) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {options.map(opt => (
            <button key={opt.value} type="button"
                onClick={() => onChange(opt.value)}
                style={{
                    padding: '0.45rem 0.9rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: value === opt.value ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
                    background: value === opt.value ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'rgba(255,255,255,0.05)',
                    color: '#FFF',
                    boxShadow: value === opt.value ? '0 4px 12px rgba(139,92,246,0.35)' : 'none',
                    transition: 'all 0.2s',
                }}
            >
                {opt.icon} {opt.label}
            </button>
        ))}
    </div>
);

// Number Select
const NumberSelect = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(Number(e.target.value))} className="modern-control-sm"
        style={{ minWidth: 100 }}>
        {options.map(o => (
            <option key={o} value={o}>{o}</option>
        ))}
    </select>
);

export const SettingsView = ({ settings, onUpdateSettings, onResetSettings }) => {
    const [saved, setSaved] = useState(false);
    const username = sessionStorage.getItem('loggedInUser') || 'Admin';

    const update = (key, val) => {
        onUpdateSettings({ [key]: val });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="view-content fade-in">
            {/* Page Header */}
            <div className="glass-card full-width-card mb-3" style={{ padding: '1.1rem 1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA'
                        }}>
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                                App Settings (அமைப்புகள்)
                            </h2>
                            <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <User size={12} />
                                Settings saved for user: <strong style={{ color: '#A78BFA' }}>{username}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {saved && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)',
                                color: '#34D399', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600
                            }}>
                                <CheckCircle size={14} /> Saved!
                            </div>
                        )}
                        <button
                            onClick={() => { if (window.confirm('Reset all settings to defaults?')) onResetSettings(); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                                color: '#FB7185', padding: '0.5rem 0.85rem', borderRadius: 10,
                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            <RotateCcw size={14} /> Reset Defaults
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* ─── 1. CONFLICT CHECK SETTINGS ─────────────────────────────────── */}
                <SettingsSection
                    icon={AlertTriangle}
                    title="Conflict Check Settings (முரண்பாடு சோதனை அமைப்பு)"
                    subtitle="Configure how conflict checks work when recording Given Moi (நாம் செய்த மொய்)"
                    accentColor="#F59E0B"
                    defaultOpen={true}
                >
                    {/* Conflict Check Mode */}
                    <SettingRow
                        label="Conflict Check Mode"
                        tamLabel="சோதனை முறை"
                        description="Auto Mode: conflict is automatically checked and saved on every save. Manual Mode: a 'Check Conflict' button appears and you control when to check."
                    >
                        <ModeSelect
                            value={settings.conflictCheckMode}
                            onChange={val => update('conflictCheckMode', val)}
                            options={[
                                { value: 'auto', label: '⚡ Auto Mode', icon: '' },
                                { value: 'manual', label: '🖱 Manual Mode', icon: '' },
                            ]}
                        />
                    </SettingRow>

                    {/* Auto Save Conflict Records */}
                    <SettingRow
                        label="Auto-Save Conflict Records"
                        tamLabel="தானியங்கி சேமிப்பு"
                        description="When enabled, conflict results are automatically stored in the Conflict Records database for future reference and audit."
                    >
                        <ToggleSwitch
                            id="conflictAutoSave"
                            checked={settings.conflictAutoSave}
                            onChange={val => update('conflictAutoSave', val)}
                        />
                    </SettingRow>

                    {/* Highlight Short Payments */}
                    <SettingRow
                        label="Highlight Short Payments"
                        tamLabel="குறைவான திருப்பம் முன்னிலைப்படுத்தல்"
                        description="Show a warning indicator when the gift amount is less than what they originally gave us."
                    >
                        <ToggleSwitch
                            id="conflictHighlightShort"
                            checked={settings.conflictHighlightShort}
                            onChange={val => update('conflictHighlightShort', val)}
                        />
                    </SettingRow>

                    {/* Highlight Excess Payments */}
                    <SettingRow
                        label="Highlight Excess Payments"
                        tamLabel="அதிக திருப்பம் முன்னிலைப்படுத்தல்"
                        description="Show a warning indicator when the gift amount exceeds what they originally gave us."
                    >
                        <ToggleSwitch
                            id="conflictHighlightExcess"
                            checked={settings.conflictHighlightExcess}
                            onChange={val => update('conflictHighlightExcess', val)}
                        />
                    </SettingRow>

                    {/* Info box */}
                    <div style={{
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#FBBF24',
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
                    }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>
                            Conflict check compares <strong>their total received moi</strong> (from Moi Entry records) 
                            against <strong>what you are giving back</strong> (Given Moi entry). 
                            Same name + village combination is used for matching.
                        </span>
                    </div>
                </SettingsSection>

                {/* ─── 2. APPEARANCE SETTINGS ──────────────────────────────────────── */}
                <SettingsSection
                    icon={Monitor}
                    title="Appearance Settings (தோற்ற அமைப்பு)"
                    subtitle="Theme, sidebar and visual preferences"
                    accentColor="#8B5CF6"
                    defaultOpen={true}
                >
                    <SettingRow
                        label="Default Theme"
                        tamLabel="கருப்பொருள்"
                        description="Choose between dark and light mode as the default on login."
                    >
                        <ModeSelect
                            value={settings.isDarkMode ? 'dark' : 'light'}
                            onChange={val => update('isDarkMode', val === 'dark')}
                            options={[
                                { value: 'dark', label: '🌙 Dark Mode' },
                                { value: 'light', label: '☀️ Light Mode' },
                            ]}
                        />
                    </SettingRow>

                    <SettingRow
                        label="Sidebar Collapsed by Default"
                        tamLabel="தொடக்கத்தில் சுருக்கு"
                        description="Start with the navigation sidebar collapsed on every login for a wider content view."
                    >
                        <ToggleSwitch
                            id="sidebarCollapsed"
                            checked={settings.sidebarCollapsed}
                            onChange={val => update('sidebarCollapsed', val)}
                        />
                    </SettingRow>

                    <SettingRow
                        label="Show Tamil Sub-Headers in Tables"
                        tamLabel="தமிழ் தலைப்புகள்"
                        description="Show bilingual Tamil sub-headers below English column headers in all tables."
                    >
                        <ToggleSwitch
                            id="showTamilHeaders"
                            checked={settings.showTamilHeaders}
                            onChange={val => update('showTamilHeaders', val)}
                        />
                    </SettingRow>
                </SettingsSection>

                {/* ─── 3. TABLE DISPLAY SETTINGS ───────────────────────────────────── */}
                <SettingsSection
                    icon={Table2}
                    title="Table Display Settings (அட்டவணை அமைப்பு)"
                    subtitle="Control pagination and table view preferences"
                    accentColor="#10B981"
                    defaultOpen={false}
                >
                    <SettingRow
                        label="Default Rows Per Page"
                        tamLabel="பக்கத்திற்கு வரிசைகள்"
                        description="Set how many records are shown per page by default in all list views."
                    >
                        <NumberSelect
                            value={settings.defaultPageSize}
                            onChange={val => update('defaultPageSize', val)}
                            options={[10, 20, 50, 100]}
                        />
                    </SettingRow>
                </SettingsSection>

                {/* ─── 4. EXPORT SETTINGS ──────────────────────────────────────────── */}
                <SettingsSection
                    icon={FileDown}
                    title="Export Settings (ஏற்றுமதி அமைப்பு)"
                    subtitle="Default export format and options"
                    accentColor="#3B82F6"
                    defaultOpen={false}
                >
                    <SettingRow
                        label="Default Export Format"
                        tamLabel="ஏற்றுமதி வடிவம்"
                        description="Choose whether Excel or PDF is the primary export button when clicking export."
                    >
                        <ModeSelect
                            value={settings.defaultExportFormat}
                            onChange={val => update('defaultExportFormat', val)}
                            options={[
                                { value: 'excel', label: '📊 Excel (.xlsx)' },
                                { value: 'pdf', label: '📄 PDF (Print)' },
                            ]}
                        />
                    </SettingRow>

                    <SettingRow
                        label="Include Gold Entries in Export"
                        tamLabel="பொன் பதிவுகள் சேர்"
                        description="Include gold gift entries when exporting Overall Reports."
                    >
                        <ToggleSwitch
                            id="includeGoldInExport"
                            checked={settings.includeGoldInExport}
                            onChange={val => update('includeGoldInExport', val)}
                        />
                    </SettingRow>
                </SettingsSection>

                {/* ─── Current Settings Preview ────────────────────────────────────── */}
                <div className="glass-card full-width-card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <ShieldCheck size={16} style={{ color: '#A78BFA' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#E2E8F0' }}>
                            Current Settings Summary
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#6B7280', marginLeft: 4 }}>
                            (Saved for user: <strong style={{ color: '#A78BFA' }}>{username}</strong>)
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                        {[
                            { label: 'Conflict Mode', value: settings.conflictCheckMode === 'auto' ? '⚡ Auto' : '🖱 Manual' },
                            { label: 'Auto-Save Conflicts', value: settings.conflictAutoSave ? '✅ On' : '❌ Off' },
                            { label: 'Theme', value: settings.isDarkMode ? '🌙 Dark' : '☀️ Light' },
                            { label: 'Sidebar Default', value: settings.sidebarCollapsed ? '🗜 Collapsed' : '📌 Expanded' },
                            { label: 'Tamil Headers', value: settings.showTamilHeaders ? '✅ On' : '❌ Off' },
                            { label: 'Page Size', value: `${settings.defaultPageSize} rows` },
                            { label: 'Highlight Short', value: settings.conflictHighlightShort ? '✅ On' : '❌ Off' },
                            { label: 'Highlight Excess', value: settings.conflictHighlightExcess ? '✅ On' : '❌ Off' },
                            { label: 'Export Format', value: settings.defaultExportFormat === 'excel' ? '📊 Excel' : '📄 PDF' },
                        ].map(item => (
                            <div key={item.label} style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 8, padding: '0.5rem 0.7rem'
                            }}>
                                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F9FAFB' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
