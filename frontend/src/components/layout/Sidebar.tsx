import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, CheckSquare, FolderKanban,
    Timer, Flame, Trophy, BookOpen, CalendarDays,
    ChevronLeft, ChevronRight, Zap, LogOut, User,
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
    { to: '/notes', icon: BookOpen, label: 'Notes' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
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
            className="relative flex h-screen flex-col overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0a1628 0%, #080f1e 100%)',
                borderRight: '1px solid rgba(99,179,255,0.06)',
            }}
        >
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,130,255,0.3), transparent)' }}
            />

            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4"
                style={{ borderColor: 'rgba(99,179,255,0.06)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
                        }}
                    >
                        <Zap size={16} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="gradient-text text-lg font-bold"
                            >
                                Catalyst
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {navItems.map(({ to, icon: Icon, label }, index) => (
                    <motion.div
                        key={to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                        <NavLink
                            to={to}
                            className={({ isActive }) =>
                                cn(
                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive ? 'text-white' : 'hover:text-white'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))',
                                                border: '1px solid rgba(99,130,255,0.2)',
                                                boxShadow: '0 0 20px rgba(99,102,241,0.1)',
                                            }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        />
                                    )}
                                    <Icon
                                        size={18}
                                        className={cn(
                                            'relative shrink-0 transition-all duration-200',
                                            isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'
                                        )}
                                    />
                                    <AnimatePresence>
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                    'relative',
                                                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                                                )}
                                            >
                                                {label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    </motion.div>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="border-t p-3 space-y-0.5"
                style={{ borderColor: 'rgba(99,179,255,0.06)' }}
            >
                <div className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    collapsed && 'justify-center'
                )}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
                            border: '1px solid rgba(99,130,255,0.2)',
                        }}
                    >
                        <User size={14} style={{ color: '#6b89b4' }} />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="min-w-0 flex-1"
                            >
                                <p className="truncate text-sm font-medium text-white">
                                    {user?.first_name || user?.username}
                                </p>
                                <p className="truncate text-xs" style={{ color: '#3a5070' }}>
                                    {user?.email}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleLogout}
                    className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        collapsed && 'justify-center'
                    )}
                    style={{ color: '#3a5070' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                        e.currentTarget.style.color = '#f87171'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#3a5070'
                    }}
                >
                    <LogOut size={18} className="shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                Sign out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110"
                style={{
                    background: '#0f1f3d',
                    border: '1px solid rgba(99,130,255,0.2)',
                    color: '#6b89b4',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                }}
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </motion.aside>
    )
}