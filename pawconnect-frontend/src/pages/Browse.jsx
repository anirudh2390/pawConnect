import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { PetCardSkeleton } from '../components/ui/Skeletons';

const categoryOptions = ['Dog', 'Cat', 'Other'];
const genderOptions = ['Male', 'Female'];
const vaccinationOptions = ['Fully', 'Partially', 'None'];
const ageOptions = [
    { value: 'All', label: 'All Ages' },
    { value: 'Puppy', label: 'Puppy (< 1 yr)' },
    { value: 'Young', label: 'Young (1–3 yrs)' },
    { value: 'Adult', label: 'Adult (3–7 yrs)' },
    { value: 'Senior', label: 'Senior (7+ yrs)' },
];
const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'nameAsc', label: 'Name (A–Z)' },
    { value: 'nameDesc', label: 'Name (Z–A)' },
];

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' } }),
};

export const Browse = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPets, setTotalPets] = useState(0);
    const itemsPerPage = 9;

    const [filters, setFilters] = useState({
        search: '', category: [], breed: '', location: '',
        gender: [], ageRange: 'All', vaccination: [],
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchPets(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (currentPage !== 1) fetchPets(); }, [currentPage]);

    const buildQueryParams = (page = currentPage, sortValue = sortBy) => {
        const params = { sort: sortValue, page, limit: itemsPerPage };
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.category.length) params.type = filters.category.join(',');
        if (filters.breed.trim()) params.breed = filters.breed.trim();
        if (filters.location.trim()) params.location = filters.location.trim();
        if (filters.gender.length) params.gender = filters.gender.join(',');
        if (filters.vaccination.length) params.vaccinationStatus = filters.vaccination.join(',');
        if (filters.ageRange !== 'All') params.ageRange = filters.ageRange;
        return params;
    };

    const fetchPets = async (page = currentPage, sortValue = sortBy) => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/pets', { params: buildQueryParams(page, sortValue) });
            if (data?.status === 'success') {
                setPets(data.pets || []);
                setTotalPets(data.totalCount || 0);
                setTotalPages(data.totalPages || 1);
                setCurrentPage(data.page || 1);
            }
        } catch (err) {
            setError('Unable to load pets. Please try again later.');
            console.error('Browse pets error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const toggleFilterOption = (field, value) => setFilters(prev => {
        const vals = prev[field] || [];
        return { ...prev, [field]: vals.includes(value) ? vals.filter(v => v !== value) : [...vals, value] };
    });
    const handleApplyFilters = (e) => { e.preventDefault(); setCurrentPage(1); fetchPets(1); };
    const handleResetFilters = () => {
        const reset = { search: '', category: [], breed: '', location: '', gender: [], ageRange: 'All', vaccination: [] };
        setFilters(reset); setSortBy('newest'); setCurrentPage(1);
        fetchPets(1, 'newest');
    };
    const handleSortChange = (e) => { setSortBy(e.target.value); setCurrentPage(1); fetchPets(1, e.target.value); };
    const handlePageChange = (page) => { if (page !== currentPage) setCurrentPage(page); };

    const typeColors = { Dog: '#E07A2F', Cat: '#a855f7', Other: '#3b82f6' };

    return (
        <Container className="py-4">
            {/* Page header */}
            <div className="mb-4">
                <div className="paw-script">*discover*</div>
                <h1 className="fw-bold paw-accent-header text-white display-5 mb-1">
                    Find your companion<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </h1>
                <p className="text-secondary">Browse verified pets available for adoption across India.</p>
            </div>

            <Row className="g-4">
                {/* Filters sidebar */}
                <Col lg={3}>
                    <Card className="paw-card p-4" style={{ position: 'sticky', top: '80px' }}>
                        <h6 className="text-white fw-semibold mb-4 d-flex align-items-center gap-2">
                            <span>🔍</span> Filters
                        </h6>
                        <Form onSubmit={handleApplyFilters}>
                            {/* Search */}
                            <Form.Group className="mb-3" controlId="browse-search">
                                <Form.Label className="paw-label">Keyword search</Form.Label>
                                <Form.Control
                                    type="text" name="search" value={filters.search}
                                    placeholder="Name, breed, location…"
                                    className="paw-input" onChange={handleInputChange}
                                    aria-label="Search pets by keyword"
                                />
                            </Form.Group>

                            {/* Category */}
                            <Form.Group className="mb-3">
                                <Form.Label className="paw-label">Category</Form.Label>
                                <div className="d-flex flex-column gap-2">
                                    {categoryOptions.map(opt => (
                                        <Form.Check key={opt} type="checkbox" id={`cat-${opt}`}
                                            label={opt} checked={filters.category.includes(opt)}
                                            onChange={() => toggleFilterOption('category', opt)}
                                            className="text-secondary"
                                        />
                                    ))}
                                </div>
                            </Form.Group>

                            {/* Breed */}
                            <Form.Group className="mb-3" controlId="browse-breed">
                                <Form.Label className="paw-label">Breed</Form.Label>
                                <Form.Control type="text" name="breed" value={filters.breed}
                                    placeholder="e.g. Labrador" className="paw-input" onChange={handleInputChange} />
                            </Form.Group>

                            {/* Location */}
                            <Form.Group className="mb-3" controlId="browse-location">
                                <Form.Label className="paw-label">Location</Form.Label>
                                <Form.Control type="text" name="location" value={filters.location}
                                    placeholder="City or state" className="paw-input" onChange={handleInputChange} />
                            </Form.Group>

                            {/* Gender */}
                            <Form.Group className="mb-3">
                                <Form.Label className="paw-label">Gender</Form.Label>
                                <div className="d-flex flex-column gap-2">
                                    {genderOptions.map(opt => (
                                        <Form.Check key={opt} type="checkbox" id={`gen-${opt}`}
                                            label={opt} checked={filters.gender.includes(opt)}
                                            onChange={() => toggleFilterOption('gender', opt)}
                                            className="text-secondary"
                                        />
                                    ))}
                                </div>
                            </Form.Group>

                            {/* Age */}
                            <Form.Group className="mb-3" controlId="browse-age">
                                <Form.Label className="paw-label">Age Range</Form.Label>
                                <Form.Select name="ageRange" value={filters.ageRange}
                                    onChange={handleInputChange} className="paw-input">
                                    {ageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Form.Select>
                            </Form.Group>

                            {/* Vaccination */}
                            <Form.Group className="mb-4">
                                <Form.Label className="paw-label">Vaccination</Form.Label>
                                <div className="d-flex flex-column gap-2">
                                    {vaccinationOptions.map(opt => (
                                        <Form.Check key={opt} type="checkbox" id={`vac-${opt}`}
                                            label={opt} checked={filters.vaccination.includes(opt)}
                                            onChange={() => toggleFilterOption('vaccination', opt)}
                                            className="text-secondary"
                                        />
                                    ))}
                                </div>
                            </Form.Group>

                            <Button type="submit" className="btn-paw-primary w-100 mb-2">Apply Filters</Button>
                            <Button type="button" variant="outline-secondary" className="w-100"
                                onClick={handleResetFilters}>Reset</Button>
                        </Form>
                    </Card>
                </Col>

                {/* Results */}
                <Col lg={9}>
                    {/* Toolbar */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            {!loading && !error && (
                                <p className="text-secondary mb-0 small">
                                    Showing <strong className="text-white">{pets.length}</strong> of{' '}
                                    <strong className="text-white">{totalPets}</strong> pets
                                </p>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-secondary small">Sort:</span>
                            <Form.Select value={sortBy} onChange={handleSortChange}
                                className="paw-input" style={{ minWidth: '160px' }} aria-label="Sort pets">
                                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Form.Select>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <PetCardSkeleton count={9} />
                    ) : error ? (
                        <Alert variant="danger" className="rounded-3">{error}</Alert>
                    ) : pets.length === 0 ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: '3rem', opacity: 0.3 }}>🐾</div>
                            <h5 className="text-white mt-3">No pets found</h5>
                            <p className="text-secondary">Try broader search criteria or reset your filters.</p>
                            <Button className="btn-paw-outline" onClick={handleResetFilters}>Clear Filters</Button>
                        </div>
                    ) : (
                        <>
                            <Row className="g-4">
                                <AnimatePresence>
                                    {pets.map((pet, i) => (
                                        <Col xs={12} sm={6} lg={4} key={pet._id}>
                                            <motion.div
                                                custom={i}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="visible"
                                                layout
                                            >
                                                <Link to={`/pet/${pet._id}`} style={{ textDecoration: 'none' }}>
                                                    <Card className="paw-pet-card h-100">
                                                        {/* Image */}
                                                        <div className="card-img-wrapper" style={{ height: '210px', backgroundColor: 'var(--paw-bg-surface)' }}>
                                                            {pet.imageUrls?.length > 0 ? (
                                                                <img
                                                                    src={pet.imageUrls[0]}
                                                                    alt={`${pet.name} - ${pet.breed}`}
                                                                    loading="lazy"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="d-flex align-items-center justify-content-center h-100">
                                                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>🐾</span>
                                                                </div>
                                                            )}
                                                            {/* Type badge overlay */}
                                                            <div className="position-absolute" style={{ top: '10px', left: '10px' }}>
                                                                <span className="paw-badge" style={{
                                                                    background: `${typeColors[pet.type] || '#555'}22`,
                                                                    color: typeColors[pet.type] || '#aaa',
                                                                    border: `1px solid ${typeColors[pet.type] || '#555'}44`,
                                                                    fontSize: '0.65rem',
                                                                }}>{pet.type}</span>
                                                            </div>
                                                        </div>

                                                        {/* Body */}
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h6 className="text-white fw-bold mb-0">{pet.name}</h6>
                                                                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                                                                    {pet.gender === 'Male' ? '♂' : '♀'}
                                                                </span>
                                                            </div>
                                                            <p className="text-secondary mb-2" style={{ fontSize: '0.8rem' }}>
                                                                {pet.breed} · {pet.age?.number} {pet.age?.unit}
                                                            </p>
                                                            <div className="d-flex align-items-center gap-1 text-secondary mb-3" style={{ fontSize: '0.78rem' }}>
                                                                <span>📍</span>
                                                                <span>{pet.location?.city}{pet.location?.state ? `, ${pet.location.state}` : ''}</span>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                <span className="paw-badge paw-badge-primary">{pet.size || 'Medium'}</span>
                                                                {pet.vaccinationStatus === 'Fully' && (
                                                                    <span className="paw-badge paw-badge-success">Vaccinated</span>
                                                                )}
                                                                {pet.neutered && (
                                                                    <span className="paw-badge paw-badge-info">Neutered</span>
                                                                )}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Link>
                                            </motion.div>
                                        </Col>
                                    ))}
                                </AnimatePresence>
                            </Row>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}>
                                        ← Prev
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button key={page} size="sm"
                                            className={page === currentPage ? 'btn-paw-primary' : 'btn-paw-outline'}
                                            onClick={() => handlePageChange(page)}>
                                            {page}
                                        </Button>
                                    ))}
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}>
                                        Next →
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Browse;
