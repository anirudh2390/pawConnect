import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Login form status hooks
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validated, setValidated] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Forgot password modal status hooks
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState(null);
    const [forgotSuccess, setForgotSuccess] = useState(null);

    // Form submission handler
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        const result = await login(email, password, rememberMe);
        setLoading(false);

        if (result.success) {
            setSuccessMsg('Logged in successfully! Redirecting...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } else {
            setErrorMsg(result.message || 'Invalid email or password.');
        }
    };

    // Forgot password submit handler
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError(null);
        setForgotSuccess(null);

        if (!forgotEmail) {
            setForgotError('Please enter your email address');
            return;
        }

        setForgotLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email: forgotEmail });
            if (response.data?.status === 'success') {
                setForgotSuccess(response.data.message || 'Password reset link sent to your email.');
            } else {
                setForgotError('Failed to send recovery details.');
            }
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Error executing request.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '75vh' }}>
            <Card className="paw-card p-4 p-sm-5 ms-shadow d-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
                <div className="text-center mb-4">
                    {/* Theme visual cursive title above header branding */}
                    <div className="paw-script">*welcome back*</div>
                    <h2 className="paw-accent-header text-white fw-bold mb-1">
                        signin<span style={{ color: 'var(--paw-primary)' }}>.</span>
                    </h2>
                    <p className="text-secondary fs-7">Connect with your adoption workspace</p>
                </div>

                {errorMsg && (
                    <Alert variant="danger" className="border-0 bg-danger text-white py-2 fs-7 mb-4">
                        ⚠️ {errorMsg}
                    </Alert>
                )}

                {successMsg && (
                    <Alert variant="success" className="border-0 bg-success text-white py-2 fs-7 mb-4 animate-fade">
                        ✓ {successMsg}
                    </Alert>
                )}

                <Form noValidate validated={validated} onSubmit={handleLoginSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label className="text-secondary fs-7">Email Address</Form.Label>
                        <Form.Control
                            required
                            type="email"
                            placeholder="example@pawconnect.org"
                            className="paw-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 text-warning mt-1">
                            Please provide a valid email format.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="password">
                        <div className="d-flex justify-content-between align-items-center">
                            <Form.Label className="text-secondary fs-7">Password</Form.Label>
                            <Button
                                variant="link"
                                className="text-secondary hover-orange text-decoration-none fs-8 p-0"
                                onClick={() => setShowForgotModal(true)}
                                disabled={loading}
                                type="button"
                            >
                                Forgot Password?
                            </Button>
                        </div>
                        <Form.Control
                            required
                            type="password"
                            placeholder="••••••••••••"
                            className="paw-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 text-warning mt-1">
                            Please enter your password.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="rememberMe">
                        <Form.Check
                            type="checkbox"
                            label="Remember this computer log-session"
                            className="text-secondary fs-8 custom-checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={loading}
                        />
                    </Form.Group>

                    <Button type="submit" className="btn-paw-primary w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </Form>

                <div className="text-center mt-4 text-secondary fs-7">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-white text-decoration-none fw-bold hover-orange">
                        Create Account
                    </Link>
                </div>
            </Card>

            {/* Forgot Password Modal */}
            <Modal
                show={showForgotModal}
                onHide={() => {
                    setShowForgotModal(false);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotEmail('');
                }}
                centered
                contentClassName="paw-card bg-dark border"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom-0 pb-0">
                    <Modal.Title className="text-white fw-bold fs-5">Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    <p className="text-secondary fs-7 mb-4">
                        Enter your registered email address below, and we will send you password reset recovery instructions.
                    </p>

                    {forgotError && <Alert variant="danger" className="border-0 bg-danger text-white py-2 fs-7 mb-3">⚠️ {forgotError}</Alert>}
                    {forgotSuccess && <Alert variant="success" className="border-0 bg-success text-white py-2 fs-7 mb-3">✓ {forgotSuccess}</Alert>}

                    <Form onSubmit={handleForgotSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-secondary fs-7">Registered Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="example@pawconnect.org"
                                className="paw-input"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                disabled={forgotLoading}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="secondary"
                                className="btn-paw-outline"
                                onClick={() => setShowForgotModal(false)}
                                disabled={forgotLoading}
                            >
                                Close
                            </Button>
                            <Button
                                type="submit"
                                className="btn-paw-primary"
                                disabled={forgotLoading}
                            >
                                {forgotLoading ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Login;
