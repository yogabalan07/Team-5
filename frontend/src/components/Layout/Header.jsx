import React from 'react';
import { FaBars, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header style={{
            height: '64px',
            background: 'white',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                    onClick={toggleSidebar}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        marginRight: '16px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <FaBars />
                </button>
                <h3 style={{ margin: 0, color: '#333' }}>Inventory Dashboard</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                    <FaUser style={{ marginRight: '8px' }} />
                    {user?.username || 'User'}
                </span>
            </div>
        </header>
    );
};

export default Header;