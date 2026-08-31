import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar, Container, Nav, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

export const CustomNavbar = ({ onToggleSidebar }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    // Chat unread count
    const [chatUnread, setChatUnread] = useState(0);

    const fetchChatUnread = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/chats/unread-count');
            setChatUnread(data.unreadCount || 0);
        } catch (_) { }
    }, [isAuthenticated]);

    // Fetch unread chat count on auth
    useEffect(() => {
        fetchChatUnread();
    }, [fetchChatUnread]);

    // Join the user's notification room on socket connect
    useEffect(() => {
        if (socket && user) {
            socket.emit('join_user_notifications', user.id);

            const handleNotification = (payload) => {
                setNotifications(prev => [
                    { ...payload, id: Date.now(), read: false, timestamp: new Date() },
                    ...prev
                ].slice(0, 20)); // keep latest 20 max
            };

            const handleUnreadUpdated = () => {
                fetchChatUnread();
            };

            socket.on('adoption_notification', handleNotification);
            socket.on('unread_count_updated', handleUnreadUpdated);

            return () => {
                socket.off('adoption_notification', handleNotification);
                socket.off('unread_count_updated', handleUnreadUpdated);
            };
        }
    }, [socket, user, fetchChatUnread]);

    // Close dropdown on outside click
    useEffect(() => {
        const handle = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotifClick = (notif) => {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setShowNotifications(false);
        navigate('/dashboard');
    };

    const clearAll = () => {
        setNotifications([]);
        setShowNotifications(false);
    };

    const avatarUrl = user?.profilePicture?.url;
    const avatarInitials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const getNotifIcon = (type) => {
        switch (type) {
            case 'NEW_REQUEST': return '📩';
            case 'REQUEST_APPROVED': return '🎉';
            case 'REQUEST_REJECTED': return '❌';
            case 'REQUEST_CANCELLED': return '🚫';
            case 'STATUS_UPDATED': return '🔄';
            case 'INTERVIEW_SCHEDULED': return '📅';
            default: return '🔔';
        }
    };

    const timeAgo = (date) => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <Navbar expand="lg" variant="dark" className="paw-navbar py-3 sticky-top">
            <Container>
                {/* Sidebar Trigger */}
                {isAuthenticated && (
                    <Button
                        variant="link"
                        className="text-white p-0 me-3 d-flex align-items-center"
                        onClick={onToggleSidebar}
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="d-flex flex-column justify-content-between" style={{ width: '20px', height: '12px' }}>
                            <span style={{ height: '2px', width: '20px', backgroundColor: '#fff', borderRadius: '1px' }}></span>
                            <span style={{ height: '2px', width: '20px', backgroundColor: '#fff', borderRadius: '1px' }}></span>
                        </div>
                    </Button>
                )}

                {/* Brand Logo */}
                <Navbar.Brand as={Link} to="/" className="paw-accent-header fs-3 me-auto d-flex align-items-center">
                    paw<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="paw-navbar-nav" />

                <Navbar.Collapse id="paw-navbar-nav" className="justify-content-center">
                    <Nav className="mx-auto fs-6">
                        <Nav.Link as={NavLink} to="/" end className="paw-nav-link">Inspiration</Nav.Link>
                        <Nav.Link as={NavLink} to="/browse" className="paw-nav-link">Browse</Nav.Link>
                        <Nav.Link as={NavLink} to="/chat" className="paw-nav-link">Adoptions</Nav.Link>
                        <Nav.Link as={NavLink} to="/contact" className="paw-nav-link">Contact</Nav.Link>
                    </Nav>

                    <Nav className="ms-auto align-items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                {/* Notification Bell */}
                                <div className="position-relative" ref={notifRef}>
                                    <Button
                                        variant="link"
                                        className="text-white p-0 position-relative me-2"
                                        onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead(); }}
                                        style={{ textDecoration: 'none', fontSize: '1.3rem' }}
                                        id="notification-bell"
                                    >
                                        🔔
                                        {unreadCount > 0 && (
                                            <Badge
                                                bg="danger"
                                                pill
                                                className="position-absolute"
                                                style={{ top: '-4px', right: '-8px', fontSize: '0.6rem' }}
                                            >
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </Badge>
                                        )}
                                    </Button>

                                    {showNotifications && (
                                        <div
                                            className="position-absolute end-0 mt-2 shadow-lg"
                                            style={{
                                                width: '360px',
                                                maxHeight: '420px',
                                                overflowY: 'auto',
                                                background: '#1a1a2e',
                                                border: '1px solid var(--paw-border)',
                                                borderRadius: '12px',
                                                zIndex: 1050,
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ borderColor: 'var(--paw-border)' }}>
                                                <span className="text-white fw-semibold small">Notifications</span>
                                                {notifications.length > 0 && (
                                                    <Button variant="link" className="text-secondary p-0" style={{ fontSize: '0.75rem', textDecoration: 'none' }} onClick={clearAll}>
                                                        Clear all
                                                    </Button>
                                                )}
                                            </div>
                                            {notifications.length === 0 ? (
                                                <div className="text-center py-4 text-secondary small">
                                                    <div style={{ fontSize: '2rem' }}>🔕</div>
                                                    <p className="mb-0 mt-2">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        className="px-3 py-2 border-bottom d-flex align-items-start gap-2"
                                                        style={{
                                                            borderColor: 'var(--paw-border)',
                                                            cursor: 'pointer',
                                                            backgroundColor: notif.read ? 'transparent' : 'rgba(255, 159, 28, 0.05)',
                                                            transition: 'background-color 0.2s',
                                                        }}
                                                        onClick={() => handleNotifClick(notif)}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'rgba(255, 159, 28, 0.05)'}
                                                    >
                                                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{getNotifIcon(notif.type)}</span>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <div className="text-white small" style={{ lineHeight: 1.4 }}>{notif.message}</div>
                                                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{timeAgo(notif.timestamp)}</div>
                                                        </div>
                                                        {!notif.read && (
                                                            <span
                                                                className="rounded-circle flex-shrink-0 mt-1"
                                                                style={{ width: '8px', height: '8px', backgroundColor: 'var(--paw-primary)', display: 'inline-block' }}
                                                            />
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Chat Icon with unread badge */}
                                <Nav.Link as={Link} to="/chat" className="text-white p-0 position-relative me-1" style={{ fontSize: '1.3rem', textDecoration: 'none' }} id="chat-nav-icon">
                                    💬
                                    {chatUnread > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{ top: '-4px', right: '-8px', fontSize: '0.6rem' }}
                                        >
                                            {chatUnread > 9 ? '9+' : chatUnread}
                                        </Badge>
                                    )}
                                </Nav.Link>

                                <Nav.Link as={Link} to="/dashboard" className="text-white">
                                    Dashboard
                                </Nav.Link>

                                {/* Avatar Dropdown */}
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        as="button"
                                        className="border-0 bg-transparent p-0"
                                        id="user-avatar-dropdown"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="avatar"
                                                className="rounded-circle"
                                                style={{ width: '36px', height: '36px', objectFit: 'cover', border: '2px solid var(--paw-primary)' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                                style={{
                                                    width: '36px', height: '36px', fontSize: '13px',
                                                    background: 'linear-gradient(135deg, var(--paw-primary), #a855f7)',
                                                    border: '2px solid var(--paw-primary)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {avatarInitials}
                                            </div>
                                        )}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu
                                        style={{ background: '#1a1a2e', border: '1px solid var(--paw-border)', minWidth: '200px' }}
                                    >
                                        <div className="px-3 py-2 border-bottom" style={{ borderColor: 'var(--paw-border) !important' }}>
                                            <div className="text-white fw-semibold small">{user?.name}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
                                        </div>
                                        <Dropdown.Item as={Link} to="/profile" className="text-secondary py-2">
                                            👤 My Profile
                                        </Dropdown.Item>
                                        <Dropdown.Item as={Link} to="/dashboard" className="text-secondary py-2">
                                            🏠 Dashboard
                                        </Dropdown.Item>
                                        {user?.role === 'ADMIN' && (
                                            <Dropdown.Item as={Link} to="/admin" className="text-secondary py-2">
                                                ⚙️ Admin Panel
                                            </Dropdown.Item>
                                        )}
                                        <Dropdown.Divider style={{ borderColor: 'var(--paw-border)' }} />
                                        <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                                            🚪 Sign Out
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login" className="text-white me-1">Sign In</Nav.Link>
                                <Button as={Link} to="/register" className="btn-paw-primary btn-sm">Join Free</Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default CustomNavbar;
