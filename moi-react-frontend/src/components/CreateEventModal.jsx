import React, { useState } from 'react';
import { X, Calendar, MapPin, Sparkles, Plus } from 'lucide-react';
import { TransliteratedInput } from './TransliteratedInput';

export const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
    const [name, setName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');

        try {
            await onEventCreated({
                name: name.trim(),
                eventDate: eventDate || null,
                location: location.trim() || null,
            });
            setName('');
            setEventDate('');
            setLocation('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop-blur">
            <div className="modern-modal-card scale-in">
                {/* Header */}
                <div className="modal-header-gradient purple-gradient">
                    <div className="modal-title-wrap">
                        <div className="icon-glow-bg">
                            <Sparkles size={22} className="text-gold" />
                        </div>
                        <div>
                            <h3>Create New Event (புதிய நிகழ்வு)</h3>
                            <p className="modal-subtitle">Setup a new wedding, function or ceremony collection</p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="modal-form-body">
                    {error && <div className="modern-alert alert-error">{error}</div>}

                    <div className="form-group">
                        <label>Event Name (நிகழ்வின் பெயர்) *</label>
                        <TransliteratedInput
                            value={name}
                            onChange={setName}
                            placeholder="e.g. Karthik & Priya Wedding"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={15} /> Date (தேதி)</label>
                            <input
                                type="date"
                                className="modern-control"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label><MapPin size={15} /> Location (இடம்)</label>
                            <TransliteratedInput
                                value={location}
                                onChange={setLocation}
                                placeholder="e.g. Chennai / Madurai"
                            />
                        </div>
                    </div>

                    <div className="modal-actions-footer">
                        <button type="button" className="modern-btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="modern-btn btn-gradient-purple" disabled={loading}>
                            {loading ? 'Creating...' : <><Plus size={18} /> Create Event</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
