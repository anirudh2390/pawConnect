import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomNavbar from '../components/layout/Navbar';
import CustomSidebar from '../components/layout/Sidebar';
import CustomFooter from '../components/layout/Footer';
import FloatingAIChatbot from '../components/ui/FloatingAIChatbot';

export const RootLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Determine the background image based on the current route
    const bgImage = useMemo(() => {
        const path = location.pathname;
        if (path === '/' || path.startsWith('/pet/')) return '/images/bg_nature_landing.jpg';
        if (path === '/login' || path === '/register' || path === '/contact') return '/images/bg_nature_auth.jpg';
        if (path === '/browse') return '/images/bg_nature_browse.jpg';
        // Dashboard, admin, chat, etc.
        return '/images/bg_nature_dashboard.jpg';
    }, [location.pathname]);

    return (
        <div className="d-flex flex-column min-vh-100 text-white" style={{
            backgroundImage: `linear-gradient(rgba(13, 22, 17, 0.7), rgba(13, 22, 17, 0.9)), url('${bgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            transition: 'background-image 0.5s ease-in-out'
        }}>
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
            
            {/* Global AI Chatbot */}
            <FloatingAIChatbot />
        </div>
    );
};

export default RootLayout;
