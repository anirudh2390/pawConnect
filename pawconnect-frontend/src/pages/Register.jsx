import React, { useState } from 'react';
import { Container, Card, Form, Button, ProgressBar, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    // Wizard active step tracker
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Form Fields State Hooks
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2 Fields State Hooks
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Validation local state indicators
    const [validated, setValidated] = useState(false);

    // Email format validator regex
    const validateEmailFormat = (input) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    };

    // Navigating to second step checkpoint
    const handleNextStep = (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name || !email || !password || !confirmPassword) {
            setErrorMsg('All credential fields are required.');
            return;
        }

        if (!validateEmailFormat(email)) {
            setErrorMsg('Please supply a valid email address format.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password length must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match. Re-enter matching values.');
            return;
        }

        // Step 1 check succeeded, transition forward
        setStep(2);
        setErrorMsg(null);
    };

    // Submit complete registration details
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!city || !state || !phoneNumber) {
            setErrorMsg('Please fill in your location and phone details to finalize onboarding.');
            setValidated(true);
            return;
        }

        // Basic phone pattern verification
        if (!/^[0-9+\s-]{8,15}$/.test(phoneNumber)) {
            setErrorMsg('Invalid phone pattern details. Please type 8-15 digits.');
            return;
        }

        setLoading(true);
        const result = await register(name, email, password, { city, state }, phoneNumber);
        setLoading(false);

        if (result.success) {
            setSuccessMsg('Account created successfully! Auto signing in...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } else {
            setErrorMsg(result.message || 'Onboarding failed. Please try again.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
            <Card className="paw-card p-4 p-sm-5 ms-shadow d-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
                <div className="mb-4">
                    <div className="paw-script">*join community*</div>
                    <h2 className="paw-accent-header text-white fw-bold mb-1">
                        onboard<span style={{ color: 'var(--paw-primary)' }}>.</span>
                    </h2>
                    <p className="text-secondary fs-7">Connect with local pet shelters & adopters</p>

                    <div className="d-flex align-items-center justify-content-between mt-3 text-secondary fs-8">
                        <span>Step {step} of 2</span>
                        <span>{step === 1 ? '50%' : '100%'} Complete</span>
                    </div>
                    <ProgressBar
                        now={step === 1 ? 50 : 100}
                        className="mt-2"
                        style={{ height: '4px', backgroundColor: '#222' }}
                        variant="warning"
                    />
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

                {step === 1 ? (
                    // Step 1: Base Credentials
                    <Form onSubmit={handleNextStep}>
                        <Form.Group className="mb-3" controlId="name">
                            <Form.Label className="text-secondary fs-7">Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your full name"
                                className="paw-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label className="text-secondary fs-7">Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="example@pawconnect.org"
                                className="paw-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label className="text-secondary fs-7">Create Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Must be at least 6 characters"
                                className="paw-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="confirmPassword">
                            <Form.Label className="text-secondary fs-7">Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Repeat password key to check typos"
                                className="paw-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button type="submit" className="btn-paw-primary w-100 py-2">
                            Next Step
                        </Button>
                    </Form>
                ) : (
                    // Step 2: Contact & Location details
                    <Form noValidate validated={validated} onSubmit={handleRegisterSubmit}>
                        <Row className="g-3 mb-3">
                            <Col xs={6}>
                                <Form.Group controlId="city">
                                    <Form.Label className="text-secondary fs-7">City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. NYC"
                                        className="paw-input"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6}>
                                <Form.Group controlId="state">
                                    <Form.Label className="text-secondary fs-7">State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. NY"
                                        className="paw-input"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4" controlId="phone">
                            <Form.Label className="text-secondary fs-7">Contact Number</Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="e.g. +1 555-0199"
                                className="paw-input"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <Form.Control.Feedback type="invalid" className="fs-8 mt-1">
                                A contact number is required.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button
                                variant="secondary"
                                className="btn-paw-outline w-50"
                                onClick={() => setStep(1)}
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="btn-paw-primary w-50 d-flex align-items-center justify-content-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Finishing...
                                    </>
                                ) : (
                                    'Sign Up'
                                )}
                            </Button>
                        </div>
                    </Form>
                )}

                <div className="text-center mt-4 text-secondary fs-7">
                    Already have an account?{' '}
                    <Link to="/login" className="text-white text-decoration-none fw-bold hover-orange">
                        Log In
                    </Link>
                </div>
            </Card>
        </Container>
    );
};

export default Register;
