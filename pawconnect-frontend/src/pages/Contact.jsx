import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

export const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setError('Please fill in all required fields.');
            return;
        }
        // Simulate submit (no backend endpoint needed for contact form at this stage)
        setSubmitted(true);
    };

    const contactItems = [
        { icon: '📧', label: 'Email', value: 'support@pawconnect.in' },
        { icon: '📞', label: 'Phone', value: '+91 98765 43210' },
        { icon: '📍', label: 'Location', value: 'Bangalore, Karnataka, India' },
        { icon: '🕐', label: 'Response Time', value: 'Within 24 hours' },
    ];

    return (
        <Container className="py-5">
            <div className="mb-5">
                <div className="paw-script">*get in*</div>
                <h1 className="fw-bold paw-accent-header text-white display-5">
                    touch<span style={{ color: 'var(--paw-primary)' }}>.</span>
                </h1>
                <p className="text-secondary fs-6 mt-3" style={{ maxWidth: '540px' }}>
                    Have questions about adopting, listing a pet, or anything else? Our team is here to help every step of the way.
                </p>
            </div>

            <Row className="g-5">
                {/* Contact Form */}
                <Col lg={7}>
                    <Card className="paw-card p-4 p-md-5">
                        <h5 className="text-white fw-bold mb-4">Send us a message</h5>

                        {submitted ? (
                            <Alert variant="success" className="d-flex align-items-center gap-3">
                                <span style={{ fontSize: '1.5rem' }}>🐾</span>
                                <div>
                                    <strong>Thank you, {formData.name}!</strong>
                                    <div className="small mt-1">We've received your message and will get back to you within 24 hours.</div>
                                </div>
                            </Alert>
                        ) : (
                            <Form onSubmit={handleSubmit}>
                                {error && <Alert variant="danger" className="small">{error}</Alert>}

                                <Row className="g-3 mb-3">
                                    <Col sm={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Your Name *</Form.Label>
                                            <Form.Control
                                                className="paw-input"
                                                name="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Group>
                                            <Form.Label className="text-secondary small">Email Address *</Form.Label>
                                            <Form.Control
                                                className="paw-input"
                                                type="email"
                                                name="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary small">Subject</Form.Label>
                                    <Form.Select
                                        className="paw-input"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a topic…</option>
                                        <option value="adoption">Adoption Enquiry</option>
                                        <option value="listing">Pet Listing Help</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="report">Report an Issue</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="text-secondary small">Message *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        className="paw-input"
                                        name="message"
                                        placeholder="Tell us how we can help…"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button type="submit" className="btn-paw-primary w-100 py-3">
                                    Send Message 🐾
                                </Button>
                            </Form>
                        )}
                    </Card>
                </Col>

                {/* Contact Info */}
                <Col lg={5}>
                    <div className="d-flex flex-column gap-3 mb-5">
                        {contactItems.map((item, idx) => (
                            <Card key={idx} className="paw-card p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                        style={{ width: '44px', height: '44px', backgroundColor: 'rgba(224, 122, 47, 0.12)', fontSize: '1.2rem' }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="text-secondary small">{item.label}</div>
                                        <div className="text-white fw-semibold small">{item.value}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* FAQ Quick Links */}
                    <Card className="paw-card p-4">
                        <h6 className="text-white fw-bold mb-3">Frequently Asked</h6>
                        <div className="d-flex flex-column gap-2">
                            {[
                                'How does the adoption process work?',
                                'Can I list multiple pets?',
                                'How is my listing reviewed?',
                                'How do I start a chat with an adopter?',
                            ].map((q, i) => (
                                <div key={i} className="d-flex align-items-start gap-2 py-2" style={{ borderBottom: i < 3 ? '1px solid var(--paw-border)' : 'none' }}>
                                    <span style={{ color: 'var(--paw-primary)', flexShrink: 0, marginTop: '2px' }}>›</span>
                                    <span className="text-secondary small">{q}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Contact;
