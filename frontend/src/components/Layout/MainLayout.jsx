import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/sidebar.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div>
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Header toggleSidebar={toggleSidebar} />
                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;