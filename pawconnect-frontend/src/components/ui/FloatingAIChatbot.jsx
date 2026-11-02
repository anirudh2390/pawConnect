import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

const FloatingAIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi there! I am PawConnect AI. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);

        try {
            const response = await api.post('/chatbot', {
                message: userText,
                history: messages
            });
            
            setMessages(prev => [...prev, { role: 'model', text: response.data.reply }]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="card shadow-lg mb-3"
                        style={{
                            width: '350px',
                            height: '500px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--paw-bg-card)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div className="p-3 d-flex justify-content-between align-items-center text-white" style={{ backgroundColor: 'var(--paw-primary)' }}>
                            <div className="d-flex align-items-center gap-2">
                                <Bot size={24} />
                                <h6 className="mb-0 fw-bold">PawConnect AI</h6>
                            </div>
                            <button onClick={toggleChat} className="btn btn-sm btn-link text-white p-0">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: 'var(--paw-bg-deep)' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                    {msg.role === 'model' && (
                                        <div className="me-2 mt-1 rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                            <Bot size={16} className="text-white" />
                                        </div>
                                    )}
                                    <div 
                                        className={`p-2 px-3 rounded-4 ${msg.role === 'user' ? 'text-white' : 'text-light'}`}
                                        style={{ 
                                            maxWidth: '75%', 
                                            backgroundColor: msg.role === 'user' ? 'var(--paw-primary)' : 'rgba(255,255,255,0.1)',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        <ReactMarkdown 
                                            components={{
                                                p: ({node, ...props}) => <p style={{marginBottom: '0.5rem'}} {...props} />,
                                                ul: ({node, ...props}) => <ul style={{marginBottom: '0.5rem', paddingLeft: '1.2rem'}} {...props} />,
                                                ol: ({node, ...props}) => <ol style={{marginBottom: '0.5rem', paddingLeft: '1.2rem'}} {...props} />,
                                                li: ({node, ...props}) => <li style={{marginBottom: '0.2rem'}} {...props} />,
                                                a: ({node, ...props}) => <a style={{color: '#ff8a65', textDecoration: 'underline'}} target="_self" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="d-flex mb-3 justify-content-start">
                                    <div className="me-2 mt-1 rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="p-2 px-3 rounded-4 text-light d-flex align-items-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                        <div className="spinner-grow spinner-grow-sm text-secondary" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></div>
                                        <div className="spinner-grow spinner-grow-sm text-secondary mx-1" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.2s' }} role="status"></div>
                                        <div className="spinner-grow spinner-grow-sm text-secondary" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.4s' }} role="status"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-top border-secondary" style={{ backgroundColor: 'var(--paw-bg-card)' }}>
                            <form onSubmit={handleSend} className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control rounded-pill text-white border-secondary"
                                    style={{ backgroundColor: 'var(--paw-bg-deep)' }}
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    className="btn rounded-circle d-flex align-items-center justify-content-center text-white"
                                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--paw-primary)' }}
                                    disabled={isLoading || !input.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                className="btn rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
                style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--paw-primary)',
                    border: 'none',
                    outline: 'none'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
};

export default FloatingAIChatbot;
