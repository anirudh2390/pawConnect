import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // Verify JWT validation token by retrieving fresh profile details
                    const response = await api.get('/auth/me');
                    if (response.data?.status === 'success') {
                        setUser(response.data.user);
                    } else {
                        logout();
                    }
                } catch (err) {
                    console.error('Session validation query failed on initialization:', err);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    const loginUser = async (email, password, rememberMe) => {
        setLoading(true);
        setAuthError(null);
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data?.status === 'success') {
                const { token: userToken, user: userData } = response.data;
                setUser(userData);
                setToken(userToken);

                if (rememberMe) {
                    localStorage.setItem('token', userToken);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    // Session persistence
                    sessionStorage.setItem('token', userToken);
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    // Synchronize token state in memory
                    localStorage.setItem('token', userToken); // Set it so it works during API intercepts, but clean on exit.
                }
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login attempt failed. Invalid credentials.';
            const errors = err.response?.data?.errors || null;
            setAuthError(message);
            return { success: false, message, errors };
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async (name, email, password, location, phoneNumber) => {
        setLoading(true);
        setAuthError(null);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                location,
                phoneNumber,
            });

            if (response.data?.status === 'success') {
                const { token: userToken, user: userData } = response.data;
                setUser(userData);
                setToken(userToken);

                // Auto sign-in saves token to localStorage
                localStorage.setItem('token', userToken);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to complete registration.';
            const errors = err.response?.data?.errors || null;
            setAuthError(message);
            return { success: false, message, errors };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    };

    const updateUser = (updatedData) => {
        setUser((prev) => ({ ...prev, ...updatedData }));
        const stored = localStorage.getItem('user');
        if (stored) {
            localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...updatedData }));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                authError,
                login: loginUser,
                register: registerUser,
                logout,
                updateUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
