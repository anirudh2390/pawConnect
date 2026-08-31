import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Row, Col, Card, Nav, Tab, Badge, Button,
    Form, Spinner, Alert, Table, Modal
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ─── Utility Helpers ──────────────────────────────────────────────────────────
const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusColors = {
    Live: 'success',
    Adopted: 'primary',
    Pending: 'warning',
    Rejected: 'danger',
    Draft: 'secondary',
    Received: 'info',
    'In-Review': 'warning',
    'Interview-Scheduled': 'primary',
    Approved: 'success',
};

const StatBox = ({ label, value, color = 'var(--paw-primary)' }) => (
    <div
        className="text-center p-3 rounded-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--paw-border)' }}
    >
        <div className="fw-bold fs-3" style={{ color }}>{value}</div>
        <div className="text-secondary small">{label}</div>
    </div>
);

// ─── Main Profile Component ───────────────────────────────────────────────────
const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // ─── State ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('overview');
    const [profileData, setProfileData] = useState(null);
    const [stats, setStats] = useState(null);
    const [listings, setListings] = useState([]);
    const [adoptionRequests, setAdoptionRequests] = useState([]);
    const [adoptionHistory, setAdoptionHistory] = useState([]);

    const [profileLoading, setProfileLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        name: '', bio: '', phoneNumber: '',
        location: { city: '', state: '' },
        socialAccounts: { instagram: '' },
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState('');
    const [editError, setEditError] = useState('');

    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // ─── Data Fetching ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'listings' && listings.length === 0) fetchListings();
        if (activeTab === 'requests' && adoptionRequests.length === 0) fetchAdoptionRequests();
        if (activeTab === 'history' && adoptionHistory.length === 0) fetchAdoptionHistory();
    }, [activeTab]);

    const fetchProfile = async () => {
        setProfileLoading(true);
        try {
            const res = await api.get('/users/profile');
            const u = res.data.user;
            setProfileData(u);
            setEditForm({
                name: u.name || '',
                bio: u.bio || '',
                phoneNumber: u.phoneNumber || '',
                location: { city: u.location?.city || '', state: u.location?.state || '' },
                socialAccounts: { instagram: u.socialAccounts?.instagram || '' },
            });
        } catch (err) {
            console.error('Profile fetch failed:', err);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/users/profile/stats');
            setStats(res.data.stats);
        } catch (err) {
            console.error('Stats fetch failed:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchListings = async () => {
        setListingsLoading(true);
        try {
            const res = await api.get('/users/profile/listings?limit=20');
            setListings(res.data.listings || []);
        } catch (err) {
            console.error('Listings fetch failed:', err);
        } finally {
            setListingsLoading(false);
        }
    };

    const fetchAdoptionRequests = async () => {
        setRequestsLoading(true);
        try {
            const res = await api.get('/users/profile/adoption-requests?limit=20');
            setAdoptionRequests(res.data.requests || []);
        } catch (err) {
            console.error('Requests fetch failed:', err);
        } finally {
            setRequestsLoading(false);
        }
    };

    const fetchAdoptionHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/users/profile/adoption-history?limit=20');
            setAdoptionHistory(res.data.history || []);
        } catch (err) {
            console.error('History fetch failed:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('Image size must be under 5MB');
            return;
        }
        setAvatarError('');
        setAvatarLoading(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);
            const res = await api.post('/users/profile/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newPicture = res.data.profilePicture;
            setProfileData((prev) => ({ ...prev, profilePicture: newPicture }));
            updateUser({ profilePicture: newPicture });
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            const res = await api.put('/users/profile', editForm);
            const updated = res.data.user;
            setProfileData(updated);
            updateUser({ name: updated.name, bio: updated.bio, phoneNumber: updated.phoneNumber, location: updated.location });
            setEditSuccess('Profile updated successfully!');
            setTimeout(() => setEditSuccess(''), 3500);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('New passwords do not match');
            return;
        }
        if (pwForm.newPassword.length < 8) {
            setPwError('New password must be at least 8 characters');
            return;
        }
        setPwLoading(true);
        try {
            await api.put('/users/profile/password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwSuccess('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPwSuccess(''), 4000);
        } catch (err) {
            setPwError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPwLoading(false);
        }
    };

    // ─── Avatar Preview ─────────────────────────────────────────────────────
    const avatarUrl = profileData?.profilePicture?.url;
    const avatarInitials = profileData?.name
        ? profileData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    if (profileLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <Spinner animation="border" style={{ color: 'var(--paw-primary)' }} />
            </div>
        );
    }

    const navItems = [
        { key: 'overview', icon: '👤', label: 'Overview' },
        { key: 'edit', icon: '✏️', label: 'Edit Profile' },
        { key: 'password', icon: '🔒', label: 'Change Password' },
        { key: 'listings', icon: '🐾', label: 'My Listings' },
        { key: 'requests', icon: '📩', label: 'My Requests' },
        { key: 'history', icon: '📋', label: 'Adoption History' },
    ];

    return (
        <Container className="py-5">
            {/* ── Page Header ── */}
            <div className="mb-5">
                <h1 className="fw-bold paw-accent-header text-white display-6">
                    my profile<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </h1>
                <p className="text-secondary">Manage your account, listings, and adoption activity.</p>
            </div>

            <Row className="g-4">
                {/* ── Sidebar ── */}
                <Col lg={3}>
                    {/* Avatar Card */}
                    <Card className="paw-card p-4 text-center mb-4">
                        <div className="position-relative d-inline-block mx-auto mb-3" style={{ width: '100px', height: '100px' }}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="rounded-circle"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', border: '3px solid var(--paw-primary)' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 text-white"
                                    style={{
                                        width: '100px', height: '100px',
                                        background: 'linear-gradient(135deg, var(--paw-primary), var(--paw-accent))',
                                        border: '3px solid var(--paw-primary)',
                                    }}
                                >
                                    {avatarInitials}
                                </div>
                            )}
                            {/* Upload button overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarLoading}
                                className="position-absolute bottom-0 end-0 rounded-circle border-0 d-flex align-items-center justify-content-center"
                                style={{
                                    width: '32px', height: '32px',
                                    background: 'var(--paw-primary)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                title="Change avatar"
                            >
                                {avatarLoading ? <Spinner size="sm" animation="border" style={{ width: '14px', height: '14px' }} /> : <span style={{ fontSize: '14px' }}>📷</span>}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="d-none"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {avatarError && <div className="text-danger small mb-2">{avatarError}</div>}

                        <h5 className="text-white fw-bold mb-1">{profileData?.name}</h5>
                        <Badge style={{ background: 'var(--paw-primary)' }} className="mb-2">
                            {profileData?.role || 'USER'}
                        </Badge>
                        {profileData?.location?.city && (
                            <div className="text-secondary small">
                                📍 {profileData.location.city}{profileData.location.state ? `, ${profileData.location.state}` : ''}
                            </div>
                        )}
                        {profileData?.phoneNumber && (
                            <div className="text-secondary small mt-1">📱 {profileData.phoneNumber}</div>
                        )}
                        <div className="text-secondary small mt-1">
                            🗓 Joined {formatDate(profileData?.createdAt)}
                        </div>
                        {profileData?.bio && (
                            <p className="text-secondary small mt-3 mb-0 fst-italic">"{profileData.bio}"</p>
                        )}
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className="paw-card p-3 mb-4">
                        <h6 className="text-white fw-semibold mb-3">Quick Stats</h6>
                        {statsLoading ? (
                            <div className="text-center py-2"><Spinner size="sm" animation="border" style={{ color: 'var(--paw-primary)' }} /></div>
                        ) : stats ? (
                            <div className="d-flex flex-column gap-2">
                                <StatBox label="Total Listings" value={stats.listings.total} />
                                <StatBox label="Active Listings" value={stats.listings.live} color="#22c55e" />
                                <StatBox label="Pets Adopted Out" value={stats.listings.adopted} color="#3b82f6" />
                                <StatBox label="Requests Sent" value={stats.adoptionRequestsSent.total} color="#f59e0b" />
                                <StatBox label="Approved Adoptions" value={stats.adoptionRequestsSent.approved} color="#a855f7" />
                            </div>
                        ) : (
                            <p className="text-secondary small">Stats unavailable</p>
                        )}
                    </Card>

                    {/* Nav Menu */}
                    <Card className="paw-card p-2">
                        <Nav className="flex-column gap-1">
                            {navItems.map((item) => (
                                <Nav.Link
                                    key={item.key}
                                    onClick={() => setActiveTab(item.key)}
                                    className={`rounded-2 px-3 py-2 text-decoration-none d-flex align-items-center gap-2 ${activeTab === item.key ? 'fw-semibold' : ''}`}
                                    style={{
                                        background: activeTab === item.key ? 'rgba(var(--paw-primary-rgb, 255,106,0), 0.15)' : 'transparent',
                                        color: activeTab === item.key ? 'var(--paw-primary)' : '#9ca3af',
                                        border: activeTab === item.key ? '1px solid var(--paw-primary)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Nav.Link>
                            ))}
                        </Nav>
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--paw-border)' }}>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                className="w-100"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                🚪 Sign Out
                            </Button>
                        </div>
                    </Card>
                </Col>

                {/* ── Main Content ── */}
                <Col lg={9}>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Stats Cards Row */}
                            <Row className="g-3 mb-4">
                                {statsLoading ? (
                                    <Col className="text-center py-4">
                                        <Spinner animation="border" style={{ color: 'var(--paw-primary)' }} />
                                    </Col>
                                ) : stats ? (
                                    <>
                                        {[
                                            { label: 'Total Listings', value: stats.listings.total, emoji: '🐾', color: '#ff6a00' },
                                            { label: 'Live Listings', value: stats.listings.live, emoji: '✅', color: '#22c55e' },
                                            { label: 'Pets Adopted Out', value: stats.listings.adopted, emoji: '❤️', color: '#3b82f6' },
                                            { label: 'Requests Sent', value: stats.adoptionRequestsSent.total, emoji: '📩', color: '#f59e0b' },
                                            { label: 'Pending Requests', value: stats.adoptionRequestsSent.pending, emoji: '⏳', color: '#8b5cf6' },
                                            { label: 'Approved', value: stats.adoptionRequestsSent.approved, emoji: '🎉', color: '#ec4899' },
                                        ].map((s) => (
                                            <Col xs={6} md={4} key={s.label}>
                                                <Card className="paw-card p-3 text-center h-100" style={{ cursor: 'default' }}>
                                                    <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
                                                    <div className="fw-bold fs-2 mt-1" style={{ color: s.color }}>{s.value}</div>
                                                    <div className="text-secondary small">{s.label}</div>
                                                </Card>
                                            </Col>
                                        ))}
                                    </>
                                ) : null}
                            </Row>

                            {/* Profile Details Card */}
                            <Card className="paw-card p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="text-white fw-bold mb-0">Profile Details</h5>
                                    <Button
                                        size="sm"
                                        className="btn-paw-primary"
                                        onClick={() => setActiveTab('edit')}
                                    >
                                        ✏️ Edit Profile
                                    </Button>
                                </div>

                                <Row className="gy-3">
                                    {[
                                        { label: 'Full Name', value: profileData?.name },
                                        { label: 'Email Address', value: profileData?.email },
                                        { label: 'Phone Number', value: profileData?.phoneNumber || 'Not provided' },
                                        { label: 'City', value: profileData?.location?.city || 'Not provided' },
                                        { label: 'State / Province', value: profileData?.location?.state || 'Not provided' },
                                        { label: 'Instagram', value: profileData?.socialAccounts?.instagram ? `@${profileData.socialAccounts.instagram}` : 'Not linked' },
                                    ].map((field) => (
                                        <Col md={6} key={field.label}>
                                            <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--paw-border)' }}>
                                                <div className="text-secondary small mb-1">{field.label}</div>
                                                <div className="text-white fw-medium">{field.value}</div>
                                            </div>
                                        </Col>
                                    ))}
                                    {profileData?.bio && (
                                        <Col xs={12}>
                                            <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--paw-border)' }}>
                                                <div className="text-secondary small mb-1">Bio</div>
                                                <div className="text-white">{profileData.bio}</div>
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </Card>
                        </div>
                    )}

                    {/* EDIT PROFILE TAB */}
                    {activeTab === 'edit' && (
                        <Card className="paw-card p-4">
                            <h5 className="text-white fw-bold mb-4">Edit Profile</h5>

                            {editSuccess && <Alert variant="success" className="rounded-3">{editSuccess}</Alert>}
                            {editError && <Alert variant="danger" className="rounded-3">{editError}</Alert>}

                            <Form onSubmit={handleEditSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="paw-input"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                                required
                                                placeholder="Your full name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                className="paw-input"
                                                value={editForm.phoneNumber}
                                                onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">City</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="paw-input"
                                                value={editForm.location.city}
                                                onChange={(e) => setEditForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))}
                                                placeholder="e.g. Kozhikode"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">State</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="paw-input"
                                                value={editForm.location.state}
                                                onChange={(e) => setEditForm((f) => ({ ...f, location: { ...f.location, state: e.target.value } }))}
                                                placeholder="e.g. Kerala"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Instagram Handle</Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-transparent text-secondary" style={{ border: '1px solid var(--paw-border)' }}>@</span>
                                                <Form.Control
                                                    type="text"
                                                    className="paw-input"
                                                    style={{ borderLeft: 'none' }}
                                                    value={editForm.socialAccounts.instagram}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, socialAccounts: { ...f.socialAccounts, instagram: e.target.value } }))}
                                                    placeholder="yourhandle"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Bio</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                className="paw-input"
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                                                placeholder="Tell adopters a bit about yourself..."
                                                maxLength={300}
                                            />
                                            <Form.Text className="text-secondary">{editForm.bio.length}/300</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} className="text-end">
                                        <Button type="submit" className="btn-paw-primary" disabled={editLoading}>
                                            {editLoading ? <><Spinner size="sm" animation="border" className="me-2" />Saving...</> : '💾 Save Changes'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    )}

                    {/* CHANGE PASSWORD TAB */}
                    {activeTab === 'password' && (
                        <Card className="paw-card p-4">
                            <h5 className="text-white fw-bold mb-4">Change Password</h5>
                            <p className="text-secondary small mb-4">
                                For your security, you need to confirm your current password before setting a new one.
                            </p>

                            {pwSuccess && <Alert variant="success" className="rounded-3">{pwSuccess}</Alert>}
                            {pwError && <Alert variant="danger" className="rounded-3">{pwError}</Alert>}

                            <Form onSubmit={handlePasswordSubmit}>
                                <Row className="g-3">
                                    <Col xs={12}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Current Password *</Form.Label>
                                            <Form.Control
                                                type="password"
                                                className="paw-input"
                                                value={pwForm.currentPassword}
                                                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                                                required
                                                placeholder="Enter your current password"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">New Password *</Form.Label>
                                            <Form.Control
                                                type="password"
                                                className="paw-input"
                                                value={pwForm.newPassword}
                                                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                                                required
                                                minLength={8}
                                                placeholder="Min. 8 characters"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Confirm New Password *</Form.Label>
                                            <Form.Control
                                                type="password"
                                                className="paw-input"
                                                value={pwForm.confirmPassword}
                                                onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                                                required
                                                placeholder="Repeat new password"
                                            />
                                        </Form.Group>
                                    </Col>

                                    {/* Password Strength Indicator */}
                                    {pwForm.newPassword && (
                                        <Col xs={12}>
                                            <PasswordStrength password={pwForm.newPassword} />
                                        </Col>
                                    )}

                                    <Col xs={12} className="text-end">
                                        <Button type="submit" className="btn-paw-primary" disabled={pwLoading}>
                                            {pwLoading ? <><Spinner size="sm" animation="border" className="me-2" />Updating...</> : '🔒 Update Password'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                    )}

                    {/* MY LISTINGS TAB */}
                    {activeTab === 'listings' && (
                        <Card className="paw-card p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="text-white fw-bold mb-0">
                                    My Pet Listings
                                    {listings.length > 0 && <Badge className="ms-2" style={{ background: 'var(--paw-primary)', fontSize: '0.7rem' }}>{listings.length}</Badge>}
                                </h5>
                                <Link to="/create-pet" className="btn btn-sm btn-paw-primary text-decoration-none">
                                    + New Listing
                                </Link>
                            </div>

                            {listingsLoading ? (
                                <div className="text-center py-5"><Spinner animation="border" style={{ color: 'var(--paw-primary)' }} /></div>
                            ) : listings.length === 0 ? (
                                <EmptyState emoji="🐾" message="You haven't listed any pets yet." action={<Link to="/create-pet" className="btn btn-sm btn-paw-primary mt-2">List Your First Pet</Link>} />
                            ) : (
                                <div className="table-responsive">
                                    <Table variant="dark" hover className="m-0 align-middle" style={{ '--bs-table-bg': 'transparent' }}>
                                        <thead>
                                            <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                <th className="text-secondary fw-normal">Pet</th>
                                                <th className="text-secondary fw-normal">Type / Breed</th>
                                                <th className="text-secondary fw-normal">Location</th>
                                                <th className="text-secondary fw-normal">Status</th>
                                                <th className="text-secondary fw-normal">Listed On</th>
                                                <th className="text-secondary fw-normal">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {listings.map((pet) => (
                                                <tr key={pet._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            {pet.imageUrls?.[0] ? (
                                                                <img src={pet.imageUrls[0]} alt={pet.name} className="rounded-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'var(--paw-border)' }}>🐾</div>
                                                            )}
                                                            <span className="text-white fw-medium">{pet.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-secondary">{pet.type} · {pet.breed}</td>
                                                    <td className="text-secondary">{pet.location?.city}</td>
                                                    <td>
                                                        <Badge bg={statusColors[pet.status] || 'secondary'}>{pet.status}</Badge>
                                                    </td>
                                                    <td className="text-secondary">{formatDate(pet.createdAt)}</td>
                                                    <td>
                                                        <Link to={`/pet/${pet._id}`} className="btn btn-sm btn-outline-secondary text-white">View</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* MY ADOPTION REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <Card className="paw-card p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="text-white fw-bold mb-0">
                                    My Adoption Requests
                                    {adoptionRequests.length > 0 && <Badge className="ms-2" style={{ background: 'var(--paw-primary)', fontSize: '0.7rem' }}>{adoptionRequests.length}</Badge>}
                                </h5>
                            </div>

                            {requestsLoading ? (
                                <div className="text-center py-5"><Spinner animation="border" style={{ color: 'var(--paw-primary)' }} /></div>
                            ) : adoptionRequests.length === 0 ? (
                                <EmptyState emoji="📩" message="You haven't submitted any adoption requests yet." action={<Link to="/browse" className="btn btn-sm btn-paw-primary mt-2">Browse Pets</Link>} />
                            ) : (
                                <div className="table-responsive">
                                    <Table variant="dark" hover className="m-0 align-middle" style={{ '--bs-table-bg': 'transparent' }}>
                                        <thead>
                                            <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                <th className="text-secondary fw-normal">Pet</th>
                                                <th className="text-secondary fw-normal">Lister</th>
                                                <th className="text-secondary fw-normal">Submitted</th>
                                                <th className="text-secondary fw-normal">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adoptionRequests.map((req) => (
                                                <tr key={req._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            {req.petId?.imageUrls?.[0] ? (
                                                                <img src={req.petId.imageUrls[0]} alt={req.petId?.name} className="rounded-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'var(--paw-border)' }}>🐾</div>
                                                            )}
                                                            <div>
                                                                <div className="text-white fw-medium">{req.petId?.name || '—'}</div>
                                                                <div className="text-secondary small">{req.petId?.breed}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-secondary">{req.listerId?.name || '—'}</td>
                                                    <td className="text-secondary">{formatDate(req.createdAt)}</td>
                                                    <td>
                                                        <Badge bg={statusColors[req.status] || 'secondary'}>{req.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* ADOPTION HISTORY TAB */}
                    {activeTab === 'history' && (
                        <Card className="paw-card p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="text-white fw-bold mb-0">
                                    Adoption History
                                    <span className="text-secondary fw-normal fs-6 ms-2">(Requests received for your pets)</span>
                                    {adoptionHistory.length > 0 && <Badge className="ms-2" style={{ background: 'var(--paw-primary)', fontSize: '0.7rem' }}>{adoptionHistory.length}</Badge>}
                                </h5>
                            </div>

                            {historyLoading ? (
                                <div className="text-center py-5"><Spinner animation="border" style={{ color: 'var(--paw-primary)' }} /></div>
                            ) : adoptionHistory.length === 0 ? (
                                <EmptyState emoji="📋" message="No adoption requests received for your listings yet." />
                            ) : (
                                <div className="table-responsive">
                                    <Table variant="dark" hover className="m-0 align-middle" style={{ '--bs-table-bg': 'transparent' }}>
                                        <thead>
                                            <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                <th className="text-secondary fw-normal">Your Pet</th>
                                                <th className="text-secondary fw-normal">Applicant</th>
                                                <th className="text-secondary fw-normal">Date</th>
                                                <th className="text-secondary fw-normal">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adoptionHistory.map((item) => (
                                                <tr key={item._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            {item.petId?.imageUrls?.[0] ? (
                                                                <img src={item.petId.imageUrls[0]} alt={item.petId?.name} className="rounded-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'var(--paw-border)' }}>🐾</div>
                                                            )}
                                                            <div>
                                                                <div className="text-white fw-medium">{item.petId?.name || '—'}</div>
                                                                <div className="text-secondary small">{item.petId?.breed}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div
                                                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                                                                style={{ width: '30px', height: '30px', background: 'var(--paw-primary)', fontSize: '12px', flexShrink: 0 }}
                                                            >
                                                                {item.adopterId?.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="text-white">{item.adopterId?.name || '—'}</div>
                                                                <div className="text-secondary small">{item.adopterId?.location?.city}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-secondary">{formatDate(item.createdAt)}</td>
                                                    <td>
                                                        <Badge bg={statusColors[item.status] || 'secondary'}>{item.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Logout Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Body
                    className="text-center p-5 rounded-3"
                    style={{ background: '#1a1a2e', border: '1px solid var(--paw-border)' }}
                >
                    <div style={{ fontSize: '3rem' }}>🚪</div>
                    <h5 className="text-white fw-bold mt-3">Sign Out?</h5>
                    <p className="text-secondary">You'll need to log back in to access your account.</p>
                    <div className="d-flex gap-3 justify-content-center mt-4">
                        <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            Yes, Sign Out
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

// ─── Password Strength Sub-component ─────────────────────────────────────────
const PasswordStrength = ({ password }) => {
    const getStrength = (pw) => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };

    const score = getStrength(password);
    const levels = [
        { label: 'Very Weak', color: '#ef4444', width: '20%' },
        { label: 'Weak', color: '#f97316', width: '40%' },
        { label: 'Fair', color: '#eab308', width: '60%' },
        { label: 'Strong', color: '#22c55e', width: '80%' },
        { label: 'Very Strong', color: '#10b981', width: '100%' },
    ];
    const level = levels[Math.min(score - 1, 4)] || levels[0];

    return (
        <div>
            <div className="d-flex justify-content-between mb-1">
                <span className="text-secondary small">Password Strength</span>
                <span className="small fw-medium" style={{ color: level.color }}>{level.label}</span>
            </div>
            <div className="rounded-pill overflow-hidden" style={{ height: '6px', background: 'var(--paw-border)' }}>
                <div
                    className="h-100 rounded-pill"
                    style={{ width: level.width, background: level.color, transition: 'width 0.3s ease, background 0.3s ease' }}
                />
            </div>
        </div>
    );
};

// ─── Empty State Sub-component ────────────────────────────────────────────────
const EmptyState = ({ emoji, message, action }) => (
    <div className="text-center py-5">
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{emoji}</div>
        <p className="text-secondary">{message}</p>
        {action}
    </div>
);

export default Profile;
