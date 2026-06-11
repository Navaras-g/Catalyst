import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
    CheckSquare,
    FolderKanban,
    Flame,
    Clock,
    TrendingUp,
    Calendar,
    Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import Header from '@/components/layout/Header'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
    tasks_due_today: number
    tasks_completed_this_week: number
    active_projects: number
    current_streaks: number
    total_focus_minutes_today: number
    habits_completed_today: number
    habits_total: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function getFormattedDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })
}

function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string
    value: string | number
    sub?: string
    icon: React.ReactNode
    color: string
    delay: number
}

function StatCard({ label, value, sub, icon, color, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="rounded-2xl border border-white/5 bg-gray-900 p-5"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-white">{value}</p>
                    {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
                </div>
                <div className={`rounded-xl p-2.5 ${color}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyActivity() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-gray-800 p-4">
                <Zap size={24} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No activity yet</p>
            <p className="mt-1 text-xs text-gray-600">
                Complete tasks and habits to see your progress here
            </p>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user)

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await apiClient.get<DashboardStats>('/dashboard/stats/')
            return res.data
        },
        refetchInterval: 1000 * 60, // refresh every minute
    })

    const statCards = [
        {
            label: 'Due Today',
            value: isLoading ? '—' : (stats?.tasks_due_today ?? 0),
            sub: 'tasks remaining',
            icon: <CheckSquare size={20} className="text-blue-400" />,
            color: 'bg-blue-500/10',
            delay: 0.1,
        },
        {
            label: 'Completed',
            value: isLoading ? '—' : (stats?.tasks_completed_this_week ?? 0),
            sub: 'tasks this week',
            icon: <TrendingUp size={20} className="text-green-400" />,
            color: 'bg-green-500/10',
            delay: 0.2,
        },
        {
            label: 'Active Projects',
            value: isLoading ? '—' : (stats?.active_projects ?? 0),
            sub: 'in progress',
            icon: <FolderKanban size={20} className="text-purple-400" />,
            color: 'bg-purple-500/10',
            delay: 0.3,
        },
        {
            label: 'Focus Today',
            value: isLoading ? '—' : formatMinutes(stats?.total_focus_minutes_today ?? 0),
            sub: 'deep work',
            icon: <Clock size={20} className="text-orange-400" />,
            color: 'bg-orange-500/10',
            delay: 0.4,
        },
    ]

    const quickLinks = [
        { label: 'Add Task', icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', to: '/tasks' },
        { label: 'New Project', icon: FolderKanban, color: 'text-purple-400', bg: 'bg-purple-500/10', to: '/projects' },
        { label: 'Start Focus', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', to: '/focus' },
        { label: 'Log Habit', icon: Flame, color: 'text-green-400', bg: 'bg-green-500/10', to: '/habits' },
    ]

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Dashboard"
                subtitle={getFormattedDate()}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-white">
                        {getGreeting()},{' '}
                        <span className="text-indigo-400">
                            {user?.first_name || user?.username || 'Guest'}
                        </span>{' '}
                        👋
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Here's what's on your plate today.
                    </p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} {...card} />
                    ))}
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* Habits Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="rounded-2xl border border-white/5 bg-gray-900 p-5"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-white">Habits Today</h3>
                            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1">
                                <Flame size={12} className="text-orange-400" />
                                <span className="text-xs font-medium text-orange-400">
                                    {stats?.current_streaks ?? 0} streak
                                </span>
                            </div>
                        </div>

                        {(stats?.habits_total ?? 0) === 0 ? (
                            <EmptyActivity />
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Completed</span>
                                    <span className="font-medium text-white">
                                        {stats?.habits_completed_today ?? 0} / {stats?.habits_total ?? 0}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${stats?.habits_total
                                                ? ((stats.habits_completed_today / stats.habits_total) * 100)
                                                : 0}%`
                                        }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        className="h-full rounded-full bg-orange-500"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="rounded-2xl border border-white/5 bg-gray-900 p-5"
                    >
                        <h3 className="mb-4 font-semibold text-white">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map(({ label, icon: Icon, color, bg, to }) => (
                                <a
                                    key={label}
                                    href={to}
                                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-gray-800/50 px-4 py-3 transition hover:bg-gray-800 hover:border-white/10"
                                >
                                    <div className={`rounded-lg p-1.5 ${bg}`}>
                                        <Icon size={16} className={color} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">{label}</span>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                </div>

                {/* This week summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="rounded-2xl border border-white/5 bg-gray-900 p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-indigo-400" />
                        <h3 className="font-semibold text-white">This Week</h3>
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                            const today = new Date().getDay()
                            const adjustedToday = today === 0 ? 6 : today - 1
                            const isToday = i === adjustedToday
                            const isPast = i < adjustedToday
                            const height = isPast
                                ? `${Math.floor(Math.random() * 60) + 20}%`
                                : isToday
                                    ? '45%'
                                    : '10%'
                            return (
                                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                    <div className="w-full rounded-t-sm bg-gray-800 relative" style={{ height: '48px' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: isPast || isToday ? height : '10%' }}
                                            transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
                                            className={`absolute bottom-0 w-full rounded-t-sm ${isToday ? 'bg-indigo-500' : isPast ? 'bg-indigo-500/40' : 'bg-gray-700'
                                                }`}
                                        />
                                    </div>
                                    <span className={`text-xs ${isToday ? 'text-indigo-400 font-medium' : 'text-gray-600'}`}>
                                        {days[i]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}