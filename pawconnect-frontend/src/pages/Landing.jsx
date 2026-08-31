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

                        {/* Slide counter */}
                        <div className="d-flex align-items-center gap-3 mt-5">
                            <span className="fw-bold text-white fs-6">02<span className="text-muted fw-normal" style={{ fontSize: '0.85rem' }}>/04</span></span>
                            <div className="d-flex gap-2">
                                {[0, 1, 2, 3].map(i => (
                                    <span
                                        key={i}
                                        className="rounded-circle"
                                        style={{ width: '6px', height: '6px', backgroundColor: i === 1 ? 'var(--paw-primary)' : '#555' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </Col>

                    <Col lg={5} className="d-flex justify-content-center">
                        <div
                            className="position-relative"
                            style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}
                        >
                            {/* Decorative ring */}
                            <div
                                className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                    background: 'radial-gradient(circle at 35% 35%, #2a1a0e 0%, #0a0a0a 75%)',
                                    border: '1px solid #2a1810',
                                    boxShadow: '0 0 60px rgba(224, 122, 47, 0.08)',
                                }}
                            >
                                <div className="text-center">
                                    {/* Multiple paw emoji in a decorative arrangement */}
                                    <div style={{ fontSize: '5rem', lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(224,122,47,0.3))' }}>🐾</div>
                                    <div className="mt-3" style={{ fontSize: '1.5rem', opacity: 0.6, letterSpacing: '0.5rem' }}>🐶 🐱 🐰</div>
                                    <div
                                        className="mt-3 px-3 py-1 rounded-pill"
                                        style={{ backgroundColor: 'rgba(224,122,47,0.15)', border: '1px solid rgba(224,122,47,0.3)', display: 'inline-block' }}
                                    >
                                        <span style={{ color: 'var(--paw-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Find your companion</span>
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
