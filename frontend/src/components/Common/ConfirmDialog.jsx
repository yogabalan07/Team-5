import React from 'react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h3 style={{ marginBottom: '10px' }}>{title || 'Confirm'}</h3>
                <p style={{ marginBottom: '20px', color: '#666' }}>{message || 'Are you sure?'}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 20px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 20px',
                            background: '#fc8181',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;