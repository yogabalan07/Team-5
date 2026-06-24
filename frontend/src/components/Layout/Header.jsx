import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <h2 className="header-title">Inventory System</h2>
                </div>
                <div className="header-right">
                    <span className="user-info">Welcome, {user?.username}</span>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
