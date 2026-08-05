import React from 'react';
import {
    LayoutDashboard,
    IndianRupee,
    Send,
    Coins,
    FileText,
    CalendarDays,
    Gift,
    Moon,
    Sun,
    LogOut,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Settings,
    Users,
} from 'lucide-react';

export const Sidebar = ({
    activeView,
    onViewChange,
    isDarkMode,
    onToggleTheme,
    onLogout,
    isCollapsed,
    onToggleCollapse,
    currentUser,
}) => {
    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'events', label: 'Events Details', icon: CalendarDays },
        { id: 'moi', label: 'Moi Entry (வந்த பணம்)', icon: IndianRupee },
        { id: 'given_moi', label: 'Given Moi (செய்த மொய்)', icon: Send },
        { id: 'conflicts', label: 'Conflict Records (முரண்பாடு)', icon: AlertTriangle },
        { id: 'gold', label: 'Gold Entry (பொன்)', icon: Coins },
        { id: 'reports', label: 'Audit Log (தணிக்கை)', icon: FileText },
        { id: 'settings', label: 'Settings (அமைப்புகள்)', icon: Settings },
        { id: 'users', label: 'Users (பயனர்கள்)', icon: Users },
    ];

    // Filter navItems based on user privileges
    const navItems = allNavItems.filter((item) => {
        if (!currentUser) return true; // fallback
        if (currentUser.role === 'admin') return true; // Admin has access to everything
        return currentUser.privileges?.[item.id]?.view === true;
    });

    return (
        <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Floating Edge Collapse Toggle Button */}
            <button
                className="sidebar-collapse-toggle-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Header & Logo */}
            <div className="sidebar-logo-wrap">
                <div className="sidebar-logo">
                    <div className="logo-icon-bg">
                        <Gift size={22} className="logo-sparkle" />
                    </div>
                    {!isCollapsed && (
                        <div className="logo-text-fade">
                            <h1 className="logo-title">MoiVault</h1>
                            <span className="logo-subtitle font-tamil">மொய் மேலாண்மை</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`nav-btn ${isActive ? 'active' : ''}`}
                            onClick={() => onViewChange(item.id)}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon size={19} className="nav-icon" />
                            {!isCollapsed && <span className="nav-label-text">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Items */}
            <div className="sidebar-footer gap-2 flex-col">
                <button
                    className="theme-toggle-btn"
                    onClick={onToggleTheme}
                    title={isCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>

                {onLogout && (
                    <button
                        className="theme-toggle-btn logout-btn"
                        onClick={onLogout}
                        title={isCollapsed ? 'Log Out' : undefined}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span>Log Out</span>}
                    </button>
                )}
            </div>
        </aside>
    );
};
