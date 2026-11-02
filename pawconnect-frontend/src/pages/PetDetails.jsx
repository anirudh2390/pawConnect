import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Row, Col, Card, Button, Carousel, Spinner, Alert, Badge,
    Modal, Form
} from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const PetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Adoption request state
    const [showAdoptModal, setShowAdoptModal] = useState(false);
    const [adoptLoading, setAdoptLoading] = useState(false);
    const [adoptSuccess, setAdoptSuccess] = useState(null);
    const [adoptError, setAdoptError] = useState(null);
    const [hasExistingRequest, setHasExistingRequest] = useState(false);
    const [questionnaire, setQuestionnaire] = useState({
        experienceLevel: '',
        homeEnvironment: '',
        hoursLeftAlone: '',
        hasOtherPets: '',
    });

    useEffect(() => {
        fetchPetDetails();
    }, [id]);

    // Check if user already has an active request for this pet
    useEffect(() => {
        if (isAuthenticated && pet && user) {
            checkExistingRequest();
        }
    }, [pet, user, isAuthenticated]);

    const fetchPetDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/pets/${id}`);

            if (response.data?.status === 'success') {
                setPet(response.data.pet);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load pet details');
            console.error('Error fetching pet:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkExistingRequest = async () => {
        try {
            const res = await api.get('/adoptions/sent?limit=100');
            if (res.data?.status === 'success') {
                const active = res.data.requests.find(
                    r => r.petId?._id === id && r.status !== 'Rejected'
                );
                setHasExistingRequest(!!active);
            }
        } catch {
            // silently fail — non-critical check
        }
    };

    const handleQuestionnaireChange = (e) => {
        const { name, value } = e.target;
        setQuestionnaire(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitAdoption = async () => {
        setAdoptLoading(true);
        setAdoptError(null);
        setAdoptSuccess(null);

        try {
            const payload = {
                petId: id,
                questionnaire: {
                    experienceLevel: questionnaire.experienceLevel || undefined,
                    homeEnvironment: questionnaire.homeEnvironment || undefined,
                    hoursLeftAlone: questionnaire.hoursLeftAlone
                        ? Number(questionnaire.hoursLeftAlone) : undefined,
                    hasOtherPets: questionnaire.hasOtherPets === ''
                        ? undefined : questionnaire.hasOtherPets === 'true',
                },
            };

            const res = await api.post('/adoptions', payload);

            if (res.data?.status === 'success') {
                setAdoptSuccess('Adoption request submitted successfully! The owner will be notified.');
                setHasExistingRequest(true);
                setShowAdoptModal(false);
                // Clear form
                setQuestionnaire({ experienceLevel: '', homeEnvironment: '', hoursLeftAlone: '', hasOtherPets: '' });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit adoption request';
            setAdoptError(msg);
        } finally {
            setAdoptLoading(false);
        }
    };

    const handleOpenAdoptModal = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setAdoptError(null);
        setShowAdoptModal(true);
    };

    if (loading) {
        return (
            <Container className="py-5">
                <div className="text-center">
                    <Spinner animation="border" className="text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="text-secondary mt-3">Loading pet details...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={() => navigate('/browse')} className="btn-paw-primary">
                    Back to Browse
                </Button>
            </Container>
        );
    }

    if (!pet) {
        return (
            <Container className="py-5">
                <Alert variant="info">Pet not found</Alert>
                <Button onClick={() => navigate('/browse')} className="btn-paw-primary">
                    Back to Browse
                </Button>
            </Container>
        );
    }

    const isOwner = user && pet.listerId && (user.id === pet.listerId._id || user.id === pet.listerId);
    const canAdopt = pet.status === 'Approved' && !isOwner && !hasExistingRequest;

    return (
        <Container className="py-5">
            {/* Back Button */}
            <div className="mb-4">
                <Button
                    variant="link"
                    className="text-secondary p-0 text-decoration-none"
                    onClick={() => navigate('/browse')}
                >
                    ← Back to listings
                </Button>
            </div>

            {/* Success / Error alerts */}
            {adoptSuccess && (
                <Alert variant="success" dismissible onClose={() => setAdoptSuccess(null)}>
                    {adoptSuccess}
                </Alert>
            )}

            <Row className="g-4">
                {/* Image Carousel */}
                <Col lg={7}>
                    {pet.imageUrls && pet.imageUrls.length > 0 ? (
                        <div>
                            <Carousel
                                activeIndex={carouselIndex}
                                onSelect={(selectedIndex) => setCarouselIndex(selectedIndex)}
                                className="rounded"
                                style={{ border: '2px solid var(--paw-primary)' }}
                            >
                                {pet.imageUrls.map((image, index) => (
                                    <Carousel.Item key={index}>
                                        <div
                                            style={{
                                                height: '450px',
                                                backgroundColor: '#141414',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => window.open(image, '_blank')}
                                            title="Click to view full size"
                                        >
                                            <img
                                                src={image}
                                                alt={`${pet.name} ${index + 1}`}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain'
                                                }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
                                                }}
                                            />
                                        </div>
                                    </Carousel.Item>
                                ))}
                            </Carousel>
                            <div className="text-secondary small mt-2">
                                Image {carouselIndex + 1} of {pet.imageUrls.length}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="rounded d-flex align-items-center justify-content-center"
                            style={{
                                height: '450px',
                                backgroundColor: '#141414',
                                border: '1px solid var(--paw-border)',
                            }}
                        >
                            <span style={{ fontSize: '6rem' }}>🐾</span>
                        </div>
                    )}
                </Col>

                {/* Pet Info */}
                <Col lg={5}>
                    <div className="paw-script">*profile*</div>
                    <h1 className="fw-bold text-white display-4 mb-3">{pet.name}.</h1>

                    {/* Status Badge */}
                    {pet.status === 'Approved' && (
                        <Badge bg="success" className="mb-3">✓ Ready for Adoption</Badge>
                    )}
                    {pet.status === 'Adopted' && (
                        <Badge bg="info" className="mb-3">Adopted</Badge>
                    )}
                    {pet.status === 'Pending' && (
                        <Badge bg="warning" className="mb-3">Pending Approval</Badge>
                    )}
                    {pet.status === 'Rejected' && (
                        <Badge bg="danger" className="mb-3">Rejected</Badge>
                    )}

                    {/* Specifications Card */}
                    <Card className="paw-card p-4 mb-4">
                        <h5 className="text-white mb-3">Specifications</h5>
                        <div className="d-flex flex-column gap-2 text-secondary">
                            <div><strong className="text-white">Type:</strong> {pet.type}</div>
                            <div><strong className="text-white">Breed:</strong> {pet.breed}</div>
                            {pet.age?.number && (
                                <div><strong className="text-white">Age:</strong> {pet.age.number} {pet.age.unit}</div>
                            )}
                            <div><strong className="text-white">Gender:</strong> {pet.gender}</div>
                            <div><strong className="text-white">Size:</strong> {pet.size}</div>
                            <div><strong className="text-white">Vaccinations:</strong> {pet.vaccinationStatus}</div>
                            <div>
                                <strong className="text-white">Location:</strong> {pet.location?.city} {pet.location?.state && `- ${pet.location.state}`}
                            </div>
                        </div>
                    </Card>

                    {/* Lister Info Card */}
                    <Card className="paw-card p-4 mb-4">
                        <h5 className="text-white mb-3">Lister Information</h5>
                        <div className="text-secondary">
                            <div className="mb-2"><strong className="text-white">{pet.listerId?.name}</strong></div>
                            {pet.listerId?.location?.city && (
                                <div className="mb-2">📍 {pet.listerId.location.city} {pet.listerId.location.state && `- ${pet.listerId.location.state}`}</div>
                            )}
                            {pet.listerId?.phoneNumber && (
                                <div className="mb-2">📞 {pet.listerId.phoneNumber}</div>
                            )}
                            {pet.listerId?.socialAccounts?.instagram && (
                                <div>📱 @{pet.listerId.socialAccounts.instagram}</div>
                            )}
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    {isOwner ? (
                        <div className="d-grid gap-3">
                            <Button
                                className="btn-paw-primary py-2"
                                onClick={() => navigate(`/edit-pet/${pet._id}`)}
                            >
                                Edit Listing
                            </Button>
                            <Button
                                className="btn-outline-danger py-2"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this listing?')) {
                                        api.delete(`/pets/${pet._id}`).then(() => navigate('/dashboard'));
                                    }
                                }}
                            >
                                Delete Listing
                            </Button>
                        </div>
                    ) : (
                        <div className="d-grid gap-3">
                            {/* Adopt Button */}
                            {pet.status === 'Adopted' ? (
                                <Button className="btn-paw-primary py-3" disabled>
                                    🏠 This pet has been adopted
                                </Button>
                            ) : hasExistingRequest ? (
                                <Button className="btn-paw-primary py-3" disabled>
                                    ✓ Adoption Request Submitted
                                </Button>
                            ) : canAdopt ? (
                                <Button
                                    className="btn-paw-primary py-3"
                                    onClick={handleOpenAdoptModal}
                                >
                                    🐾 Submit Adoption Request
                                </Button>
                            ) : pet.status !== 'Approved' ? (
                                <Button className="btn-paw-primary py-3" disabled>
                                    Not Available for Adoption
                                </Button>
                            ) : (
                                <Button
                                    className="btn-paw-primary py-3"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In to Adopt
                                </Button>
                            )}

                            <Button
                                className="btn-paw-outline py-3"
                                onClick={() => {
                                    if (!isAuthenticated) { navigate('/login'); return; }
                                    navigate('/chat');
                                }}
                            >
                                Initiate Chat with Owner
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Description Section */}
            {pet.description && (
                <Row className="g-4 mt-4">
                    <Col lg={7}>
                        <Card className="paw-card p-4">
                            <h5 className="text-white mb-3">About {pet.name}</h5>
                            <p className="text-secondary">{pet.description}</p>
                        </Card>
                    </Col>
                    <Col lg={5}>
                        {pet.medicalHistory && (
                            <Card className="paw-card p-4">
                                <h5 className="text-white mb-3">Medical History</h5>
                                <p className="text-secondary">{pet.medicalHistory}</p>
                            </Card>
                        )}
                    </Col>
                </Row>
            )}

            {/* ── Adoption Request Modal ─────────────────────────────────────────── */}
            <Modal show={showAdoptModal} onHide={() => setShowAdoptModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Modal.Title className="text-white">
                        🐾 Adoption Application — {pet.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#1E1E1E' }}>
                    {adoptError && (
                        <Alert variant="danger" dismissible onClose={() => setAdoptError(null)}>
                            {adoptError}
                        </Alert>
                    )}

                    <p className="text-secondary mb-4">
                        Please tell us a bit about yourself so the pet owner can review your application.
                        All fields are optional but filling them significantly improves your chances.
                    </p>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-secondary">Your experience with pets</Form.Label>
                        <Form.Select
                            className="paw-input"
                            name="experienceLevel"
                            value={questionnaire.experienceLevel}
                            onChange={handleQuestionnaireChange}
                        >
                            <option value="">Select your experience level</option>
                            <option value="First-time owner">First-time owner</option>
                            <option value="Some experience">Some experience</option>
                            <option value="Experienced">Experienced</option>
                            <option value="Professional/Breeder">Professional / Breeder</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-secondary">Home environment</Form.Label>
                        <Form.Select
                            className="paw-input"
                            name="homeEnvironment"
                            value={questionnaire.homeEnvironment}
                            onChange={handleQuestionnaireChange}
                        >
                            <option value="">Select your home type</option>
                            <option value="Apartment">Apartment</option>
                            <option value="House with yard">House with yard</option>
                            <option value="Farm/Rural">Farm / Rural</option>
                            <option value="Other">Other</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-secondary">Hours the pet would be left alone daily</Form.Label>
                        <Form.Control
                            type="number"
                            className="paw-input"
                            name="hoursLeftAlone"
                            value={questionnaire.hoursLeftAlone}
                            onChange={handleQuestionnaireChange}
                            min="0"
                            max="24"
                            placeholder="e.g. 4"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="text-secondary">Do you currently have other pets?</Form.Label>
                        <Form.Select
                            className="paw-input"
                            name="hasOtherPets"
                            value={questionnaire.hasOtherPets}
                            onChange={handleQuestionnaireChange}
                        >
                            <option value="">Select</option>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#141414', borderColor: 'var(--paw-border)' }}>
                    <Button variant="secondary" onClick={() => setShowAdoptModal(false)} disabled={adoptLoading}>
                        Cancel
                    </Button>
                    <Button className="btn-paw-primary" onClick={handleSubmitAdoption} disabled={adoptLoading}>
                        {adoptLoading ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Application'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default PetDetails;
