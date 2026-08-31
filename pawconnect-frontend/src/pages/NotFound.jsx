import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: '80vh' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="paw-script mb-2">*lost*</div>
                <div className="paw-error-code mb-3">
                    404<span style={{ color: 'var(--paw-primary)', WebkitTextFillColor: 'var(--paw-primary)' }}>.</span>
                </div>
                <h2 className="text-white fw-semibold mb-3">Page Not Found</h2>
                <p className="text-secondary fs-6 mb-5" style={{ maxWidth: '420px' }}>
                    The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                    <Button className="btn-paw-primary px-4 py-2" as={Link} to="/">
                        🏠 Return Home
                    </Button>
                    <Button
                        className="btn-paw-outline px-4 py-2"
                        onClick={() => navigate(-1)}
                    >
                        ← Go Back
                    </Button>
                </div>
            </motion.div>

            {/* decorative paw */}
            <motion.div
                className="position-fixed"
                style={{ bottom: '8%', right: '6%', fontSize: '6rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
                🐾
            </motion.div>
        </Container>
    );
};

export default NotFound;
