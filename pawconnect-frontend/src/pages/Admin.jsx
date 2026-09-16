import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Nav, Carousel } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ── Tiny SVG Donut Chart (no library needed) ─────────────────────────────────
const DonutChart = ({ segments, size = 140, strokeWidth = 22, label, subLabel }) => {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const cx = size / 2;
    const cy = size / 2;

    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    let offset = 0;

    return (
        <div className="d-flex align-items-center gap-4 flex-wrap">
            <svg width={size} height={size} style={{ flexShrink: 0 }}>
                {/* background track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} />
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circumference;
                    const gap = circumference - dash;
                    const rotation = (offset / total) * 360 - 90;
                    offset += seg.value;
                    return (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={0}
                            transform={`rotate(${rotation} ${cx} ${cy})`}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                    );
                })}
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">{label}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#888" fontSize="11">{subLabel}</text>
            </svg>
            <div className="d-flex flex-column gap-2">
                {segments.map((seg, i) => (
                    <div key={i} className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: seg.color, display: 'inline-block', flexShrink: 0 }} />
                        <span className="text-secondary" style={{ fontSize: '0.78rem' }}>{seg.label}</span>
                        <span className="text-white fw-semibold ms-1" style={{ fontSize: '0.78rem' }}>{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Bar Chart (pure SVG) ─────────────────────────────────────────────────────
const BarChart = ({ bars, height = 120 }) => {
    const max = Math.max(...bars.map(b => b.value), 1);
    const barW = 36;
    const gap = 16;
    const width = bars.length * (barW + gap) + gap;

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height + 40}`} style={{ overflow: 'visible' }}>
            {bars.map((b, i) => {
                const bh = Math.max((b.value / max) * height, 4);
                const x = gap + i * (barW + gap);
                const y = height - bh;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={bh} rx={5} fill={b.color || 'var(--paw-primary)'} opacity={0.85} />
                        <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{b.value}</text>
                        <text x={x + barW / 2} y={height + 18} textAnchor="middle" fill="#888" fontSize="10">{b.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
    <Card className="paw-card p-4 text-center h-100">
        <div className="text-secondary small mb-1">{label}</div>
        <div className="fw-bold" style={{ fontSize: '2rem', color: accent || '#fff' }}>{value ?? '—'}</div>
    </Card>
);

// ─────────────────────────────────────────────────────────────────────────────

export const Admin = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Pet state
    const [allPets, setAllPets] = useState([]);
    const [pendingPets, setPendingPets] = useState([]);
    const [petStats, setPetStats] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // User state
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [targetUser, setTargetUser] = useState(null);

    // Report state
    const [reports, setReports] = useState([]);
    const [reportStats, setReportStats] = useState(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportFilter, setReportFilter] = useState('');
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [targetReport, setTargetReport] = useState(null);
    const [resolveAction, setResolveAction] = useState('Resolved');
    const [resolutionNote, setResolutionNote] = useState('');

    // Tabs: 'overview' | 'pending' | 'all' | 'users' | 'reports'
    const [activeTab, setActiveTab] = useState('overview');

    // ── Guard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            window.location.href = '/dashboard';
            return;
        }
        fetchAdminData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ── Lazy-load on tab switch ────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'reports') fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // ── Loaders ────────────────────────────────────────────────────────────
    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [statsRes, pendingRes, allRes, userStatsRes] = await Promise.all([
                api.get('/admin/pets/stats'),
                api.get('/admin/pets/pending'),
                api.get('/admin/pets'),
                api.get('/admin/users/stats'),
            ]);
            if (statsRes.data?.status === 'success') setPetStats(statsRes.data.stats);
            if (pendingRes.data?.status === 'success') setPendingPets(pendingRes.data.pets || []);
            if (allRes.data?.status === 'success') setAllPets(allRes.data.pets || []);
            if (userStatsRes.data?.status === 'success') setUserStats(userStatsRes.data.stats);
        } catch {
            setError('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const res = await api.get('/admin/users');
            if (res.data?.status === 'success') setUsers(res.data.users || []);
        } catch {
            setError('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchReports = useCallback(async () => {
        try {
            setReportsLoading(true);
            const [repRes, statsRes] = await Promise.all([
                api.get('/admin/reports'),
                api.get('/admin/reports/stats'),
            ]);
            if (repRes.data?.status === 'success') setReports(repRes.data.reports || []);
            if (statsRes.data?.status === 'success') setReportStats(statsRes.data.stats);
        } catch {
            setError('Failed to load reports');
        } finally {
            setReportsLoading(false);
        }
    }, []);

    // ── Pet handlers ───────────────────────────────────────────────────────
    const handleApprovePet = async (petId) => {
        try {
            const res = await api.put(`/admin/pets/${petId}/approve`);
            if (res.data?.status === 'success') {
                setSuccess('Pet listing approved!');
                setPendingPets(prev => prev.filter(p => p._id !== petId));
                setAllPets(prev => prev.map(p => p._id === petId ? { ...p, status: 'Approved' } : p));
                setShowDetailModal(false);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch { setError('Failed to approve listing'); }
    };

    const handleRejectPet = async (petId) => {
        if (!rejectReason.trim()) { setError('Please provide a rejection reason'); return; }
        try {
            const res = await api.put(`/admin/pets/${petId}/reject`, { reason: rejectReason });
            if (res.data?.status === 'success') {
                setSuccess('Pet listing rejected.');
                setPendingPets(prev => prev.filter(p => p._id !== petId));
                setAllPets(prev => prev.map(p => p._id === petId ? { ...p, status: 'Rejected' } : p));
                setShowDetailModal(false);
                setRejectReason('');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch { setError('Failed to reject listing'); }
    };

    const handleMarkAdopted = async (petId) => {
        try {
            const res = await api.put(`/admin/pets/${petId}/adopted`);
            if (res.data?.status === 'success') {
                setSuccess('Pet marked as adopted!');
                setAllPets(prev => prev.map(p => p._id === petId ? { ...p, status: 'Adopted' } : p));
                setShowDetailModal(false);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch { setError('Failed to mark as adopted'); }
    };

    const handleOpenDetail = (pet) => {
        setSelectedPet(pet);
        setShowDetailModal(true);
        setRejectReason('');
    };

    // ── User handlers ──────────────────────────────────────────────────────
    const handleBanToggle = async (uid, currentBanStatus) => {
        try {
            const res = await api.patch(`/admin/users/${uid}/ban`, { isBanned: !currentBanStatus });
            if (res.data?.status === 'success') {
                setUsers(prev => prev.map(u => u._id === uid ? { ...u, isBanned: !currentBanStatus } : u));
                setSuccess(currentBanStatus ? 'User unblocked.' : 'User blocked.');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update ban status');
        }
    };

    const handleDeleteUser = async () => {
        if (!targetUser) return;
        try {
            const res = await api.delete(`/admin/users/${targetUser._id}`);
            if (res.data?.status === 'success') {
                setUsers(prev => prev.filter(u => u._id !== targetUser._id));
                setSuccess('User deleted.');
                setShowDeleteModal(false);
                setTargetUser(null);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
            setShowDeleteModal(false);
        }
    };

    // ── Report handlers ────────────────────────────────────────────────────
    const openResolveModal = (report, action) => {
        setTargetReport(report);
        setResolveAction(action);
        setResolutionNote('');
        setShowResolveModal(true);
    };

    const handleResolveReport = async () => {
        if (!targetReport) return;
        try {
            const res = await api.patch(`/admin/reports/${targetReport._id}/resolve`, {
                resolution: resolveAction,
                resolutionNote,
            });
            if (res.data?.status === 'success') {
                setReports(prev => prev.map(r => r._id === targetReport._id ? { ...r, status: resolveAction } : r));
                setSuccess(`Report ${resolveAction.toLowerCase()}.`);
                setShowResolveModal(false);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resolve report');
        }
    };

    const handleDeleteReport = async (reportId) => {
        try {
            await api.delete(`/admin/reports/${reportId}`);
            setReports(prev => prev.filter(r => r._id !== reportId));
            setSuccess('Report deleted.');
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError('Failed to delete report');
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────
    const getStatusBadge = (status) => {
        const v = { Pending: 'warning', Approved: 'success', Rejected: 'danger', Adopted: 'info', Draft: 'secondary' };
        return <Badge bg={v[status] || 'secondary'}>{status}</Badge>;
    };

    const getReportStatusBadge = (status) => {
        const v = { Open: 'warning', Resolved: 'success', Dismissed: 'secondary' };
        return <Badge bg={v[status] || 'secondary'}>{status}</Badge>;
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredReports = reportFilter
        ? reports.filter(r => r.status === reportFilter)
        : reports;

    const displayPets = activeTab === 'pending' ? pendingPets : allPets;

    // ── Chart data ─────────────────────────────────────────────────────────
    const listingDonutSegments = petStats ? [
        { label: 'Pending', value: petStats.pendingListings, color: '#f5a623' },
        { label: 'Approved', value: petStats.approvedListings, color: '#28a745' },
        { label: 'Rejected', value: petStats.rejectedListings, color: '#dc3545' },
        { label: 'Adopted', value: petStats.adoptedListings, color: '#17a2b8' },
    ] : [];

    const userBarData = userStats ? [
        { label: 'Active', value: userStats.activeUsers || 0, color: '#28a745' },
        { label: 'Banned', value: userStats.bannedUsers || 0, color: '#dc3545' },
        { label: 'Admins', value: userStats.adminUsers || 0, color: '#f5a623' },
    ] : [];

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" style={{ color: 'var(--paw-primary)' }} />
                <p className="text-secondary mt-3">Loading admin data…</p>
            </Container>
        );
    }

    // ── Tab button helper ──────────────────────────────────────────────────
    const TabBtn = ({ id, label, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`btn btn-sm ${activeTab === id ? 'btn-paw-primary' : 'btn-outline-secondary'} mx-1 mb-2`}
        >
            {label}{count !== undefined ? ` (${count})` : ''}
        </button>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ── Admin Sidebar ── */}
            <aside
                className="d-none d-lg-flex flex-column py-4 px-3"
                style={{
                    width: '220px',
                    flexShrink: 0,
                    backgroundColor: '#0f0f0f',
                    borderRight: '1px solid var(--paw-border)',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflowY: 'auto',
                }}
            >
                <div className="mb-4">
                    <div className="text-secondary" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Panel</div>
                    <div className="text-white fw-bold mt-1" style={{ fontSize: '0.95rem' }}>paw<span style={{ color: 'var(--paw-primary)' }}>.</span></div>
                </div>

                <Nav className="flex-column gap-1">
                    {[
                        { id: 'overview', label: '📊 Overview' },
                        { id: 'pending', label: '⏳ Pending Review', badge: pendingPets.length },
                        { id: 'all', label: '🐾 All Listings' },
                        { id: 'users', label: '👤 Users' },
                        { id: 'reports', label: '🚩 Reports' },
                    ].map(({ id, label, badge }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className="btn btn-sm text-start w-100"
                            style={{
                                color: activeTab === id ? 'var(--paw-primary)' : '#888',
                                backgroundColor: activeTab === id ? 'rgba(224,122,47,0.1)' : 'transparent',
                                border: activeTab === id ? '1px solid rgba(224,122,47,0.3)' : '1px solid transparent',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '0.85rem',
                            }}
                        >
                            {label}
                            {badge > 0 && (
                                <Badge bg="danger" pill className="ms-2" style={{ fontSize: '0.68rem' }}>{badge}</Badge>
                            )}
                        </button>
                    ))}
                </Nav>

                <div className="mt-auto pt-4">
                    <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Logged in as</div>
                    <div className="text-white fw-semibold small mt-1">{user?.name}</div>
                    <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-grow-1 py-4 px-3 px-md-4">

                {/* Mobile tab row */}
                <div className="d-lg-none mb-3" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    <TabBtn id="overview" label="📊 Overview" />
                    <TabBtn id="pending" label="⏳ Pending" count={pendingPets.length} />
                    <TabBtn id="all" label="🐾 All Listings" />
                    <TabBtn id="users" label="👤 Users" />
                    <TabBtn id="reports" label="🚩 Reports" />
                </div>

                <div className="mb-4">
                    <h1 className="fw-bold paw-accent-header text-white display-6">
                        {activeTab === 'overview' && <>platform overview<span style={{ color: 'var(--paw-primary)' }}>.</span></>}
                        {activeTab === 'pending' && <>pending review<span style={{ color: 'var(--paw-primary)' }}>.</span></>}
                        {activeTab === 'all' && <>all listings<span style={{ color: 'var(--paw-primary)' }}>.</span></>}
                        {activeTab === 'users' && <>user management<span style={{ color: 'var(--paw-primary)' }}>.</span></>}
                        {activeTab === 'reports' && <>report management<span style={{ color: 'var(--paw-primary)' }}>.</span></>}
                    </h1>
                </div>

                {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {/* ══ OVERVIEW TAB ══ */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Row 1 — Listings */}
                        <div className="mb-2">
                            <div className="text-secondary small mb-2" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Listings</div>
                            <Row className="g-3 mb-4">
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Total" value={petStats?.totalListings} accent="#fff" />
                                </Col>
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Pending" value={petStats?.pendingListings} accent="#f5a623" />
                                </Col>
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Approved" value={petStats?.approvedListings} accent="#28a745" />
                                </Col>
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Rejected" value={petStats?.rejectedListings} accent="#dc3545" />
                                </Col>
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Adopted" value={petStats?.adoptedListings} accent="#17a2b8" />
                                </Col>
                                <Col xs={6} md={4} lg={2}>
                                    <StatCard label="Open Reports" value={reportStats?.openReports ?? '—'} accent="#e25555" />
                                </Col>
                            </Row>
                        </div>

                        {/* Stats Row 2 — Users */}
                        <div className="mb-2">
                            <div className="text-secondary small mb-2" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Users</div>
                            <Row className="g-3 mb-5">
                                <Col xs={6} md={3}>
                                    <StatCard label="Total Users" value={userStats?.totalUsers} accent="#fff" />
                                </Col>
                                <Col xs={6} md={3}>
                                    <StatCard label="Active" value={userStats?.activeUsers} accent="#28a745" />
                                </Col>
                                <Col xs={6} md={3}>
                                    <StatCard label="Banned" value={userStats?.bannedUsers} accent="#dc3545" />
                                </Col>
                                <Col xs={6} md={3}>
                                    <StatCard label="Admins" value={userStats?.adminUsers} accent="#f5a623" />
                                </Col>
                            </Row>
                        </div>

                        {/* Charts Row */}
                        <Row className="g-4 mb-5">
                            <Col md={6}>
                                <Card className="paw-card p-4 h-100">
                                    <h6 className="text-white fw-bold mb-4">Listing Status Distribution</h6>
                                    {listingDonutSegments.length > 0 ? (
                                        <DonutChart
                                            segments={listingDonutSegments}
                                            label={petStats?.totalListings || 0}
                                            subLabel="total"
                                        />
                                    ) : (
                                        <p className="text-secondary small">No data yet.</p>
                                    )}
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="paw-card p-4 h-100">
                                    <h6 className="text-white fw-bold mb-4">User Overview</h6>
                                    {userBarData.length > 0 ? (
                                        <BarChart bars={userBarData} height={110} />
                                    ) : (
                                        <p className="text-secondary small">No data yet.</p>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Quick Actions */}
                        <Card className="paw-card p-4">
                            <h6 className="text-white fw-bold mb-3">Quick Actions</h6>
                            <div className="d-flex flex-wrap gap-2">
                                <Button className="btn-paw-primary btn-sm" onClick={() => setActiveTab('pending')}>
                                    Review Pending ({pendingPets.length})
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('users')}>
                                    Manage Users
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('reports')}>
                                    View Reports
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('all')}>
                                    All Listings
                                </Button>
                            </div>
                        </Card>
                    </>
                )}

                {/* ══ PET TABLES (pending / all) ══ */}
                {(activeTab === 'pending' || activeTab === 'all') && (
                    <Card className="paw-card p-4">
                        {displayPets.length === 0 ? (
                            <Alert variant="info">No listings to display.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table responsive variant="dark" hover className="align-middle m-0">
                                    <thead>
                                        <tr style={{ borderColor: 'var(--paw-border)' }}>
                                            <th>Pet</th>
                                            <th>Type / Breed</th>
                                            <th>Lister</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayPets.map(pet => (
                                            <tr key={pet._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {pet.imageUrls?.[0] && (
                                                            <img
                                                                src={pet.imageUrls[0]}
                                                                alt={pet.name}
                                                                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <strong className="text-white">{pet.name}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-white small">{pet.type}</div>
                                                    <div className="text-secondary small">{pet.breed}</div>
                                                </td>
                                                <td>
                                                    <div className="text-white small">{pet.listerId?.name}</div>
                                                    <div className="text-secondary small">{pet.listerId?.email}</div>
                                                </td>
                                                <td>{getStatusBadge(pet.status)}</td>
                                                <td className="text-secondary small">{new Date(pet.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <Button size="sm" className="btn-paw-primary" onClick={() => handleOpenDetail(pet)}>
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card>
                )}

                {/* ══ USER MANAGEMENT TAB ══ */}
                {activeTab === 'users' && (
                    <Card className="paw-card p-4">
                        <div className="mb-3">
                            <Form.Control
                                placeholder="Search by name or email…"
                                className="paw-input"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                style={{ maxWidth: '360px' }}
                            />
                        </div>

                        {usersLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" size="sm" style={{ color: 'var(--paw-primary)' }} />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <Alert variant="info">No users found.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table responsive variant="dark" hover className="align-middle m-0">
                                    <thead>
                                        <tr style={{ borderColor: 'var(--paw-border)' }}>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <tr key={u._id} style={{ borderColor: 'var(--paw-border)', opacity: u.isBanned ? 0.6 : 1 }}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {u.profilePicture?.url ? (
                                                            <img
                                                                src={u.profilePicture.url}
                                                                alt={u.name}
                                                                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
                                                                style={{ width: '34px', height: '34px', fontSize: '12px', background: 'linear-gradient(135deg, var(--paw-primary), #a855f7)', flexShrink: 0 }}
                                                            >
                                                                {u.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="text-white small fw-semibold">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-secondary small">{u.email}</td>
                                                <td>
                                                    <Badge bg={u.role === 'ADMIN' ? 'warning' : 'secondary'} text={u.role === 'ADMIN' ? 'dark' : undefined}>
                                                        {u.role}
                                                    </Badge>
                                                </td>
                                                <td className="text-secondary small">
                                                    {u.location?.city ? `${u.location.city}${u.location.state ? ', ' + u.location.state : ''}` : '—'}
                                                </td>
                                                <td>
                                                    <Badge bg={u.isBanned ? 'danger' : 'success'}>
                                                        {u.isBanned ? 'Blocked' : 'Active'}
                                                    </Badge>
                                                </td>
                                                <td className="text-secondary small">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {u.role !== 'ADMIN' ? (
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant={u.isBanned ? 'outline-success' : 'outline-warning'}
                                                                onClick={() => handleBanToggle(u._id, u.isBanned)}
                                                            >
                                                                {u.isBanned ? 'Unblock' : 'Block'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() => { setTargetUser(u); setShowDeleteModal(true); }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary small">Protected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card>
                )}

                {/* ══ REPORTS TAB ══ */}
                {activeTab === 'reports' && (
                    <>
                        {/* Report stats row */}
                        {reportStats && (
                            <Row className="g-3 mb-4">
                                <Col xs={6} md={3}><StatCard label="Total Reports" value={reportStats.totalReports} /></Col>
                                <Col xs={6} md={3}><StatCard label="Open" value={reportStats.openReports} accent="#f5a623" /></Col>
                                <Col xs={6} md={3}><StatCard label="Resolved" value={reportStats.resolvedReports} accent="#28a745" /></Col>
                                <Col xs={6} md={3}><StatCard label="Dismissed" value={reportStats.dismissedReports} accent="#888" /></Col>
                            </Row>
                        )}

                        <Card className="paw-card p-4">
                            {/* Filter buttons */}
                            <div className="d-flex gap-2 mb-3 flex-wrap">
                                {['', 'Open', 'Resolved', 'Dismissed'].map(f => (
                                    <Button
                                        key={f}
                                        size="sm"
                                        onClick={() => setReportFilter(f)}
                                        className={reportFilter === f ? 'btn-paw-primary' : ''}
                                        variant={reportFilter === f ? undefined : 'outline-secondary'}
                                    >
                                        {f || 'All'}
                                    </Button>
                                ))}
                            </div>

                            {reportsLoading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" size="sm" style={{ color: 'var(--paw-primary)' }} />
                                </div>
                            ) : filteredReports.length === 0 ? (
                                <Alert variant="info">No reports found.</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table responsive variant="dark" hover className="align-middle m-0">
                                        <thead>
                                            <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                <th>Reported By</th>
                                                <th>Target</th>
                                                <th>Reason</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.map(r => (
                                                <tr key={r._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                    <td>
                                                        <div className="text-white small fw-semibold">{r.reportedBy?.name || 'Unknown'}</div>
                                                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{r.reportedBy?.email}</div>
                                                    </td>
                                                    <td>
                                                        <Badge bg="secondary" className="me-1">{r.targetType}</Badge>
                                                        <span className="text-secondary" style={{ fontSize: '0.72rem' }}>{String(r.targetId).slice(-6)}</span>
                                                    </td>
                                                    <td className="text-white small" style={{ maxWidth: '200px' }}>
                                                        <div>{r.reason}</div>
                                                        {r.details && <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{r.details}</div>}
                                                    </td>
                                                    <td>{getReportStatusBadge(r.status)}</td>
                                                    <td className="text-secondary small">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        {r.status === 'Open' ? (
                                                            <div className="d-flex gap-1">
                                                                <Button size="sm" variant="outline-success" onClick={() => openResolveModal(r, 'Resolved')}>
                                                                    Resolve
                                                                </Button>
                                                                <Button size="sm" variant="outline-secondary" onClick={() => openResolveModal(r, 'Dismissed')}>
                                                                    Dismiss
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteReport(r._id)}>
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </>
                )}

                {/* ══ PET DETAIL MODAL ══ */}
                <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Modal.Title className="text-white">{selectedPet?.name} — Review</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#1E1E1E', color: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
                        {selectedPet && (
                            <>
                                {selectedPet.imageUrls?.length > 0 && (
                                    <div className="mb-4">
                                        <Carousel
                                            className="rounded"
                                            style={{ border: '1px solid var(--paw-border)' }}
                                        >
                                            {selectedPet.imageUrls.map((img, idx) => (
                                                <Carousel.Item key={idx}>
                                                    <div 
                                                        style={{ height: '300px', backgroundColor: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} 
                                                        onClick={() => window.open(img, '_blank')}
                                                        title="Click to view full size"
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`${selectedPet.name} ${idx + 1}`}
                                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                </Carousel.Item>
                                            ))}
                                        </Carousel>
                                        <div className="text-secondary small mt-2 text-center">Click image to view full dimensions</div>
                                    </div>
                                )}
                                <Row className="g-3 small mb-4">
                                    <Col xs={6}>
                                        <div><strong>Type:</strong> {selectedPet.type}</div>
                                        <div><strong>Breed:</strong> {selectedPet.breed}</div>
                                        <div><strong>Gender:</strong> {selectedPet.gender}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div><strong>Size:</strong> {selectedPet.size}</div>
                                        <div><strong>Age:</strong> {selectedPet.age?.number || 'N/A'} {selectedPet.age?.unit}</div>
                                        <div><strong>Vaccination:</strong> {selectedPet.vaccinationStatus}</div>
                                    </Col>
                                </Row>
                                {selectedPet.description && (
                                    <div className="mb-3">
                                        <h6 className="text-secondary mb-1">Description</h6>
                                        <p className="text-secondary small mb-0">{selectedPet.description}</p>
                                    </div>
                                )}
                                <div className="mb-3 small">
                                    <h6 className="text-secondary mb-1">Lister</h6>
                                    <div><strong>Name:</strong> {selectedPet.listerId?.name}</div>
                                    <div><strong>Email:</strong> {selectedPet.listerId?.email}</div>
                                </div>
                                {selectedPet.status === 'Pending' && (
                                    <Form.Group className="mb-2">
                                        <Form.Label className="text-secondary small">Rejection Reason (required to reject)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            className="paw-input"
                                            placeholder="Explain why this listing is being rejected…"
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                        />
                                    </Form.Group>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
                        {selectedPet?.status === 'Pending' && (
                            <>
                                <Button variant="danger" onClick={() => handleRejectPet(selectedPet._id)}>Reject</Button>
                                <Button className="btn-paw-primary" onClick={() => handleApprovePet(selectedPet._id)}>Approve</Button>
                            </>
                        )}
                        {selectedPet?.status === 'Approved' && (
                            <Button variant="info" onClick={() => handleMarkAdopted(selectedPet._id)}>Mark Adopted</Button>
                        )}
                    </Modal.Footer>
                </Modal>

                {/* ══ DELETE USER MODAL ══ */}
                <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setTargetUser(null); }} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Modal.Title className="text-white">Confirm Delete User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#1E1E1E', color: '#fff' }}>
                        <p>Permanently delete <strong>{targetUser?.name}</strong> ({targetUser?.email})?</p>
                        <p className="text-danger small mb-0">⚠️ This action cannot be undone.</p>
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setTargetUser(null); }}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteUser}>Delete Permanently</Button>
                    </Modal.Footer>
                </Modal>

                {/* ══ RESOLVE REPORT MODAL ══ */}
                <Modal show={showResolveModal} onHide={() => setShowResolveModal(false)} centered>
                    <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Modal.Title className="text-white">{resolveAction} Report</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#1E1E1E', color: '#fff' }}>
                        <p className="small text-secondary mb-3">
                            Reason: <strong className="text-white">{targetReport?.reason}</strong>
                        </p>
                        <Form.Group>
                            <Form.Label className="text-secondary small">Resolution Note (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                className="paw-input"
                                placeholder="Add a note about this resolution…"
                                value={resolutionNote}
                                onChange={e => setResolutionNote(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                        <Button variant="secondary" onClick={() => setShowResolveModal(false)}>Cancel</Button>
                        <Button
                            variant={resolveAction === 'Resolved' ? 'success' : 'secondary'}
                            onClick={handleResolveReport}
                        >
                            {resolveAction}
                        </Button>
                    </Modal.Footer>
                </Modal>

            </div>
        </div>
    );
};

export default Admin;
