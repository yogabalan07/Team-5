import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaHome, 
    FaBox, 
    FaUsers, 
    FaTruck, 
    FaShoppingCart, 
    FaFileInvoice, 
    FaChartBar,
    FaSignOutAlt 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
        { path: '/items', icon: <FaBox />, label: 'Items' },
        { path: '/customers', icon: <FaUsers />, label: 'Customers' },
        { path: '/suppliers', icon: <FaTruck />, label: 'Suppliers' },
        { path: '/purchases', icon: <FaShoppingCart />, label: 'Purchases' },
        { path: '/sales', icon: <FaFileInvoice />, label: 'Sales' },
        { path: '/reports', icon: <FaChartBar />, label: 'Reports' },
    ];

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>📦 Inventory</h2>
                    <p style={{ fontSize: '12px', opacity: 0.7 }}>Management System</p>
                </div>
                <ul className="sidebar-menu">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink 
                                to={item.path} 
                                className={({ isActive }) => isActive ? 'active' : ''}
                                onClick={() => window.innerWidth <= 768 && toggleSidebar()}
                            >
                                <span className="icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
                <div className="sidebar-footer">
                    <NavLink to="#" onClick={logout}>
                        <span className="icon"><FaSignOutAlt /></span>
                        Logout
                    </NavLink>
                </div>
            </div>
        </>
    );
};

export default Sidebar;