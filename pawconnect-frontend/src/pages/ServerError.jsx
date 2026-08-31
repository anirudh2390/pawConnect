import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * 500 — Internal Server Error
 * Shown when something unexpected fails on the server side.
 * Does NOT expose technical error details to end users.
 */
export const ServerError = () => {
    const navigate = useNavigate();

    return (
        <Container
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: '80vh' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="paw-script mb-2">*oops*</div>
                <div className="paw-error-code mb-3">500</div>
                <h2 className="text-white fw-semibold mb-3">Something Went Wrong</h2>
                <p className="text-secondary fs-6 mb-5" style={{ maxWidth: '440px' }}>
                    We're having trouble connecting to our servers right now. Our team has been notified. Please try again in a moment.
                </p>
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                    <Button className="btn-paw-primary px-4 py-2" onClick={() => window.location.reload()}>
                        🔄 Try Again
                    </Button>
                    <Button className="btn-paw-outline px-4 py-2" as={Link} to="/">
                        🏠 Return Home
                    </Button>
                    <Button className="btn-paw-ghost px-4 py-2" onClick={() => navigate(-1)}>
                        ← Go Back
                    </Button>
                </div>
            </motion.div>

            <motion.div
                className="position-fixed"
                style={{ bottom: '8%', right: '6%', fontSize: '6rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                ⚡
            </motion.div>
        </Container>
    );
};

export default ServerError;
