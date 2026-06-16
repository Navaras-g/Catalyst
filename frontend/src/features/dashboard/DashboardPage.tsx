import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {

    ChevronRight, TrendingUp, // Added TrendingUp for the Insights card
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import Header from '@/components/layout/Header'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
    tasks_due_today: number
    tasks_completed_this_week: number
    active_projects: number
    current_streaks: number
    total_focus_minutes_today: number
    habits_completed_today: number
    habits_total: number
}

interface Insight {
    type: string
    icon: string
    title: string
    description: string
    value: string | null
}

const INSIGHT_STYLES: Record<string, { gradient: string; valueColor: string; border: string }> = {
    peak_day: { gradient: 'rgba(99,102,241,0.08)', valueColor: '#818cf8', border: 'rgba(99,102,241,0.15)' },
    peak_time: { gradient: 'rgba(59,130,246,0.08)', valueColor: '#60a5fa', border: 'rgba(59,130,246,0.15)' },
    estimation: { gradient: 'rgba(249,115,22,0.08)', valueColor: '#fb923c', border: 'rgba(249,115,22,0.15)' },
    focus_impact: { gradient: 'rgba(139,92,246,0.08)', valueColor: '#a78bfa', border: 'rgba(139,92,246,0.15)' },
    habit_pattern: { gradient: 'rgba(249,115,22,0.08)', valueColor: '#fb923c', border: 'rgba(249,115,22,0.15)' },
    consistency: { gradient: 'rgba(16,185,129,0.08)', valueColor: '#34d399', border: 'rgba(16,185,129,0.15)' },
    warning: { gradient: 'rgba(239,68,68,0.08)', valueColor: '#f87171', border: 'rgba(239,68,68,0.15)' },
    info: { gradient: 'rgba(99,130,255,0.05)', valueColor: '#6b89b4', border: 'rgba(99,130,255,0.08)' },
}

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

function getFormattedDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })
}

function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function StatCard({
    label, value, sub, gradient, delay,
}: {
    label: string
    value: string | number
    sub?: string
    gradient: string
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
                background: 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(99,179,255,0.08)',
            }}
        >
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: gradient }} />
            {/* Subtle glow */}
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: gradient }} />

            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#3a5070' }}>{label}</p>
            <p className="mt-2 text-4xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs" style={{ color: '#3a5070' }}>{sub}</p>}
        </motion.div>
    )
}

function InsightsCard() {
    const { data: insights = [], isLoading } = useQuery({
        queryKey: ['insights'],
        queryFn: async () => {
            const res = await apiClient.get<Insight[]>('/dashboard/insights/')
            return res.data
        },
        refetchInterval: 1000 * 60 * 5,
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="rounded-2xl p-5"
            style={{
                background: 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(99,179,255,0.08)',
            }}
        >
            <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                >
                    <TrendingUp size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">Productivity Insights</h3>
                <span className="ml-auto rounded-full px-2 py-0.5 text-xs"
                    style={{
                        background: 'rgba(99,102,241,0.1)',
                        color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}
                >
                    AI
                </span>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
            ) : (
                <div className="space-y-2.5">
                    {insights.map((insight, i) => {
                        const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.info
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.08 }}
                                className="flex items-start gap-3 rounded-xl p-3"
                                style={{
                                    background: style.gradient,
                                    border: `1px solid ${style.border}`,
                                }}
                            >
                                {insight.value && (
                                    <div className="shrink-0 text-right">
                                        <span className="text-lg font-bold"
                                            style={{ color: style.valueColor }}
                                        >
                                            {insight.value}
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-white">{insight.title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#6b89b4' }}>
                                        {insight.description}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user)
    const navigate = useNavigate()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await apiClient.get<DashboardStats>('/dashboard/stats/')
            return res.data
        },
        refetchInterval: 60000,
    })

    const statCards = [
        {
            label: 'Due Today',
            value: isLoading ? '—' : (stats?.tasks_due_today ?? 0),
            sub: 'tasks remaining',
            gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            delay: 0.1,
        },
        {
            label: 'Completed',
            value: isLoading ? '—' : (stats?.tasks_completed_this_week ?? 0),
            sub: 'tasks this week',
            gradient: 'linear-gradient(90deg, #10b981, #34d399)',
            delay: 0.2,
        },
        {
            label: 'Projects',
            value: isLoading ? '—' : (stats?.active_projects ?? 0),
            sub: 'active',
            gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            delay: 0.3,
        },
        {
            label: 'Focus',
            value: isLoading ? '—' : formatMinutes(stats?.total_focus_minutes_today ?? 0),
            sub: 'today',
            gradient: 'linear-gradient(90deg, #f97316, #fb923c)',
            delay: 0.4,
        },
    ]

    const quickAccess = [
        { label: 'Add Task', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', to: '/tasks' },
        { label: 'New Project', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', to: '/projects' },
        { label: 'Start Focus', gradient: 'linear-gradient(135deg, #f97316, #fb923c)', to: '/focus' },
        { label: 'Log Habit', gradient: 'linear-gradient(135deg, #10b981, #34d399)', to: '/habits' },
    ]

    return (
        <div className="flex flex-col h-full">
            <Header title="Dashboard" subtitle={getFormattedDate()} />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Hero greeting */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl p-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 50%, rgba(139,92,246,0.05) 100%)',
                        border: '1px solid rgba(99,130,255,0.1)',
                    }}
                >
                    {/* Decorative glow */}
                    <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                    <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-3xl opacity-10"
                        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

                    <div className="relative">
                        <h2 className="text-2xl font-bold text-white">
                            {getGreeting()},{' '}
                            <span className="gradient-text">{user?.first_name || user?.username}</span>
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: '#6b89b4' }}>
                            Here's what's happening in your universe today.
                        </p>
                    </div>
                </motion.div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} {...card} />
                    ))}
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* Habits progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="rounded-2xl p-5"
                        style={{
                            background: 'rgba(10,22,40,0.8)',
                            border: '1px solid rgba(99,179,255,0.08)',
                        }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">Habits Today</h3>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}
                            >
                                {stats?.current_streaks ?? 0} day streak
                            </span>
                        </div>

                        {(stats?.habits_total ?? 0) === 0 ? (
                            <p className="text-center py-8 text-sm" style={{ color: '#3a5070' }}>
                                No habits yet — create one to get started
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <span className="text-3xl font-bold text-white">
                                        {stats?.habits_completed_today ?? 0}
                                        <span className="text-lg font-normal" style={{ color: '#3a5070' }}>
                                            /{stats?.habits_total ?? 0}
                                        </span>
                                    </span>
                                    <span className="text-sm" style={{ color: '#6b89b4' }}>
                                        {stats?.habits_total
                                            ? Math.round(((stats.habits_completed_today ?? 0) / stats.habits_total) * 100)
                                            : 0}% done
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full"
                                    style={{ background: 'rgba(99,130,255,0.08)' }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${stats?.habits_total
                                                ? ((stats.habits_completed_today ?? 0) / stats.habits_total) * 100
                                                : 0}%`
                                        }}
                                        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                                        className="h-full rounded-full"
                                        style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick access */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="rounded-2xl p-5"
                        style={{
                            background: 'rgba(10,22,40,0.8)',
                            border: '1px solid rgba(99,179,255,0.08)',
                        }}
                    >
                        <h3 className="mb-4 text-sm font-semibold text-white">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-4 p-1">
                            {quickAccess.map(({ label, gradient, to }) => (
                                <motion.button
                                    key={label}
                                    onClick={() => navigate(to)}
                                    whileHover={{
                                        scale: 1.02,
                                        y: -3,
                                        transition: { duration: 0.2, ease: "easeOut" }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center backdrop-blur-md transition-all duration-300"
                                    style={{
                                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                >
                                    {/* Dynamic Background Glow on Hover */}
                                    <div
                                        className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-10"
                                        style={{ background: gradient }}
                                    />

                                    <div

                                        className="absolute inset-x-0 top-0 h-[2px] opacity-80 transition-opacity group-hover:opacity-100"

                                        style={{ background: gradient }}

                                    />

                                    {/* Button Label - Centered and clean */}
                                    <span className="relative z-10 text-sm font-semibold tracking-wide text-slate-200 transition-colors duration-300 group-hover:text-white">
                                        {label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Weekly chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="rounded-2xl p-5"
                    style={{
                        background: 'rgba(10,22,40,0.8)',
                        border: '1px solid rgba(99,179,255,0.08)',
                    }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-white">This Week</h3>
                        <button
                            onClick={() => navigate('/calendar')}
                            className="flex items-center gap-1 text-xs transition-colors"
                            style={{ color: '#3a5070' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#6b89b4'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#3a5070'}
                        >
                            View calendar <ChevronRight size={12} />
                        </button>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                            const today = new Date().getDay()
                            const adjustedToday = today === 0 ? 6 : today - 1
                            const isToday = i === adjustedToday
                            const isPast = i < adjustedToday
                            const heightPct = isPast ? Math.floor(Math.random() * 60) + 20 : isToday ? 45 : 8
                            return (
                                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                                    <div className="relative w-full rounded-t overflow-hidden"
                                        style={{ height: '56px', background: 'rgba(99,130,255,0.05)' }}
                                    >
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPct}%` }}
                                            transition={{ duration: 0.7, delay: 0.8 + i * 0.06, ease: 'easeOut' }}
                                            className="absolute bottom-0 w-full rounded-t"
                                            style={{
                                                background: isToday
                                                    ? 'linear-gradient(180deg, #6366f1, #3b82f6)'
                                                    : isPast
                                                        ? 'linear-gradient(180deg, rgba(99,102,241,0.5), rgba(59,130,246,0.3))'
                                                        : 'rgba(99,130,255,0.08)',
                                                boxShadow: isToday ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs"
                                        style={{ color: isToday ? '#818cf8' : '#3a5070', fontWeight: isToday ? 600 : 400 }}
                                    >
                                        {days[i]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Insights — after the weekly chart */}
                <InsightsCard />

            </div>
        </div>
    )
}