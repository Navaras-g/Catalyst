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

function ProtectedRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

const Placeholder = ({ title }: { title: string }) => (
    <div className="flex h-full items-center justify-center text-2xl font-semibold text-gray-600">
        {title} — coming soon
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
            {
                element: <AppLayout />,
                children: [
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/tasks', element: <TasksPage /> },
                    { path: '/projects', element: <ProjectsPage /> },
                    { path: '/focus', element: <FocusPage /> },
                    { path: '/habits', element: <HabitsPage /> },
                    { path: '/achievements', element: <AchievementsPage /> },
                    { path: '/notes', element: <NotesPage /> },
                ],
            },
        ],
    },
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '*', element: <Placeholder title="404" /> },
])