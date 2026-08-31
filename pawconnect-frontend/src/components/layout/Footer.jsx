import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const CustomFooter = () => (
    <footer
        className="mt-auto py-5"
        style={{ borderTop: '1px solid var(--paw-border)', background: 'var(--paw-bg-card)' }}
    >
        <Container>
            <Row className="gy-4 mb-4">
                {/* Brand */}
                <Col md={4}>
                    <Link to="/" className="paw-accent-header fs-3 text-white text-decoration-none d-inline-block mb-3">
                        paw<span style={{ color: 'var(--paw-primary)' }}>.</span>
                    </Link>
                    <p className="text-secondary small" style={{ maxWidth: '260px', lineHeight: 1.7 }}>
                        India's modern pet adoption platform. Connecting families with their perfect companions since 2025.
                    </p>
                </Col>

                {/* Navigation */}
                <Col xs={6} md={2}>
                    <p className="text-white fw-semibold small mb-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Explore</p>
                    <div className="d-flex flex-column gap-2">
                        {[
                            { to: '/browse', label: 'Browse Pets' },
                            { to: '/contact', label: 'Contact' },
                        ].map(({ to, label }) => (
                            <Link key={to} to={to}
                                className="text-secondary text-decoration-none"
                                style={{ fontSize: '0.875rem', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#fff'}
                                onMouseLeave={e => e.target.style.color = ''}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </Col>

                {/* Account */}
                <Col xs={6} md={2}>
                    <p className="text-white fw-semibold small mb-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Account</p>
                    <div className="d-flex flex-column gap-2">
                        {[
                            { to: '/login', label: 'Sign In' },
                            { to: '/register', label: 'Join Free' },
                            { to: '/dashboard', label: 'Dashboard' },
                        ].map(({ to, label }) => (
                            <Link key={to} to={to}
                                className="text-secondary text-decoration-none"
                                style={{ fontSize: '0.875rem', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#fff'}
                                onMouseLeave={e => e.target.style.color = ''}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </Col>

                {/* Stats */}
                <Col md={4}>
                    <p className="text-white fw-semibold small mb-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>By the numbers</p>
                    <div className="d-flex gap-4">
                        {[
                            { value: '500+', label: 'Pets Listed' },
                            { value: '1,200+', label: 'Adoptions' },
                            { value: '98%', label: 'Satisfaction' },
                        ].map(s => (
                            <div key={s.label}>
                                <div className="fw-bold text-white">{s.value}</div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </Col>
            </Row>

            <hr style={{ borderColor: 'var(--paw-border)', opacity: 1 }} />

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    &copy; 2026 PawConnect — Registered Mini-Project. All rights reserved.
                </span>
            </div>
        </Container>
    </footer>
);

export default CustomFooter;
