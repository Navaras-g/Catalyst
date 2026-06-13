import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    CheckSquare,
    FolderKanban,
    Timer,
    Flame,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Zap,
    LogOut,
    User,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/features/auth/authApi'
import { cn } from '@/lib/utils'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/focus', icon: Timer, label: 'Focus' },
    { to: '/habits', icon: Flame, label: 'Habits' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
]

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    const handleLogout = async () => {
        await authApi.logout()
        logout()
        navigate('/login')
    }

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative flex h-screen flex-col border-r border-white/5 bg-gray-900"
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-white/5 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <Zap size={16} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-lg font-bold text-white"
                            >
                                Catalyst
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            )
                        }
                    >
                        <Icon size={20} className="shrink-0" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="border-t border-white/5 p-3 space-y-1">
                <div
                    className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5',
                        collapsed && 'justify-center'
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                        <User size={16} />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-0 flex-1"
                            >
                                <p className="truncate text-sm font-medium text-white">
                                    {user?.first_name || user?.username}
                                </p>
                                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400',
                        collapsed && 'justify-center'
                    )}
                >
                    <LogOut size={20} className="shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                Sign out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-gray-800 text-gray-400 shadow-lg transition hover:text-white"
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </motion.aside>
    )
}