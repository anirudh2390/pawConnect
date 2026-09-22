import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RootLayout from '../layouts/RootLayout';
import { useAuth } from '../hooks/useAuth';

// ── Eager-loaded (critical path) ───────────────────────────────────────────
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

// ── Lazy-loaded (non-critical) ──────────────────────────────────────────────
const Browse = lazy(() => import('../pages/Browse'));
const PetDetails = lazy(() => import('../pages/PetDetails'));
const Contact = lazy(() => import('../pages/Contact'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const CreatePet = lazy(() => import('../pages/CreatePet'));
const EditPet = lazy(() => import('../pages/EditPet'));
const Chat = lazy(() => import('../pages/Chat'));
const Admin = lazy(() => import('../pages/Admin'));
const Profile = lazy(() => import('../pages/Profile'));
const Forbidden = lazy(() => import('../pages/Forbidden'));
const ServerError = lazy(() => import('../pages/ServerError'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// ── Page transition wrapper ────────────────────────────────────────────────
const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
    >
        {children}
    </motion.div>
);

// ── Suspense fallback spinner ──────────────────────────────────────────────
const PageLoader = () => (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'var(--paw-bg-deep)' }}>
        <div className="text-center">
            <div className="spinner-border" style={{ color: 'var(--paw-primary)', width: '2.5rem', height: '2.5rem' }} role="status">
                <span className="visually-hidden">Loading…</span>
            </div>
            <p className="text-secondary small mt-3 mb-0">Loading…</p>
        </div>
    </div>
);

// ── Auth guard ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return <PageLoader />;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect non-admins to 403 instead of silently to /dashboard
        return <Navigate to="/403" replace />;
    }

    return children;
};

// ── Wrap a lazy page with Suspense + transition ────────────────────────────
const LazyPage = ({ element }) => (
    <Suspense fallback={<PageLoader />}>
        <PageTransition>{element}</PageTransition>
    </Suspense>
);

// ── Router configuration ───────────────────────────────────────────────────
export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: <NotFound />,
        children: [
            // Public
            { index: true, element: <PageTransition><Landing /></PageTransition> },
            { path: 'login', element: <PageTransition><Login /></PageTransition> },
            { path: 'register', element: <PageTransition><Register /></PageTransition> },
            { path: 'reset-password/:token', element: <LazyPage element={<ResetPassword />} /> },
            { path: 'browse', element: <LazyPage element={<Browse />} /> },
            { path: 'pet/:id', element: <LazyPage element={<PetDetails />} /> },
            { path: 'contact', element: <LazyPage element={<Contact />} /> },

            // Error pages (accessible without auth)
            { path: '403', element: <LazyPage element={<Forbidden />} /> },
            { path: '500', element: <LazyPage element={<ServerError />} /> },

            // Authenticated
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <LazyPage element={<Dashboard />} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'create-pet',
                element: (
                    <ProtectedRoute>
                        <LazyPage element={<CreatePet />} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'edit-pet/:id',
                element: (
                    <ProtectedRoute>
                        <LazyPage element={<EditPet />} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'chat',
                element: (
                    <ProtectedRoute>
                        <LazyPage element={<Chat />} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <LazyPage element={<Profile />} />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin',
                element: (
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <LazyPage element={<Admin />} />
                    </ProtectedRoute>
                ),
            },

            // 404
            { path: '*', element: <NotFound /> },
        ],
    },
]);

export default router;
