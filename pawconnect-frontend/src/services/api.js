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

// Global response interceptor (handling session timeouts/clearing invalid JWT)
api.interceptors.response.use(
    (response) => response,
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
