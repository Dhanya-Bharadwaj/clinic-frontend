// src/components/AdminButton.jsx
import React, { useState } from 'react';
import { FaUserMd } from 'react-icons/fa';
import '../styles/AdminButton.css';

const AdminButton = ({ onAdminAccess }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === 'Dr1234') {
            setShowPasswordModal(false);
            setPassword('');
            setError('');
            onAdminAccess(true);
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="admin-access-container">
            <div 
                className="admin-button"
                onClick={() => setShowPasswordModal(true)}
                title="Admin Access"
            >
                <FaUserMd />
                <span className="admin-tooltip">Admin</span>
            </div>

            {showPasswordModal && (
                <div className="password-modal-backdrop">
                    <div className="password-modal">
                        <h3>Admin Access</h3>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label>Enter Password:</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <div className="modal-buttons">
                                <button type="submit">Login</button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPassword('');
                                        setError('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminButton;