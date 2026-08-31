import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Container, Row, Col, Card, Form, ListGroup,
    InputGroup, Button, Spinner, Badge
} from 'react-bootstrap';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import api from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const oneDay = 86400000;

    if (diff < oneDay && now.getDate() === d.getDate()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 2 * oneDay) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMsgTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const avatarUrl = (user) =>
    user?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=F59E0B&color=000&bold=true&size=64`;

// ── ChatListItem ──────────────────────────────────────────────────────────────
const ChatListItem = ({ room, isActive, onSelect, onlineIds }) => {
    const other = room.otherParticipant;
    const isOnline = other && onlineIds.has(other._id);

    return (
        <ListGroup.Item
            action
            onClick={() => onSelect(room)}
            className={`px-3 py-3 border-0 border-bottom chat-list-item ${isActive ? 'active-room' : ''}`}
        >
            <div className="d-flex align-items-center gap-3">
                <div className="position-relative flex-shrink-0">
                    <img
                        src={avatarUrl(other)}
                        alt={other?.name}
                        width={44}
                        height={44}
                        className="rounded-circle object-fit-cover"
                        style={{ border: '2px solid var(--paw-border)' }}
                    />
                    <span
                        className="position-absolute"
                        style={{
                            bottom: 2, right: 2,
                            width: 10, height: 10,
                            borderRadius: '50%',
                            backgroundColor: isOnline ? '#22c55e' : '#6b7280',
                            border: '2px solid #0C0C0C',
                        }}
                    />
                </div>
                <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-white text-truncate" style={{ fontSize: '0.9rem' }}>
                            {other?.name || 'Unknown'}
                        </span>
                        <small className="text-secondary ms-2 flex-shrink-0" style={{ fontSize: '0.72rem' }}>
                            {formatTime(room.lastMessage?.createdAt || room.updatedAt)}
                        </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-secondary text-truncate" style={{ fontSize: '0.78rem', maxWidth: '70%' }}>
                            {room.lastMessage?.text || 'No messages yet'}
                        </small>
                        {room.unreadCount > 0 && (
                            <Badge
                                pill
                                className="ms-1 flex-shrink-0"
                                style={{ backgroundColor: 'var(--paw-primary)', color: '#000', fontSize: '0.65rem' }}
                            >
                                {room.unreadCount > 99 ? '99+' : room.unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </ListGroup.Item>
    );
};

// ── MessageBubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine }) => (
    <div className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
        {!isMine && (
            <img
                src={avatarUrl(msg.senderId)}
                alt=""
                width={28}
                height={28}
                className="rounded-circle object-fit-cover me-2 flex-shrink-0 align-self-end"
            />
        )}
        <div style={{ maxWidth: '70%' }}>
            <div
                className="px-3 py-2 rounded-3"
                style={{
                    backgroundColor: isMine ? 'var(--paw-primary)' : 'var(--paw-bg-card)',
                    border: isMine ? 'none' : '1px solid var(--paw-border)',
                    borderBottomRightRadius: isMine ? '4px' : undefined,
                    borderBottomLeftRadius: !isMine ? '4px' : undefined,
                    wordBreak: 'break-word',
                    color: isMine ? '#000' : '#fff',
                }}
            >
                {msg.text}
            </div>
            <div className={`d-flex align-items-center mt-1 ${isMine ? 'justify-content-end' : 'justify-content-start'}`} style={{ gap: 4 }}>
                <small className="text-secondary" style={{ fontSize: '0.68rem' }}>
                    {formatMsgTime(msg.createdAt)}
                </small>
                {isMine && (
                    <small style={{ fontSize: '0.65rem', color: msg.isRead ? '#22c55e' : '#6b7280' }}>
                        {msg.isRead ? '✓✓' : '✓'}
                    </small>
                )}
            </div>
        </div>
    </div>
);

// ── Main Chat Component ───────────────────────────────────────────────────────
export const Chat = () => {
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    const location = useLocation();

    // Normalise user id — auth API returns { id } not { _id }
    const userId = user?.id || user?._id;

    // Rooms list state
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsError, setRoomsError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Active room state
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sendError, setSendError] = useState('');

    // Input & UI state
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [typingInfo, setTypingInfo] = useState(null);
    const [onlineIds, setOnlineIds] = useState(new Set());

    // Refs
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const activeRoomRef = useRef(null); // stable ref for socket handler

    // keep ref in sync
    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);

    // ── Load rooms ────────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        setRoomsLoading(true);
        setRoomsError('');
        try {
            const { data } = await api.get('/chats/rooms');
            return data.rooms || [];
        } catch (err) {
            setRoomsError(err.response?.data?.message || 'Failed to load conversations');
            return [];
        } finally {
            setRoomsLoading(false);
        }
    }, []);

    // ── Initial load + handle navigation state (openFrom dashboard) ───────────
    useEffect(() => {
        const navState = location.state;
        fetchRooms().then((loadedRooms) => {
            setRooms(loadedRooms);

            // Auto-select room if navigated from Dashboard via openChatWith()
            if (navState?.openRoomId && loadedRooms.length > 0) {
                const target = loadedRooms.find(r => r._id === navState.openRoomId);
                if (target) {
                    // Use setTimeout to ensure state is settled before handleSelectRoom runs
                    setActiveRoom(target);
                    if (socket) socket.emit('join_room', target._id);
                    // Load messages for this room
                    api.get(`/chats/rooms/${target._id}/messages`)
                        .then(({ data }) => {
                            setMessages(data.messages || []);
                            api.patch(`/chats/rooms/${target._id}/read`).catch(() => { });
                        })
                        .catch(() => setMessages([]));
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Announce online status once socket & user are ready ──────────────────
    useEffect(() => {
        if (!socket || !userId) return;
        socket.emit('user_online', userId);
    }, [socket, userId]);

    // ── Socket events (stable — no activeRoom in deps, uses ref instead) ─────
    useEffect(() => {
        if (!socket || !userId) return;

        const handleMessageReceived = (payload) => {
            const { roomId, message } = payload;
            if (!message) return;
            const currentRoom = activeRoomRef.current;

            if (currentRoom && roomId === currentRoom._id) {
                // Active room — append message (dedup by _id)
                setMessages((prev) => {
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                // Auto-mark as read since this room is open
                api.patch(`/chats/rooms/${roomId}/read`).catch(() => { });
            } else {
                // Background room — increment unread badge
                setRooms((prev) =>
                    prev.map((r) =>
                        r._id === roomId
                            ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
                            : r
                    )
                );
            }

            // Always update lastMessage preview in the sidebar
            setRooms((prev) =>
                prev.map((r) =>
                    r._id === roomId
                        ? { ...r, lastMessage: message, updatedAt: message.createdAt }
                        : r
                )
            );
        };


        const handleTyping = ({ senderName, isTyping }) => {
            setTypingInfo(isTyping ? senderName : null);
        };

        const handlePresence = ({ userId: presenceId, isOnline }) => {
            setOnlineIds((prev) => {
                const next = new Set(prev);
                if (isOnline) next.add(presenceId);
                else next.delete(presenceId);
                return next;
            });
        };

        const handleUnreadUpdated = () => {
            // Re-fetch rooms to get accurate unread counts
            fetchRooms().then((loaded) => setRooms(loaded));
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('typing_status', handleTyping);
        socket.on('presence_update', handlePresence);
        socket.on('unread_count_updated', handleUnreadUpdated);

        return () => {
            socket.off('message_received', handleMessageReceived);
            socket.off('typing_status', handleTyping);
            socket.off('presence_update', handlePresence);
            socket.off('unread_count_updated', handleUnreadUpdated);
        };
    }, [socket, userId, fetchRooms]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingInfo]);

    // ── Select a room ─────────────────────────────────────────────────────────
    const handleSelectRoom = useCallback(async (room) => {
        if (activeRoomRef.current?._id === room._id) return;

        // Leave previous socket room
        if (activeRoomRef.current && socket) socket.emit('leave_room', activeRoomRef.current._id);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        setActiveRoom(room);
        setMessages([]);
        setMessagesLoading(true);
        setSendError('');
        setTypingInfo(null);

        if (socket) socket.emit('join_room', room._id);

        try {
            const { data } = await api.get(`/chats/rooms/${room._id}/messages`);
            setMessages(data.messages || []);

            // Mark as read
            await api.patch(`/chats/rooms/${room._id}/read`);
            setRooms((prev) =>
                prev.map((r) => (r._id === room._id ? { ...r, unreadCount: 0 } : r))
            );
        } catch {
            setMessages([]);
        } finally {
            setMessagesLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [socket]);

    // ── Send a message ────────────────────────────────────────────────────────
    const handleSend = async (e) => {
        e && e.preventDefault();
        if (!inputText.trim() || !activeRoom || isSending) return;

        const text = inputText.trim();
        setInputText('');
        setIsSending(true);
        setSendError('');

        // Optimistic bubble
        const optimistic = {
            _id: `opt_${Date.now()}`,
            roomId: activeRoom._id,
            senderId: { _id: userId, name: user.name, profilePicture: user.profilePicture },
            text,
            isRead: false,
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages((prev) => [...prev, optimistic]);

        try {
            const { data } = await api.post(`/chats/rooms/${activeRoom._id}/messages`, { text });
            // Replace optimistic with persisted message
            setMessages((prev) =>
                prev.map((m) => (m._id === optimistic._id ? data.message : m))
            );
            // Update room list preview
            setRooms((prev) =>
                prev.map((r) =>
                    r._id === activeRoom._id
                        ? { ...r, lastMessage: data.message, updatedAt: data.message.createdAt }
                        : r
                )
            );
        } catch (err) {
            // Remove optimistic, show error
            setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
            setSendError(err.response?.data?.message || 'Failed to send message. Try again.');
        } finally {
            setIsSending(false);
        }
    };

    // ── Typing indicator ──────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (!socket || !activeRoom) return;

        socket.emit('typing', {
            roomId: activeRoom._id,
            senderName: user?.name,
            isTyping: true,
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', {
                roomId: activeRoom._id,
                senderName: user?.name,
                isTyping: false,
            });
        }, 1500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Filtered rooms ────────────────────────────────────────────────────────
    const filteredRooms = rooms.filter((r) =>
        r.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeOther = activeRoom?.otherParticipant;
    const activeOtherOnline = activeOther && onlineIds.has(activeOther._id);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Container fluid className="py-2 px-3 px-md-4" style={{ height: 'calc(100vh - 70px)' }}>
            <Row className="g-0 h-100 rounded-3 overflow-hidden" style={{ border: '1px solid var(--paw-border)' }}>

                {/* ── Sidebar: Chat list ────────────────────────────────── */}
                <Col
                    md={4}
                    className={`h-100 flex-column ${activeRoom ? 'd-none d-md-flex' : 'd-flex'}`}
                    style={{ backgroundColor: 'var(--paw-bg-card)', borderRight: '1px solid var(--paw-border)' }}
                >
                    {/* Header */}
                    <div className="p-3" style={{ borderBottom: '1px solid var(--paw-border)' }}>
                        <h5 className="text-white fw-bold mb-3">
                            <i className="bi bi-chat-dots me-2" style={{ color: 'var(--paw-primary)' }} />
                            Messages
                        </h5>
                        <Form.Control
                            placeholder="Search conversations…"
                            className="paw-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Room list */}
                    <div className="flex-grow-1 overflow-auto">
                        {roomsLoading ? (
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <Spinner animation="border" size="sm" style={{ color: 'var(--paw-primary)' }} />
                            </div>
                        ) : roomsError ? (
                            <div className="p-4 text-center text-danger small">{roomsError}</div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="p-4 text-center">
                                <div style={{ fontSize: '2rem' }}>💬</div>
                                <p className="text-secondary small mt-2">
                                    {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Chat becomes available after an adoption request is made.'}
                                </p>
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {filteredRooms.map((room) => (
                                    <ChatListItem
                                        key={room._id}
                                        room={room}
                                        isActive={activeRoom?._id === room._id}
                                        onSelect={handleSelectRoom}
                                        onlineIds={onlineIds}
                                    />
                                ))}
                            </ListGroup>
                        )}
                    </div>
                </Col>

                {/* ── Main: Message panel ───────────────────────────────── */}
                <Col
                    md={8}
                    className={`h-100 flex-column ${!activeRoom ? 'd-none d-md-flex' : 'd-flex'}`}
                    style={{ backgroundColor: '#0C0C0C' }}
                >
                    {!activeRoom ? (
                        /* Empty state on desktop */
                        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-4">
                            <div style={{ fontSize: '4rem', opacity: 0.3 }}>🐾</div>
                            <h6 className="text-secondary mt-3">Select a conversation to start chatting</h6>
                            <p className="text-secondary small">Chats are created automatically when an adoption request is submitted.</p>
                        </div>
                    ) : (
                        <>
                            {/* Conversation header */}
                            <div
                                className="px-3 py-3 d-flex align-items-center gap-3"
                                style={{ borderBottom: '1px solid var(--paw-border)', backgroundColor: 'var(--paw-bg-card)' }}
                            >
                                {/* Back button mobile */}
                                <Button
                                    variant="link"
                                    className="d-md-none p-0 text-white me-1"
                                    onClick={() => {
                                        if (socket) socket.emit('leave_room', activeRoom._id);
                                        setActiveRoom(null);
                                        setMessages([]);
                                    }}
                                >
                                    <i className="bi bi-arrow-left fs-5" />
                                </Button>

                                <div className="position-relative flex-shrink-0">
                                    <img
                                        src={avatarUrl(activeOther)}
                                        alt={activeOther?.name}
                                        width={40}
                                        height={40}
                                        className="rounded-circle object-fit-cover"
                                    />
                                    <span
                                        className="position-absolute"
                                        style={{
                                            bottom: 1, right: 1,
                                            width: 10, height: 10,
                                            borderRadius: '50%',
                                            backgroundColor: activeOtherOnline ? '#22c55e' : '#6b7280',
                                            border: '2px solid var(--paw-bg-card)',
                                        }}
                                    />
                                </div>

                                <div>
                                    <div className="text-white fw-semibold" style={{ lineHeight: 1.2 }}>
                                        {activeOther?.name || 'Unknown'}
                                    </div>
                                    <small style={{ color: activeOtherOnline ? '#22c55e' : '#6b7280', fontSize: '0.72rem' }}>
                                        {activeOtherOnline ? 'Online' : 'Offline'}
                                    </small>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div
                                id="messages-container"
                                className="flex-grow-1 overflow-auto px-3 py-3"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                {messagesLoading ? (
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <Spinner animation="border" size="sm" style={{ color: 'var(--paw-primary)' }} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                                        <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>💬</div>
                                        <p className="text-secondary small mt-2">No messages yet. Say hello!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <MessageBubble
                                            key={msg._id}
                                            msg={msg}
                                            isMine={
                                                msg.senderId?._id === userId ||
                                                msg.senderId?._id?.toString() === userId ||
                                                msg.senderId === userId
                                            }
                                        />
                                    ))
                                )}

                                {/* Typing indicator */}
                                {typingInfo && (
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <div
                                            className="px-3 py-2 rounded-3"
                                            style={{ backgroundColor: 'var(--paw-bg-card)', border: '1px solid var(--paw-border)' }}
                                        >
                                            <span className="text-secondary small">
                                                <em>{typingInfo} is typing…</em>
                                            </span>
                                            <span className="ms-1 typing-dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Error banner */}
                            {sendError && (
                                <div className="px-3 pb-1">
                                    <small className="text-danger">{sendError}</small>
                                </div>
                            )}

                            {/* Input toolbar */}
                            <div
                                className="px-3 py-3"
                                style={{ borderTop: '1px solid var(--paw-border)', backgroundColor: 'var(--paw-bg-card)' }}
                            >
                                <Form onSubmit={handleSend}>
                                    <InputGroup>
                                        <Form.Control
                                            ref={inputRef}
                                            id="chat-message-input"
                                            placeholder="Type your message…"
                                            className="paw-input"
                                            value={inputText}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            disabled={isSending}
                                            autoComplete="off"
                                        />
                                        <Button
                                            id="chat-send-btn"
                                            type="submit"
                                            className="btn-paw-primary d-flex align-items-center gap-2"
                                            disabled={!inputText.trim() || isSending}
                                        >
                                            {isSending ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <i className="bi bi-send-fill" />
                                                    <span className="d-none d-sm-inline">Send</span>
                                                </>
                                            )}
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </div>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Chat;
