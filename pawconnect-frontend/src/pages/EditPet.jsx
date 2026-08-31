import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const EditPet = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        type: 'Dog',
        breed: '',
        age: { number: 1, unit: 'Years' },
        gender: 'Male',
        size: 'Medium',
        vaccinationStatus: 'None',
        description: '',
        medicalHistory: '',
        location: { city: '', state: '' },
    });

    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        fetchPetDetails();
    }, [id]);

    const fetchPetDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/pets/${id}`);

            if (response.data?.status === 'success') {
                const pet = response.data.pet;

                // Verify ownership
                if (pet.listerId._id !== user.id && pet.listerId !== user.id) {
                    setError('You do not have permission to edit this listing');
                    return;
                }

                setFormData({
                    name: pet.name,
                    type: pet.type,
                    breed: pet.breed,
                    age: pet.age || { number: 1, unit: 'Years' },
                    gender: pet.gender,
                    size: pet.size,
                    vaccinationStatus: pet.vaccinationStatus,
                    description: pet.description || '',
                    medicalHistory: pet.medicalHistory || '',
                    location: pet.location || { city: '', state: '' },
                });
                setExistingImages(pet.imageUrls || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load pet details');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: isNaN(value) ? value : Number(value) }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        // Validate total images
        if (existingImages.length + images.length + files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        // Validate file types
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        for (let file of files) {
            if (!validTypes.includes(file.type)) {
                setError('Only JPEG, PNG, GIF, and WebP images are allowed');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Each image must be less than 5MB');
                return;
            }
        }

        setImages(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
        setError(null);
    };

    const handleRemoveExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) errors.name = 'Pet name is required';
        if (!formData.breed.trim()) errors.breed = 'Breed is required';
        if (!formData.location.city.trim()) errors['location.city'] = 'City is required';
        if (existingImages.length === 0 && images.length === 0) {
            errors.images = 'At least one image is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setError('Please fix the errors below');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const formDataToSend = new FormData();

            // Add form fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('breed', formData.breed);
            formDataToSend.append('age', JSON.stringify(formData.age));
            formDataToSend.append('gender', formData.gender);
            formDataToSend.append('size', formData.size);
            formDataToSend.append('vaccinationStatus', formData.vaccinationStatus);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('medicalHistory', formData.medicalHistory);
            formDataToSend.append('location', JSON.stringify(formData.location));

            // Add new images only
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await api.put(`/pets/${id}`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.status === 'success') {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update listing. Please try again.';
            setError(message);
            if (err.response?.data?.errors) {
                setFieldErrors(err.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-5">
                <div className="text-center">
                    <Spinner animation="border" className="text-warning" />
                    <p className="text-secondary mt-3">Loading pet details...</p>
                </div>
            </Container>
        );
    }

    if (error && loading === false && !formData.name) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={() => navigate('/dashboard')} className="btn-paw-primary">
                    Back to Dashboard
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: '800px' }}>
            <div className="mb-4">
                <h1 className="fw-bold paw-accent-header text-white display-6">
                    edit listing<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </h1>
                <p className="text-secondary">Update your pet's information. Changes will be reviewed before publication.</p>
            </div>

            {success && (
                <Alert variant="success">
                    Pet listing updated successfully! Redirecting to dashboard...
                </Alert>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="paw-card p-5">
                <Form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Form.Group controlId="petName">
                                <Form.Label className="text-secondary">Pet Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Rex"
                                    className="paw-input"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    isInvalid={!!fieldErrors.name}
                                />
                                {fieldErrors.name && (
                                    <Form.Control.Feedback type="invalid" className="d-block">
                                        {fieldErrors.name}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="petType">
                                <Form.Label className="text-secondary">Pet Type *</Form.Label>
                                <Form.Select
                                    className="paw-input"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                >
                                    <option>Dog</option>
                                    <option>Cat</option>
                                    <option>Other</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Breed and Gender */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Form.Group controlId="petBreed">
                                <Form.Label className="text-secondary">Breed *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. German Shepherd"
                                    className="paw-input"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleInputChange}
                                    isInvalid={!!fieldErrors.breed}
                                />
                                {fieldErrors.breed && (
                                    <Form.Control.Feedback type="invalid" className="d-block">
                                        {fieldErrors.breed}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="petGender">
                                <Form.Label className="text-secondary">Gender *</Form.Label>
                                <Form.Select
                                    className="paw-input"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Age and Size */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-secondary">Age</Form.Label>
                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Form.Control
                                            type="number"
                                            placeholder="Number"
                                            className="paw-input"
                                            name="age.number"
                                            value={formData.age.number}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Select
                                            className="paw-input"
                                            name="age.unit"
                                            value={formData.age.unit}
                                            onChange={handleInputChange}
                                        >
                                            <option>Months</option>
                                            <option>Years</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="petSize">
                                <Form.Label className="text-secondary">Size *</Form.Label>
                                <Form.Select
                                    className="paw-input"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleInputChange}
                                >
                                    <option>Small</option>
                                    <option>Medium</option>
                                    <option>Large</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Vaccination and Medical */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Form.Group controlId="vaccination">
                                <Form.Label className="text-secondary">Vaccination Status</Form.Label>
                                <Form.Select
                                    className="paw-input"
                                    name="vaccinationStatus"
                                    value={formData.vaccinationStatus}
                                    onChange={handleInputChange}
                                >
                                    <option>None</option>
                                    <option>Partially</option>
                                    <option>Fully</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="medicalHistory">
                                <Form.Label className="text-secondary">Medical History</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Any past conditions or treatments"
                                    className="paw-input"
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Description */}
                    <Form.Group className="mb-4">
                        <Form.Label className="text-secondary">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            placeholder="Tell us about this pet's personality, behavior, special traits..."
                            className="paw-input"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                        />
                    </Form.Group>

                    {/* Location */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Form.Group controlId="city">
                                <Form.Label className="text-secondary">City *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. New York"
                                    className="paw-input"
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleInputChange}
                                    isInvalid={!!fieldErrors['location.city']}
                                />
                                {fieldErrors['location.city'] && (
                                    <Form.Control.Feedback type="invalid" className="d-block">
                                        {fieldErrors['location.city']}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="state">
                                <Form.Label className="text-secondary">State</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. NY"
                                    className="paw-input"
                                    name="location.state"
                                    value={formData.location.state}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="mb-4">
                            <Form.Label className="text-secondary">Current Images ({existingImages.length})</Form.Label>
                            <Row className="g-3 mb-3">
                                {existingImages.map((url, index) => (
                                    <Col xs={6} md={4} key={index}>
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={url}
                                                alt={`Current ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid var(--paw-primary)'
                                                }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveExistingImage(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    right: '5px'
                                                }}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}

                    {/* Image Upload */}
                    {existingImages.length + images.length < 5 && (
                        <Form.Group className="mb-4">
                            <Form.Label className="text-secondary">Add More Images (Max {5 - existingImages.length - images.length} remaining)</Form.Label>
                            <Form.Control
                                type="file"
                                multiple
                                accept="image/*"
                                className="paw-input"
                                onChange={handleImageUpload}
                            />
                            <small className="text-secondary d-block mt-2">
                                Supported formats: JPEG, PNG, GIF, WebP. Max 5MB per image.
                            </small>
                        </Form.Group>
                    )}

                    {/* New Image Previews */}
                    {previewUrls.length > 0 && (
                        <div className="mb-4">
                            <Form.Label className="text-secondary">New Images Preview ({images.length})</Form.Label>
                            <Row className="g-3">
                                {previewUrls.map((url, index) => (
                                    <Col xs={6} md={4} key={index}>
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={url}
                                                alt={`New ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid #ffc107'
                                                }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveNewImage(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    right: '5px'
                                                }}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <Row className="g-3">
                        <Col xs={12} sm={6}>
                            <Button
                                type="submit"
                                className="btn-paw-primary w-100"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner size="sm" className="me-2" animation="border" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Listing'
                                )}
                            </Button>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Button
                                type="button"
                                className="btn-outline-secondary w-100"
                                onClick={() => navigate('/dashboard')}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </Container>
    );
};

export default EditPet;
