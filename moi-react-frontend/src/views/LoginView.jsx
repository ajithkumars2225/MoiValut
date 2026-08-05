import React, { useState } from 'react';
import { Lock, User, Key, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { validateLogin, setCurrentUser } from '../services/userManager';

export const LoginView = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Small delay for UX feel
        setTimeout(() => {
            const user = validateLogin(username.trim(), password);
            if (user) {
                setCurrentUser(user);
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('loggedInUser', user.username);
                onLoginSuccess(user);
            } else {
                setError('தவறான பயனர் பெயர் அல்லது கடவுச்சொல். / Invalid username or password.');
                setPassword('');
            }
            setLoading(false);
        }, 400);
    };

    return (
        <div className="login-portal-backdrop">
            <div className="login-portal-card spring-popup">
                {/* Header */}
                <div className="login-portal-header">
                    <div className="login-portal-icon-bg">
                        <Lock size={30} className="text-purple" />
                    </div>
                    <span className="login-portal-badge font-tamil">
                        <Sparkles size={13} /> உள்நுழைவு (Login Portal)
                    </span>
                    <h2>MoiVault Login</h2>
                    <p className="login-portal-subtitle">
                        Enter your credentials to access MoiVault
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-portal-form">
                    {error && (
                        <div className="login-portal-error">
                            <AlertCircle size={17} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="login-portal-field">
                        <label className="login-portal-label">பயனர் பெயர் / Username</label>
                        <div className="login-portal-input-wrap">
                            <User size={18} className="login-portal-input-icon" />
                            <input
                                type="text"
                                className="login-portal-input"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="login-portal-field">
                        <label className="login-portal-label">கடவுச்சொல் / Password</label>
                        <div className="login-portal-input-wrap">
                            <Key size={18} className="login-portal-input-icon" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="login-portal-input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((p) => !p)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-portal-submit-btn"
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        <span>{loading ? 'Logging in...' : 'Secure Login'}</span>
                        <ArrowRight size={19} />
                    </button>
                </form>

                <div className="login-portal-footer">
                    <ShieldCheck size={15} /> Encrypted Session • MoiVault Management System
                </div>
            </div>
        </div>
    );
};
