import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'

function ProtectedRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

const Placeholder = ({ title }: { title: string }) => (
    <div className="flex h-screen items-center justify-center text-2xl font-semibold text-gray-400">
        {title}
    </div>
)

export const router = createBrowserRouter([
    {
        element: <PublicRoute />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            { path: '/dashboard', element: <Placeholder title="Dashboard" /> },
            { path: '/tasks', element: <Placeholder title="Tasks" /> },
            { path: '/projects', element: <Placeholder title="Projects" /> },
            { path: '/focus', element: <Placeholder title="Focus" /> },
            { path: '/habits', element: <Placeholder title="Habits" /> },
        ],
    },
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '*', element: <Placeholder title="404 — Not Found" /> },
])