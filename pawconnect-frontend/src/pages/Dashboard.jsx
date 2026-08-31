import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Container, Row, Col, Card, Tabs, Tab, Table,
    Button, Badge, Spinner, Alert, Modal, Form
} from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANTS = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Adopted: 'info',
    Draft: 'secondary',
    Received: 'primary',
    'In-Review': 'warning',
    'Interview-Scheduled': 'info',
};

const getStatusBadge = (status) => (
    <Badge bg={STATUS_VARIANTS[status] || 'secondary'}>{status}</Badge>
);

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyRows = ({ emoji, message }) => (
    <tr>
        <td colSpan="10" className="text-center py-5 text-secondary">
            <div style={{ fontSize: '2.5rem' }}>{emoji}</div>
            <p className="mt-2 mb-0">{message}</p>
        </td>
    </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();


    // Listings state
    const [userListings, setUserListings] = useState([]);
    const [listingsLoading, setListingsLoading] = useState(true);

    // Adoption — requests I sent
    const [sentRequests, setSentRequests] = useState([]);
    const [sentLoading, setSentLoading] = useState(false);
    const [sentFetched, setSentFetched] = useState(false);

    // Adoption — requests I received (as owner)
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [receivedLoading, setReceivedLoading] = useState(false);
    const [receivedFetched, setReceivedFetched] = useState(false);

    // Shared
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Delete listing modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Respond to adoption request modal
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [respondTarget, setRespondTarget] = useState(null);   // { id, petName, adopterName }
    const [respondAction, setRespondAction] = useState('');
    const [respondNotes, setRespondNotes] = useState('');
    const [responding, setResponding] = useState(false);

    // Cancel my adoption request modal
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // ── Fetch listings ────────────────────────────────────────────────────────
    const fetchUserListings = useCallback(async () => {
        try {
            setListingsLoading(true);
            setError(null);
            const res = await api.get('/pets/user/listings');
            if (res.data?.status === 'success') {
                setUserListings(res.data.pets || []);
            }
        } catch (err) {
            setError('Failed to load your listings');
        } finally {
            setListingsLoading(false);
        }
    }, []);

    useEffect(() => { fetchUserListings(); }, [fetchUserListings]);

    // ── Socket.IO: live updates on adoption notifications ──────────────────
    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_user_notifications', user.id);

        const handleAdoptionNotification = (payload) => {
            // Force re-fetch the relevant lists when we receive a notification
            if (['NEW_REQUEST', 'REQUEST_CANCELLED'].includes(payload.type)) {
                // Owner received something — refresh received list
                setReceivedFetched(false);
            }
            if (['REQUEST_APPROVED', 'REQUEST_REJECTED', 'STATUS_UPDATED', 'INTERVIEW_SCHEDULED'].includes(payload.type)) {
                // Adopter got a response — refresh sent list
                setSentFetched(false);
            }
            // Also refresh listings for status changes
            fetchUserListings();
        };

        socket.on('adoption_notification', handleAdoptionNotification);

        return () => {
            socket.off('adoption_notification', handleAdoptionNotification);
        };
    }, [socket, user, fetchUserListings]);

    // ── Fetch sent adoption requests (lazy — only on tab switch) ──────────────
    const fetchSentRequests = useCallback(async () => {
        if (sentFetched) return;
        try {
            setSentLoading(true);
            const res = await api.get('/adoptions/sent?limit=50');
            if (res.data?.status === 'success') {
                setSentRequests(res.data.requests || []);
                setSentFetched(true);
            }
        } catch (err) {
            setError('Failed to load your adoption requests');
        } finally {
            setSentLoading(false);
        }
    }, [sentFetched]);

    // ── Fetch received adoption requests (lazy) ───────────────────────────────
    const fetchReceivedRequests = useCallback(async () => {
        if (receivedFetched) return;
        try {
            setReceivedLoading(true);
            const res = await api.get('/adoptions/received?limit=50');
            if (res.data?.status === 'success') {
                setReceivedRequests(res.data.requests || []);
                setReceivedFetched(true);
            }
        } catch (err) {
            setError('Failed to load incoming adoption requests');
        } finally {
            setReceivedLoading(false);
        }
    }, [receivedFetched]);

    const handleTabSelect = (key) => {
        if (key === 'sent') fetchSentRequests();
        if (key === 'received') fetchReceivedRequests();
    };

    // ── Open chat with another user ───────────────────────────────────────────
    const openChatWith = async (otherUserId) => {
        if (!otherUserId) return;
        try {
            const { data } = await api.post('/chats/rooms', { otherUserId });
            // Pass the room id via navigation state so Chat page can auto-select it
            navigate('/chat', { state: { openRoomId: data.room?._id } });
        } catch (err) {
            setError(err.response?.data?.message || 'Cannot open chat at this time');
        }
    };

    // ── Delete listing ────────────────────────────────────────────────────────
    const handleDeleteClick = (petId) => { setDeleteTarget(petId); setShowDeleteModal(true); };

    const handleConfirmDelete = async () => {
        try {
            setDeleting(true);
            const res = await api.delete(`/pets/${deleteTarget}`);
            if (res.data?.status === 'success') {
                setUserListings(prev => prev.filter(p => p._id !== deleteTarget));
                toast('Listing deleted successfully');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete listing');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    // ── Toast helper ──────────────────────────────────────────────────────────
    const toast = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3500);
    };

    // ── Cancel my adoption request ────────────────────────────────────────────
    const handleCancelClick = (req) => { setCancelTarget(req); setShowCancelModal(true); };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        try {
            setCancelling(true);
            const res = await api.patch(`/adoptions/${cancelTarget._id}/cancel`);
            if (res.data?.status === 'success') {
                setSentRequests(prev =>
                    prev.map(r => r._id === cancelTarget._id ? { ...r, status: 'Rejected' } : r)
                );
                toast('Adoption request cancelled');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel request');
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
            setCancelTarget(null);
        }
    };

    // ── Respond to received adoption request ──────────────────────────────────
    const handleRespondClick = (req, action) => {
        setRespondTarget(req);
        setRespondAction(action);
        setRespondNotes('');
        setShowRespondModal(true);
    };

    const handleConfirmRespond = async () => {
        if (!respondTarget || !respondAction) return;
        try {
            setResponding(true);
            const res = await api.patch(`/adoptions/${respondTarget._id}/respond`, {
                action: respondAction,
                notes: respondNotes,
            });
            if (res.data?.status === 'success') {
                const updated = res.data.adoption;
                setReceivedRequests(prev =>
                    prev.map(r => r._id === updated._id ? updated : r)
                );
                // If approved, update pet status in listings
                if (respondAction === 'approve') {
                    setUserListings(prev =>
                        prev.map(p => p._id === updated.petId?._id ? { ...p, status: 'Adopted' } : p)
                    );
                }
                toast(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to respond to request');
        } finally {
            setResponding(false);
            setShowRespondModal(false);
            setRespondTarget(null);
        }
    };

    // ── Derived counts ────────────────────────────────────────────────────────
    const pendingListings = userListings.filter(p => p.status === 'Pending');
    const approvedListings = userListings.filter(p => p.status === 'Approved');
    const adoptedListings = userListings.filter(p => p.status === 'Adopted');
    const activeSentCount = sentRequests.filter(r => !['Rejected'].includes(r.status)).length;
    const pendingReceivedCount = receivedRequests.filter(r => r.status === 'Received').length;

    return (
        <Container className="py-5">
            <div className="mb-5">
                <h1 className="fw-bold paw-accent-header text-white display-6">
                    dashboard workbench<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </h1>
            </div>

            {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <Row className="g-4">
                {/* Profile Preview */}
                <Col lg={3}>
                    <Card className="paw-card p-4 mb-4">
                        <div className="text-center mb-4">
                            <div
                                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center overflow-hidden"
                                style={{ width: '80px', height: '80px', backgroundColor: '#1E1E1E', fontSize: '2.5rem', border: '2px solid var(--paw-primary)' }}
                            >
                                {user?.profilePicture?.url
                                    ? <img src={user.profilePicture.url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : '👤'}
                            </div>
                            <h5 className="text-white fw-bold mb-1">{user?.name}</h5>
                            <span className="badge" style={{ backgroundColor: 'var(--paw-primary)' }}>Adopter & Lister</span>
                        </div>
                        <div className="text-secondary fs-7 gap-2 d-flex flex-column">
                            {user?.location?.city && (
                                <div><strong>Location:</strong> {user.location.city}{user.location.state && `, ${user.location.state}`}</div>
                            )}
                            <div><strong>Active Listings:</strong> {approvedListings.length + pendingListings.length}</div>
                            <div className="mt-3">
                                <Link to="/profile" className="btn btn-sm btn-paw-primary w-100">Edit Profile</Link>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="paw-card p-3 mb-4">
                        <h6 className="text-secondary mb-3">Your Statistics</h6>
                        <div className="text-secondary small d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between">
                                <span>Total Listings:</span>
                                <strong className="text-white">{userListings.length}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Approved:</span>
                                <strong className="text-success">{approvedListings.length}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Pending Review:</span>
                                <strong className="text-warning">{pendingListings.length}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Adopted Out:</span>
                                <strong className="text-info">{adoptedListings.length}</strong>
                            </div>
                            <hr style={{ borderColor: 'var(--paw-border)' }} />
                            <div className="d-flex justify-content-between">
                                <span>Requests Sent:</span>
                                <strong className="text-primary">{activeSentCount}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Requests Received:</span>
                                <strong style={{ color: 'var(--paw-primary)' }}>{pendingReceivedCount}</strong>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Dashboard Tabs */}
                <Col lg={9}>
                    <Card className="paw-card p-4">
                        <Tabs defaultActiveKey="listings" className="mb-4" onSelect={handleTabSelect}>

                            {/* ── My Listings tab ─────────────────────────────── */}
                            <Tab eventKey="listings" title={`My Listings (${userListings.length})`}>
                                {listingsLoading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" className="text-warning" />
                                        <p className="text-secondary mt-3">Loading listings...</p>
                                    </div>
                                ) : userListings.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div style={{ fontSize: '3rem' }}>🐾</div>
                                        <p className="text-secondary my-3">You haven't created any pet listings yet.</p>
                                        <Link to="/create-pet" className="btn btn-paw-primary">+ Create Your First Listing</Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="d-flex justify-content-between mb-3 align-items-center">
                                            <h6 className="text-white mb-0">Your Pet Listings</h6>
                                            <Link to="/create-pet" className="btn btn-paw-primary btn-sm">+ Add New Pet</Link>
                                        </div>
                                        <div className="table-responsive">
                                            <Table responsive variant="dark" hover className="m-0 align-middle">
                                                <thead>
                                                    <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                        <th>Pet</th>
                                                        <th>Type</th>
                                                        <th>Breed</th>
                                                        <th>Status</th>
                                                        <th>Listed</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userListings.map(pet => (
                                                        <tr key={pet._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {pet.imageUrls?.[0] && (
                                                                        <img src={pet.imageUrls[0]} alt={pet.name}
                                                                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                                    )}
                                                                    <strong className="text-white">{pet.name}</strong>
                                                                </div>
                                                            </td>
                                                            <td>{pet.type}</td>
                                                            <td>{pet.breed}</td>
                                                            <td>{getStatusBadge(pet.status)}</td>
                                                            <td className="text-secondary small">{fmt(pet.createdAt)}</td>
                                                            <td>
                                                                <div className="btn-group btn-group-sm">
                                                                    <Link to={`/pet/${pet._id}`} className="btn btn-outline-secondary">View</Link>
                                                                    {pet.status !== 'Adopted' && (
                                                                        <Link to={`/edit-pet/${pet._id}`} className="btn btn-outline-secondary">Edit</Link>
                                                                    )}
                                                                    <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClick(pet._id)}>Delete</Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </Tab>

                            {/* ── Requests I Sent tab ──────────────────────────── */}
                            <Tab eventKey="sent" title={`My Applications (${sentRequests.length})`}>
                                {sentLoading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" className="text-warning" />
                                        <p className="text-secondary mt-3">Loading your applications...</p>
                                    </div>
                                ) : sentRequests.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div style={{ fontSize: '3rem' }}>📋</div>
                                        <p className="text-secondary my-3">You haven't applied to adopt any pets yet.</p>
                                        <Link to="/browse" className="btn btn-paw-primary">Browse Pets</Link>
                                    </div>
                                ) : (
                                    <>
                                        <h6 className="text-white mb-3">Your Adoption Applications</h6>
                                        <div className="table-responsive">
                                            <Table responsive variant="dark" hover className="m-0 align-middle">
                                                <thead>
                                                    <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                        <th>Pet</th>
                                                        <th>Owner</th>
                                                        <th>Location</th>
                                                        <th>Applied On</th>
                                                        <th>Status</th>
                                                        <th>Notes</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sentRequests.map(req => (
                                                        <tr key={req._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {req.petId?.imageUrls?.[0] && (
                                                                        <img src={req.petId.imageUrls[0]} alt={req.petId?.name}
                                                                            style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                                                    )}
                                                                    <div>
                                                                        <div className="text-white fw-semibold">{req.petId?.name}</div>
                                                                        <small className="text-secondary">{req.petId?.breed}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-secondary">{req.listerId?.name || '—'}</td>
                                                            <td className="text-secondary small">
                                                                {req.petId?.location?.city || '—'}
                                                                {req.petId?.location?.state && `, ${req.petId.location.state}`}
                                                            </td>
                                                            <td className="text-secondary small">{fmt(req.createdAt)}</td>
                                                            <td>{getStatusBadge(req.status)}</td>
                                                            <td className="text-secondary small" style={{ maxWidth: '160px' }}>
                                                                {req.notes ? <span title={req.notes}>{req.notes.slice(0, 50)}{req.notes.length > 50 ? '…' : ''}</span> : '—'}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {['Received', 'In-Review', 'Interview-Scheduled'].includes(req.status) ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline-danger"
                                                                            onClick={() => handleCancelClick(req)}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-secondary small">—</span>
                                                                    )}
                                                                    {req.listerId?._id && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline-secondary"
                                                                            onClick={() => openChatWith(req.listerId._id)}
                                                                            title="Chat with owner"
                                                                        >
                                                                            💬 Chat
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </Tab>

                            {/* ── Requests I Received tab ──────────────────────── */}
                            <Tab
                                eventKey="received"
                                title={
                                    <>
                                        Incoming Requests{' '}
                                        {pendingReceivedCount > 0 && (
                                            <Badge bg="danger" pill className="ms-1">{pendingReceivedCount}</Badge>
                                        )}
                                    </>
                                }
                            >
                                {receivedLoading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" className="text-warning" />
                                        <p className="text-secondary mt-3">Loading incoming requests...</p>
                                    </div>
                                ) : receivedRequests.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div style={{ fontSize: '3rem' }}>📬</div>
                                        <p className="text-secondary my-3">No adoption requests received yet. Get your listings approved to start receiving applications!</p>
                                    </div>
                                ) : (
                                    <>
                                        <h6 className="text-white mb-3">Adoption Requests for Your Pets</h6>
                                        <div className="table-responsive">
                                            <Table responsive variant="dark" hover className="m-0 align-middle">
                                                <thead>
                                                    <tr style={{ borderColor: 'var(--paw-border)' }}>
                                                        <th>Pet</th>
                                                        <th>Applicant</th>
                                                        <th>Contact</th>
                                                        <th>Experience</th>
                                                        <th>Home</th>
                                                        <th>Received</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {receivedRequests.map(req => (
                                                        <tr key={req._id} style={{ borderColor: 'var(--paw-border)' }}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {req.petId?.imageUrls?.[0] && (
                                                                        <img src={req.petId.imageUrls[0]} alt={req.petId?.name}
                                                                            style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                                                    )}
                                                                    <strong className="text-white">{req.petId?.name}</strong>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="text-white fw-semibold">{req.adopterId?.name}</div>
                                                                <small className="text-secondary">{req.adopterId?.email}</small>
                                                            </td>
                                                            <td className="text-secondary small">{req.adopterId?.phoneNumber || '—'}</td>
                                                            <td className="text-secondary small">{req.questionnaire?.experienceLevel || '—'}</td>
                                                            <td className="text-secondary small">{req.questionnaire?.homeEnvironment || '—'}</td>
                                                            <td className="text-secondary small">{fmt(req.createdAt)}</td>
                                                            <td>{getStatusBadge(req.status)}</td>
                                                            <td>
                                                                {req.status === 'Rejected' || req.status === 'Approved' ? (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        <span className="text-secondary small">Closed</span>
                                                                        {req.adopterId?._id && (
                                                                            <Button size="sm" variant="outline-secondary"
                                                                                onClick={() => openChatWith(req.adopterId._id)}
                                                                                title="Chat with applicant">
                                                                                💬 Chat
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        <Button size="sm" variant="success"
                                                                            onClick={() => handleRespondClick(req, 'approve')}>
                                                                            ✓ Approve
                                                                        </Button>
                                                                        <Button size="sm" variant="outline-warning"
                                                                            onClick={() => handleRespondClick(req, 'review')}>
                                                                            Review
                                                                        </Button>
                                                                        <Button size="sm" variant="outline-info"
                                                                            onClick={() => handleRespondClick(req, 'schedule')}>
                                                                            Schedule
                                                                        </Button>
                                                                        <Button size="sm" variant="outline-danger"
                                                                            onClick={() => handleRespondClick(req, 'reject')}>
                                                                            Reject
                                                                        </Button>
                                                                        {req.adopterId?._id && (
                                                                            <Button size="sm" variant="outline-secondary"
                                                                                onClick={() => openChatWith(req.adopterId._id)}
                                                                                title="Chat with applicant">
                                                                                💬 Chat
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </Tab>

                        </Tabs>
                    </Card>
                </Col>
            </Row>

            {/* ── Delete Listing Modal ─────────────────────────────────────────── */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Modal.Title className="text-white">Delete Listing</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#1E1E1E', color: '#fff' }}>
                    Are you sure you want to delete this listing? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Cancel Adoption Request Modal ────────────────────────────────── */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Modal.Title className="text-white">Cancel Application</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#1E1E1E', color: '#fff' }}>
                    <p>
                        Cancel your adoption application for{' '}
                        <strong className="text-warning">{cancelTarget?.petId?.name}</strong>?
                    </p>
                    <p className="text-secondary small">This will mark your request as closed and notify the pet owner.</p>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={cancelling}>Keep Application</Button>
                    <Button variant="danger" onClick={handleConfirmCancel} disabled={cancelling}>
                        {cancelling ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                        Yes, Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Respond to Request Modal ─────────────────────────────────────── */}
            <Modal show={showRespondModal} onHide={() => setShowRespondModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Modal.Title className="text-white">
                        {respondAction === 'approve' && '✓ Approve Adoption Request'}
                        {respondAction === 'reject' && '✗ Reject Adoption Request'}
                        {respondAction === 'review' && '🔍 Move to Review'}
                        {respondAction === 'schedule' && '📅 Schedule Interview'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#1E1E1E' }}>
                    {respondAction === 'approve' && (
                        <Alert variant="warning" className="small">
                            ⚠️ Approving this request will mark <strong>{respondTarget?.petId?.name}</strong> as <strong>Adopted</strong> and automatically reject all other pending requests for this pet.
                        </Alert>
                    )}
                    <p className="text-secondary mb-3">
                        Applicant: <strong className="text-white">{respondTarget?.adopterId?.name}</strong>
                        {' · '} Pet: <strong className="text-white">{respondTarget?.petId?.name}</strong>
                    </p>

                    {/* Questionnaire summary */}
                    {respondTarget?.questionnaire && (
                        <div className="mb-3 p-3 rounded" style={{ background: '#141414', border: '1px solid var(--paw-border)' }}>
                            <p className="text-secondary small mb-1"><strong className="text-white">Experience:</strong> {respondTarget.questionnaire.experienceLevel || 'Not provided'}</p>
                            <p className="text-secondary small mb-1"><strong className="text-white">Home:</strong> {respondTarget.questionnaire.homeEnvironment || 'Not provided'}</p>
                            <p className="text-secondary small mb-1"><strong className="text-white">Hours alone:</strong> {respondTarget.questionnaire.hoursLeftAlone ?? 'Not provided'}</p>
                            <p className="text-secondary small mb-0"><strong className="text-white">Other pets:</strong> {respondTarget.questionnaire.hasOtherPets != null ? (respondTarget.questionnaire.hasOtherPets ? 'Yes' : 'No') : 'Not provided'}</p>
                        </div>
                    )}

                    <Form.Group>
                        <Form.Label className="text-secondary small">
                            {respondAction === 'approve' && 'Message to adopter (optional)'}
                            {respondAction === 'reject' && 'Reason for rejection (optional — sent to applicant)'}
                            {respondAction === 'review' && 'Notes (optional)'}
                            {respondAction === 'schedule' && 'Interview details / message to applicant'}
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            className="paw-input"
                            placeholder={respondAction === 'schedule' ? 'e.g. Please meet us at our shelter on Saturday at 10 AM' : 'Add a note...'}
                            value={respondNotes}
                            onChange={e => setRespondNotes(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Button variant="secondary" onClick={() => setShowRespondModal(false)} disabled={responding}>Cancel</Button>
                    <Button
                        variant={respondAction === 'approve' ? 'success' : respondAction === 'reject' ? 'danger' : 'primary'}
                        onClick={handleConfirmRespond}
                        disabled={responding}
                    >
                        {responding ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default Dashboard;
