import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomNavbar from '../components/layout/Navbar';
import CustomSidebar from '../components/layout/Sidebar';
import CustomFooter from '../components/layout/Footer';

export const RootLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-black text-white">
            {/* Global Header Navigation */}
            <CustomNavbar onToggleSidebar={toggleSidebar} />

            {/* Floating collapsible workspace sidebar */}
            <CustomSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <main
                className="flex-grow-1 py-4"
                style={{
                    marginLeft: sidebarOpen ? '260px' : '0px',
                    transition: 'margin-left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
            >
                <Outlet />
            </main>

            {/* Global Footer */}
            <CustomFooter />
        </div>
    );
};

export default RootLayout;
