import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const CustomSidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    if (!isOpen) return null;

    return (
        <div
            className="position-fixed top-0 start-0 h-100 py-4 px-3"
            style={{
                width: '260px',
                backgroundColor: 'var(--paw-bg-card)',
                borderRight: '1px solid var(--paw-border)',
                zIndex: 1040,
                transition: 'var(--paw-transition)',
                marginTop: '73px', // Height of Navbar
            }}
        >
            <div className="d-flex flex-column h-100">
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--paw-border)' }}>
                    <div className="fw-bold text-white fs-5">{user?.name || 'PawConnect User'}</div>
                    <div className="text-secondary fs-7">{user?.email || 'user@pawconnect.org'}</div>
                    <div className="badge mt-2" style={{ backgroundColor: 'var(--paw-primary)', fontSize: '0.75rem' }}>
                        {user?.role || 'USER'} Workspace
                    </div>
                </div>

                <Nav className="flex-column gap-2">
                    <Nav.Link as={NavLink} to="/dashboard" end className="text-white hover-orange py-2 px-3 rounded d-flex align-items-center">
                        <span className="me-2">📁</span> Dashboard Overview
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/create-pet" className="text-white hover-orange py-2 px-3 rounded d-flex align-items-center">
                        <span className="me-2">🐾</span> List New Pet
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/chat" className="text-white hover-orange py-2 px-3 rounded d-flex align-items-center">
                        <span className="me-2">💬</span> Conversations
                    </Nav.Link>
                    {user?.role === 'ADMIN' && (
                        <Nav.Link as={NavLink} to="/admin" className="text-white hover-orange py-2 px-3 rounded d-flex align-items-center mt-3" style={{ borderTop: '1px solid var(--paw-border)', paddingTop: '15px' }}>
                            <span className="me-2">🛡️</span> Moderator Panel
                        </Nav.Link>
                    )}
                </Nav>

                <div className="mt-auto fs-8 text-secondary text-center">
                    Workspace Version 1.0.0
                </div>
            </div>
        </div>
    );
};

export default CustomSidebar;
