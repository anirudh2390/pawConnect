import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [validated, setValidated] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword: password,
            });

            if (response.data?.status === 'success') {
                setSuccessMsg(response.data.message || 'Password updated successfully!');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setErrorMsg('Failed to reset password.');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Error executing request. Token might be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
            <Card className="paw-card p-4 p-sm-5 ms-shadow d-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
                <div className="text-center mb-4">
                    <div className="paw-script">*secure account*</div>
                    <h2 className="paw-accent-header text-white fw-bold mb-1">
                        reset<span style={{ color: 'var(--paw-primary)' }}>.</span>
                    </h2>
                    <p className="text-secondary fs-7">Enter your new password below</p>
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

                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="password">
                        <Form.Label className="text-secondary fs-7">New Password</Form.Label>
                        <Form.Control
                            required
                            type="password"
                            placeholder="••••••••••••"
                            className="paw-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || successMsg}
                            minLength={6}
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 text-warning mt-1">
                            Password must be at least 6 characters.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="confirmPassword">
                        <Form.Label className="text-secondary fs-7">Confirm Password</Form.Label>
                        <Form.Control
                            required
                            type="password"
                            placeholder="••••••••••••"
                            className="paw-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || successMsg}
                            minLength={6}
                        />
                        <Form.Control.Feedback type="invalid" className="fs-8 text-warning mt-1">
                            Please confirm your new password.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Button type="submit" className="btn-paw-primary w-100 py-2 d-flex align-items-center justify-content-center" disabled={loading || successMsg}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </Form>

                <div className="text-center mt-4 text-secondary fs-7">
                    <Link to="/login" className="text-white text-decoration-none fw-bold hover-orange">
                        Back to Login
                    </Link>
                </div>
            </Card>
        </Container>
    );
};

export default ResetPassword;
