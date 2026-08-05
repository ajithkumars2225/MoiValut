import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Sparkles, Plus, Check, ShieldCheck, Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { TransliteratedInput } from '../TransliteratedInput';

export const EventModal = ({ isOpen, onClose, onSave, editingEvent }) => {
    const [name, setName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [invitationImage, setInvitationImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editingEvent) {
            setName(editingEvent.name || '');
            setEventDate(editingEvent.eventDate || '');
            setLocation(editingEvent.location || '');
            setInvitationImage(editingEvent.invitationImage || '');
        } else {
            setName('');
            setEventDate('');
            setLocation('');
            setInvitationImage('');
        }
        setError('');
    }, [editingEvent, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Image file size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setInvitationImage(reader.result);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setInvitationImage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');

        try {
            const data = {
                name: name.trim(),
                eventDate: eventDate || null,
                location: location.trim() || null,
                invitationImage: invitationImage || null,
            };

            await onSave(data, editingEvent?.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hyper-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="hyper-modal-card spring-popup purple-glow">
                {/* Header */}
                <div className="hyper-header purple-theme">
                    <div className="hyper-title-group">
                        <div className="hyper-icon-box glow-purple">
                            <Sparkles size={24} className="sparkle-active text-gold" />
                        </div>
                        <div>
                            <span className="hyper-tag font-tamil">நிகழ்வு மேலாண்மை</span>
                            <h3>{editingEvent ? 'Edit Event Details' : 'Create New Event'}</h3>
                        </div>
                    </div>
                    <button className="hyper-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="hyper-body">
                    {error && <div className="hyper-alert alert-danger">{error}</div>}

                    <div className="hyper-field">
                        <label className="field-label">
                            Event Name (நிகழ்வின் பெயர்) <span className="req">*</span>
                        </label>
                        <TransliteratedInput
                            value={name}
                            onChange={setName}
                            placeholder="e.g. Karthik & Priya Wedding..."
                            className="hyper-input"
                            required
                        />
                    </div>

                    <div className="hyper-row-2">
                        <div className="hyper-field">
                            <label className="field-label flex-align">
                                <Calendar size={15} className="text-purple" /> Ceremony Date
                            </label>
                            <input
                                type="date"
                                className="hyper-input date-input"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>

                        <div className="hyper-field">
                            <label className="field-label flex-align">
                                <MapPin size={15} className="text-gold" /> Venue Location
                            </label>
                            <TransliteratedInput
                                value={location}
                                onChange={setLocation}
                                placeholder="e.g. Chennai..."
                                className="hyper-input"
                            />
                        </div>
                    </div>

                    {/* 🖼️ INVITATION CARD IMAGE UPLOAD OPTION 🖼️ */}
                    <div className="hyper-field">
                        <label className="field-label flex-align">
                            <ImageIcon size={15} className="text-purple" /> Invitation Card Image (பத்திரிகை படம்)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />

                        {invitationImage ? (
                            <div className="invitation-preview-card">
                                <img src={invitationImage} alt="Invitation Card" className="invitation-thumbnail" />
                                <div className="invitation-actions">
                                    <span className="invitation-file-tag">Invitation Saved</span>
                                    <button
                                        type="button"
                                        className="btn-remove-invitation"
                                        onClick={handleRemoveImage}
                                    >
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="invitation-dropzone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={24} className="text-purple mb-1" />
                                <span className="dropzone-title">Click to upload Invitation Card</span>
                                <span className="dropzone-subtitle">Supports JPG, PNG, WEBP (Max 5MB)</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="hyper-footer">
                        <button type="button" className="hyper-btn btn-ghost-dark" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="hyper-btn btn-purple-neon" disabled={loading}>
                            {loading ? 'Saving...' : editingEvent ? <><Check size={18} /> Update Event</> : <><Plus size={18} /> Create Event</>}
                        </button>
                    </div>
                </form>

                <div className="hyper-sub-footer">
                    <ShieldCheck size={14} /> Secured by PostgreSQL & .NET 9 Engine
                </div>
            </div>
        </div>
    );
};
