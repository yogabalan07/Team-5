import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiBox, FiUsers, FiTruck, FiShoppingCart, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome },
        { path: '/items', label: 'Items', icon: FiBox },
        { path: '/customers', label: 'Customers', icon: FiUsers },
        { path: '/suppliers', label: 'Suppliers', icon: FiTruck },
        { path: '/purchases', label: 'Purchases', icon: FiShoppingCart },
        { path: '/sales', label: 'Sales', icon: FiTrendingUp },
        { path: '/reports', label: 'Reports', icon: FiBarChart2 }
    ];

    return (
        <>
            <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FiX /> : <FiMenu />}
            </button>
            <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
                <nav className="sidebar-nav">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <Icon className="nav-icon" />
                                {isOpen && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
