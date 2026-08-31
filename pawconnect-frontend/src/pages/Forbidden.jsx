import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * 403 — Access Denied / Unauthorized
 * Shown when the user tries to access a resource they don't have permission for.
 */
export const Forbidden = () => {
    const navigate = useNavigate();

    return (
        <Container
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: '80vh' }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                <div className="paw-script mb-2">*restricted*</div>
                <div className="paw-error-code mb-3">403</div>
                <h2 className="text-white fw-semibold mb-3">Access Denied</h2>
                <p className="text-secondary fs-6 mb-5" style={{ maxWidth: '420px' }}>
                    You don't have permission to view this page. If you think this is a mistake, please contact support.
                </p>
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                    <Button className="btn-paw-primary px-4 py-2" as={Link} to="/">
                        🏠 Return Home
                    </Button>
                    <Button className="btn-paw-outline px-4 py-2" onClick={() => navigate(-1)}>
                        ← Go Back
                    </Button>
                </div>
            </motion.div>

            <motion.div
                className="position-fixed"
                style={{ bottom: '8%', right: '6%', fontSize: '6rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
                🔒
            </motion.div>
        </Container>
    );
};

export default Forbidden;
