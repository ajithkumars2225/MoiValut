import React from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export const CustomPopup = ({ type, title, message, onConfirm, onCancel }) => {
    return (
        <div className="custom-popup-overlay">
            <div className="custom-popup-card">
                <button className="popup-close-btn" onClick={onCancel}>
                    <X size={16} />
                </button>
                
                <div className="popup-header-icon-wrap">
                    {type === 'confirm' ? (
                        <div className="popup-icon-bg confirm-icon">
                            <HelpCircle size={28} />
                        </div>
                    ) : (
                        <div className="popup-icon-bg alert-icon">
                            <AlertTriangle size={28} />
                        </div>
                    )}
                </div>

                <div className="popup-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="popup-actions">
                    {type === 'confirm' && (
                        <button className="modern-btn btn-popup-cancel" onClick={onCancel}>
                            Cancel (ரத்து)
                        </button>
                    )}
                    <button 
                        className={`modern-btn ${type === 'confirm' ? 'btn-popup-confirm' : 'btn-popup-ok'}`} 
                        onClick={onConfirm}
                    >
                        OK (சரி)
                    </button>
                </div>
            </div>
        </div>
    );
};
