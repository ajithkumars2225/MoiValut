// ─── MoiVault User Manager ───────────────────────────────────────────────────
// Manages user accounts and privileges stored in localStorage
// Key: moivault_users
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'moivault_users';

export const ALL_MODULES = [
    { id: 'dashboard',  label: 'Dashboard (டாஷ்போர்டு)',      hasActions: false },
    { id: 'events',     label: 'Events (நிகழ்வுகள்)',          hasActions: true  },
    { id: 'moi',        label: 'Moi Entry (வந்த பணம்)',        hasActions: true  },
    { id: 'given_moi',  label: 'Given Moi (செய்த மொய்)',       hasActions: true  },
    { id: 'conflicts',  label: 'Conflict Records (முரண்பாடு)', hasActions: false, hasDelete: true },
    { id: 'gold',       label: 'Gold Entry (பொன்/நகை)',        hasActions: true  },
    { id: 'reports',    label: 'Audit Log (தணிக்கை அறிக்கை)',  hasActions: false, hasDelete: true },
    { id: 'settings',   label: 'Settings (அமைப்புகள்)',        hasActions: false },
];

/** Full privilege set for Admin */
const ADMIN_PRIVILEGES = Object.fromEntries(
    ALL_MODULES.map((m) => [
        m.id,
        { view: true, add: true, edit: true, delete: true },
    ])
);
// Admin always sees Users page too
ADMIN_PRIVILEGES.users = { view: true };

/** Build an empty (all-false) privilege object */
export const buildEmptyPrivileges = () =>
    Object.fromEntries(
        ALL_MODULES.map((m) => [m.id, { view: false, add: false, edit: false, delete: false }])
    );

/** Load users from localStorage */
const loadUsers = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

/** Save users to localStorage */
const saveUsers = (users) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

/** Generate a simple unique ID */
const uid = () => `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** Get all users (excluding admin placeholder) */
export const getUsers = () => loadUsers();

/** Create a new user */
export const createUser = (username, password, privileges, fullName = '') => {
    const users = loadUsers();
    const exists = users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (exists) throw new Error('Username already exists');
    const newUser = {
        id: uid(),
        username: username.trim(),
        fullName: fullName.trim(),
        password, // plain text — acceptable for local app
        privileges,
        createdAt: new Date().toISOString(),
        isActive: true,
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
};

/** Update an existing user */
export const updateUser = (id, data) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data };
    saveUsers(users);
    return users[idx];
};

/** Delete a user by id */
export const deleteUser = (id) => {
    const users = loadUsers().filter((u) => u.id !== id);
    saveUsers(users);
};

/**
 * Validate login credentials.
 * Returns user object (with privileges) on success, null on failure.
 * Built-in Admin is hardcoded and always has full privileges.
 */
export const validateLogin = (username, password) => {
    // Built-in Admin
    if (username === 'Admin' && password === 'Admin@123') {
        return {
            id: 'admin',
            username: 'Admin',
            fullName: 'System Administrator',
            role: 'admin',
            privileges: ADMIN_PRIVILEGES,
        };
    }
    // Regular users
    const users = loadUsers();
    const user = users.find(
        (u) =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.password === password &&
            u.isActive !== false
    );
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        role: 'user',
        privileges: user.privileges,
    };
};

/** Get the current logged-in user from sessionStorage */
export const getCurrentUser = () => {
    try {
        const raw = sessionStorage.getItem('moivault_current_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/** Persist the current user to sessionStorage */
export const setCurrentUser = (user) => {
    sessionStorage.setItem('moivault_current_user', JSON.stringify(user));
};

/** Clear session */
export const clearCurrentUser = () => {
    sessionStorage.removeItem('moivault_current_user');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedInUser');
};

/** Check if a user has a specific privilege */
export const can = (user, module, action = 'view') => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.privileges?.[module]?.[action] === true;
};
