import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

/**
 * PetCardSkeleton – shimmer loading placeholder for pet listing cards.
 * @param {number} count – number of skeleton cards to render (default 8)
 */
export const PetCardSkeleton = ({ count = 8 }) => (
    <Row className="g-4">
        {Array.from({ length: count }).map((_, i) => (
            <Col key={i} xs={12} sm={6} lg={4} xl={3}>
                <Card
                    className="border-0 overflow-hidden"
                    style={{ background: 'var(--paw-bg-card)', borderRadius: 'var(--paw-radius-card)', boxShadow: 'var(--paw-shadow-card)' }}
                >
                    {/* image area */}
                    <div className="paw-skeleton" style={{ height: '200px', borderRadius: 0 }} />
                    <Card.Body className="p-3">
                        {/* title */}
                        <div className="paw-skeleton paw-skeleton-text" style={{ width: '60%' }} />
                        {/* subtitle */}
                        <div className="paw-skeleton paw-skeleton-text" style={{ width: '40%' }} />
                        {/* tags row */}
                        <div className="d-flex gap-2 mt-3">
                            <div className="paw-skeleton" style={{ height: '22px', width: '55px', borderRadius: '100px' }} />
                            <div className="paw-skeleton" style={{ height: '22px', width: '45px', borderRadius: '100px' }} />
                            <div className="paw-skeleton" style={{ height: '22px', width: '60px', borderRadius: '100px' }} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        ))}
    </Row>
);

/**
 * StatCardSkeleton – shimmer placeholder for dashboard/admin stat cards.
 */
export const StatCardSkeleton = ({ count = 4 }) => (
    <Row className="g-3 mb-4">
        {Array.from({ length: count }).map((_, i) => (
            <Col key={i} xs={6} md={3}>
                <div
                    className="p-4"
                    style={{ background: 'var(--paw-bg-card)', borderRadius: 'var(--paw-radius-card)', border: '1px solid var(--paw-border)' }}
                >
                    <div className="paw-skeleton paw-skeleton-text" style={{ width: '35%' }} />
                    <div className="paw-skeleton" style={{ height: '32px', width: '55%', borderRadius: '6px', marginTop: '8px' }} />
                    <div className="paw-skeleton paw-skeleton-text mt-2" style={{ width: '65%' }} />
                </div>
            </Col>
        ))}
    </Row>
);

/**
 * ListSkeleton – shimmer placeholder for list-based content (chat, users, notifications).
 */
export const ListSkeleton = ({ count = 5, showAvatar = true }) => (
    <div className="d-flex flex-column gap-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-3 p-3"
                style={{ background: 'var(--paw-bg-card)', borderRadius: 'var(--paw-radius-sm)', border: '1px solid var(--paw-border)' }}
            >
                {showAvatar && (
                    <div className="paw-skeleton paw-skeleton-avatar flex-shrink-0" />
                )}
                <div className="flex-grow-1">
                    <div className="paw-skeleton paw-skeleton-text" style={{ width: '45%' }} />
                    <div className="paw-skeleton paw-skeleton-text" style={{ width: '70%' }} />
                </div>
            </div>
        ))}
    </div>
);

export default PetCardSkeleton;
