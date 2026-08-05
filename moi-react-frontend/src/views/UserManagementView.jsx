import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Key,
    Shield,
    Trash2,
    Edit3,
    Check,
    X,
    User,
    Lock,
    Settings,
    ShieldAlert,
    Info,
} from 'lucide-react';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    ALL_MODULES,
    buildEmptyPrivileges
} from '../services/userManager';

export const UserManagementView = () => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Form fields
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [privileges, setPrivileges] = useState(buildEmptyPrivileges());
    const [error, setError] = useState('');

    useEffect(() => {
        refreshUsersList();
    }, []);

    const refreshUsersList = () => {
        setUsers(getUsers());
    };

    const handleOpenAdd = () => {
        setEditingUser(null);
        setUsername('');
        setFullName('');
        setPassword('');
        setPrivileges(buildEmptyPrivileges());
        setError('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setUsername(user.username);
        setFullName(user.fullName || '');
        setPassword(user.password || '');
        // Clone privileges or merge with empty to avoid missing properties
        const userPrivs = { ...buildEmptyPrivileges(), ...user.privileges };
        setPrivileges(userPrivs);
        setError('');
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('User Name is required.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }

        try {
            if (editingUser) {
                // Update
                updateUser(editingUser.id, {
                    username: username.trim(),
                    fullName: fullName.trim(),
                    password: password,
                    privileges: privileges,
                });
            } else {
                // Create
                createUser(username.trim(), password, privileges, fullName.trim());
            }
            refreshUsersList();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message || 'Error saving user.');
        }
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
            deleteUser(id);
            refreshUsersList();
        }
    };

    const togglePrivilege = (moduleId, actionType) => {
        setPrivileges((prev) => {
            const updated = { ...prev };
            if (!updated[moduleId]) {
                updated[moduleId] = { view: false, add: false, edit: false, delete: false };
            }
            updated[moduleId] = {
                ...updated[moduleId],
                [actionType]: !updated[moduleId][actionType],
            };

            // Auto toggle: if add/edit/delete is turned on, make sure view is also on
            if (actionType !== 'view' && updated[moduleId][actionType]) {
                updated[moduleId].view = true;
            }

            // Auto toggle: if view is turned off, make sure add/edit/delete are also off
            if (actionType === 'view' && !updated[moduleId].view) {
                updated[moduleId].add = false;
                updated[moduleId].edit = false;
                updated[moduleId].delete = false;
            }

            return updated;
        });
    };

    return (
        <div className="view-content fade-in">
            {/* 🌟 PAGE HEADER BAR 🌟 */}
            <div className="full-width-card glass-card compact-list-header mb-4">
                <div className="card-header-flex align-center">
                    <div className="title-block-sm">
                        <div className="badge-icon-purple-sm">
                            <Users size={16} />
                        </div>
                        <div className="title-text-wrap">
                            <h2 className="header-title-sm">User Management (பயனர் மேலாண்மை)</h2>
                            <span className="collection-pill-sm">
                                Manage application users, roles, and functional privileges
                            </span>
                        </div>
                    </div>

                    <div className="actions-block-sm">
                        <button className="modern-btn btn-new-event-neon" onClick={handleOpenAdd}>
                            <UserPlus size={15} />
                            <span>Create New User / புதிய பயனர்</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 📋 USERS GRID/CARDS 📋 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Fixed System Admin Card for reference */}
                <div className="glass-card" style={{ borderLeft: '3px solid #10B981', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-header)' }}>Admin</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Administrator</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#34D399', fontWeight: 600 }}>
                                System Default
                            </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.8rem 0' }}>
                            Permanent system default administration account. Always has full access to all features, options, and logs.
                        </p>
                        <div style={{ background: 'var(--bg-btn-ghost)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                            <strong>Privileges:</strong> Full Super Admin Access
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Shield size={12} /> Unmodifiable Profile
                        </span>
                    </div>
                </div>

                {/* Dynamic User Cards */}
                {users.length === 0 ? (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: 'var(--text-muted)' }}>
                        <ShieldAlert size={28} style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.85rem' }}>No custom users created yet.</span>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click the button above to add custom operators.</span>
                    </div>
                ) : (
                    users.map((u) => {
                        // Count granted privileges
                        const grantCount = Object.values(u.privileges || {}).reduce((count, p) => {
                            if (p.view) count++;
                            return count;
                        }, 0);

                        return (
                            <div key={u.id} className="glass-card" style={{ borderLeft: '3px solid #8B5CF6', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-header)' }}>{u.username}</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.fullName || 'Custom Operator'}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: 'rgba(139,92,246,0.15)', color: '#A78BFA', fontWeight: 600 }}>
                                            {grantCount} Modules
                                        </span>
                                    </div>
                                    <div style={{ margin: '0.8rem 0' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Access List:</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                            {ALL_MODULES.map((m) => {
                                                const hasAccess = u.privileges?.[m.id]?.view;
                                                return (
                                                    <span
                                                        key={m.id}
                                                        style={{
                                                            fontSize: '0.62rem',
                                                            padding: '0.15rem 0.4rem',
                                                            borderRadius: '4px',
                                                            background: hasAccess ? 'rgba(139,92,246,0.12)' : 'var(--bg-btn-ghost)',
                                                            color: hasAccess ? '#A78BFA' : 'var(--text-muted)',
                                                            fontWeight: hasAccess ? 600 : 400,
                                                            border: '1px solid var(--border-color)'
                                                        }}
                                                    >
                                                        {m.label.split(' ')[0]}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleOpenEdit(u)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem',
                                            fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(139,92,246,0.3)',
                                            background: 'rgba(139,92,246,0.12)', color: '#A78BFA',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        <Edit3 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.id, u.username)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem',
                                            fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(244,63,94,0.3)',
                                            background: 'rgba(244,63,94,0.12)', color: '#FB7185',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 🛠️ CREATE / EDIT MODAL 🛠️ */}
            {isModalOpen && (
                <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="hyper-modal-card spring-popup" style={{ maxWidth: '580px', width: '100%', borderRadius: '20px', overflow: 'hidden' }}>
                        
                        <div className="hyper-header">
                            <div className="hyper-title-group">
                                <Shield size={22} className="text-purple" />
                                <div>
                                    <h3>{editingUser ? 'Edit User Privileges' : 'Create New User Profile'}</h3>
                                    <p className="modal-subtitle">Define operator account credentials and permission matrix</p>
                                </div>
                            </div>
                            <button className="hyper-close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="hyper-body-scrollable" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                            {error && (
                                <div className="login-portal-error mb-3" style={{ padding: '0.75rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                                    <ShieldAlert size={16} />
                                    <span style={{ fontSize: '0.8rem' }}>{error}</span>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                        User Login Name (பயனர் பெயர்) *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="e.g. operator1"
                                            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.2rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-input)', fontSize: '0.85rem' }}
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                        Full Name / Designation
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Settings size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="e.g. Counter Operator"
                                            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.2rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-input)', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    Password (கடவுச்சொல்) *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.2rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-input)', fontSize: '0.85rem' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* 🛡️ PRIVILEGES GRID 🛡️ */}
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-header)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Shield size={14} className="text-purple" /> Privilege Configuration Matrix (அனுமதி அமைப்பு)
                                </h4>
                                <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                    Assign specific read/write access permissions per module. Checking Write actions will automatically enable View access.
                                </p>

                                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', background: 'var(--bg-control-sm)' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-btn-ghost)' }}>
                                                <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Module (பிரிவு)</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>View (பார்க்க)</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Add (சேர்க்க)</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Edit (திருத்த)</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Delete (நீக்க)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ALL_MODULES.map((m) => {
                                                const priv = privileges[m.id] || { view: false, add: false, edit: false, delete: false };

                                                return (
                                                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'all 0.15s ease' }}>
                                                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.label}</td>
                                                        
                                                        {/* VIEW */}
                                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!priv.view}
                                                                onChange={() => togglePrivilege(m.id, 'view')}
                                                                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#8B5CF6' }}
                                                            />
                                                        </td>

                                                        {/* ADD */}
                                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                                            {m.hasActions ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!priv.add}
                                                                    onChange={() => togglePrivilege(m.id, 'add')}
                                                                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#8B5CF6' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                            )}
                                                        </td>

                                                        {/* EDIT */}
                                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                                            {m.hasActions ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!priv.edit}
                                                                    onChange={() => togglePrivilege(m.id, 'edit')}
                                                                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#8B5CF6' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                            )}
                                                        </td>

                                                        {/* DELETE */}
                                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                                            {(m.hasActions || m.hasDelete) ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!priv.delete}
                                                                    onChange={() => togglePrivilege(m.id, 'delete')}
                                                                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#8B5CF6' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </form>

                        <div className="hyper-footer" style={{ padding: '1rem 1.5rem', background: 'var(--bg-btn-ghost)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" className="hyper-btn btn-ghost-dark" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="hyper-btn btn-purple-neon" onClick={handleSave}>
                                <Check size={16} /> Save User Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
