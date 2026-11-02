import axios from 'axios';

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const cleanBackendUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

const api = axios.create({
    baseURL: `${cleanBackendUrl}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token automatically to every request if present
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper to convert any localhost:5000/uploads URLs to relative /uploads so they load from frontend CDN
const sanitizeUploadUrls = (data) => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeUploadUrls(item));
    }
    for (const key of Object.keys(data)) {
        if (typeof data[key] === 'string' && data[key].includes('localhost:5000/uploads/')) {
            data[key] = data[key].substring(data[key].indexOf('/uploads/'));
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            data[key] = sanitizeUploadUrls(data[key]);
        }
    }
    return data;
};

// Global response interceptor (handling session timeouts and auto-normalizing upload URLs)
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = sanitizeUploadUrls(response.data);
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized request intercepted. Expiring local session keys.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optional: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
