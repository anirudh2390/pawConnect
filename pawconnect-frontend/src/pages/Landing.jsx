import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const features = [
    { icon: '🐾', title: 'Real-time Chat', desc: 'Message pet owners directly through our secure, instant messaging system.' },
    { icon: '🔍', title: 'Smart Discovery', desc: 'Filter by breed, location, age, and size to find your perfect companion.' },
    { icon: '📋', title: 'Adoption Tracking', desc: 'Track every step of your adoption request — from submission to approval.' },
    { icon: '🛡️', title: 'Verified Listings', desc: 'Every listing is reviewed by our moderation team before going live.' },
];

const stats = [
    { value: '500+', label: 'Pets Listed' },
    { value: '1,200+', label: 'Happy Adoptions' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24h', label: 'Avg. Response Time' },
];

export const Landing = () => {
    return (
        <div>
            {/* ── Hero Section ── */}
            <Container className="py-5 my-3">
                <Row className="align-items-center gy-5">
                    <Col lg={7}>
                        <div className="paw-script">*pure*</div>
                        <h1 className="display-1 fw-bold paw-accent-header text-white mb-4">
                            cuteness<span style={{ color: 'var(--paw-primary)' }}>.</span>
                        </h1>
                        <p className="text-secondary fs-5 mb-5" style={{ maxWidth: '480px', lineHeight: 1.7 }}>
                            India's premium pet adoption platform. Connect directly with trusted pet owners around you and give a deserving animal a loving forever home.
                        </p>
                        <div className="d-flex flex-wrap gap-3">
                            <Button as={Link} to="/browse" className="btn-paw-primary px-4 py-3 fs-6">
                                Explore Companions
                            </Button>
                            <Button as={Link} to="/register" className="btn-paw-outline px-4 py-3 fs-6">
                                Join Free
                            </Button>
                        </div>

                    </Col>

                    <Col lg={5} className="d-flex justify-content-center">
                        <div
                            className="position-relative"
                            style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}
                        >
                            {/* Decorative ring with Image */}
                            <div
                                className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center position-relative overflow-hidden"
                                style={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(224, 122, 47, 0.3)',
                                    boxShadow: '0 0 60px rgba(224, 122, 47, 0.15)',
                                }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80"
                                    alt="Cat and dog cuddling"
                                    className="w-100 h-100 position-absolute"
                                    style={{ objectFit: 'cover', opacity: 0.85, top: 0, left: 0 }}
                                />
                                <div className="position-absolute text-center" style={{ bottom: '15%', zIndex: 2 }}>
                                    <div
                                        className="px-3 py-1 rounded-pill"
                                        style={{ backgroundColor: 'rgba(10, 10, 10, 0.65)', border: '1px solid rgba(224, 122, 47, 0.5)', display: 'inline-block', backdropFilter: 'blur(4px)' }}
                                    >
                                        <span style={{ color: 'var(--paw-primary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>Find your companion</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating stat badges */}
                            <div
                                className="position-absolute px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                                style={{ top: '12%', right: '-5%', backgroundColor: 'var(--paw-bg-card)', border: '1px solid var(--paw-border)', whiteSpace: 'nowrap' }}
                            >
                                <span style={{ fontSize: '1rem' }}>🏠</span>
                                <div>
                                    <div className="text-white fw-bold" style={{ fontSize: '0.75rem', lineHeight: 1 }}>1,200+</div>
                                    <div className="text-secondary" style={{ fontSize: '0.65rem' }}>Happy homes</div>
                                </div>
                            </div>

                            <div
                                className="position-absolute px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                                style={{ bottom: '15%', left: '-5%', backgroundColor: 'var(--paw-bg-card)', border: '1px solid var(--paw-border)', whiteSpace: 'nowrap' }}
                            >
                                <span style={{ fontSize: '1rem' }}>✅</span>
                                <div>
                                    <div className="text-white fw-bold" style={{ fontSize: '0.75rem', lineHeight: 1 }}>Verified</div>
                                    <div className="text-secondary" style={{ fontSize: '0.65rem' }}>All listings</div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* ── Stats Bar ── */}
            <div style={{ backgroundColor: 'var(--paw-bg-card)', borderTop: '1px solid var(--paw-border)', borderBottom: '1px solid var(--paw-border)' }}>
                <Container className="py-4">
                    <Row className="g-4 text-center">
                        {stats.map((s, i) => (
                            <Col key={i} xs={6} md={3}>
                                <div className="fw-bold text-white fs-4 paw-accent-header">{s.value}</div>
                                <div className="text-secondary small">{s.label}</div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>

            {/* ── Features Section ── */}
            <Container className="py-5 my-3">
                <div className="text-center mb-5">
                    <div className="paw-script">*why*</div>
                    <h2 className="fw-bold paw-accent-header text-white fs-1">
                        choose paw<span style={{ color: 'var(--paw-primary)' }}>.</span>
                    </h2>
                </div>
                <Row className="g-4">
                    {features.map((f, i) => (
                        <Col key={i} md={6} lg={3}>
                            <Card className="paw-card p-4 h-100 text-center">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                                <h6 className="text-white fw-bold mb-2">{f.title}</h6>
                                <p className="text-secondary small mb-0" style={{ lineHeight: 1.7 }}>{f.desc}</p>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* CTA */}
                <div className="text-center mt-5 pt-3">
                    <Button as={Link} to="/browse" className="btn-paw-primary px-5 py-3 fs-6">
                        Browse All Pets 🐾
                    </Button>
                </div>
            </Container>
        </div>
    );
};

export default Landing;
