import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/features/dashboard/DashboardPage'
import TasksPage from '@/features/tasks/TaskPage'
import ProjectsPage from '@/features/projects/ProjectsPage'
import FocusPage from '@/features/focus/FocusPage'
import HabitsPage from '@/features/habits/HabitsPage'
import AchievementsPage from '@/features/gamification/AchievementsPage'
import NotesPage from '@/features/notes/NotesPage'
import CalendarPage from '@/features/calendar/CalendarPage'
import PageTransition from '@/components/PageTransition'

function ProtectedRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

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
            {
                element: <AppLayout />,
                children: [
                    { path: '/dashboard', element: <PageTransition><DashboardPage /></PageTransition> },
                    { path: '/tasks', element: <PageTransition><TasksPage /></PageTransition> },
                    { path: '/projects', element: <PageTransition><ProjectsPage /></PageTransition> },
                    { path: '/focus', element: <PageTransition><FocusPage /></PageTransition> },
                    { path: '/habits', element: <PageTransition><HabitsPage /></PageTransition> },
                    { path: '/achievements', element: <PageTransition><AchievementsPage /></PageTransition> },
                    { path: '/notes', element: <PageTransition><NotesPage /></PageTransition> },
                    { path: '/calendar', element: <PageTransition><CalendarPage /></PageTransition> },
                ],
            },
        ],
    },
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '*', element: <PageTransition><div className="flex h-full items-center justify-center text-2xl font-semibold" style={{ color: '#3a5070' }}>404 — Not Found</div></PageTransition> },
])