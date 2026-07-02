import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import Header from '@/components/layout/Header'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
    tasks_due_today: number
    tasks_completed_this_week: number
    active_projects: number
    current_streaks: number
    total_focus_minutes_today: number
    habits_completed_today: number
    habits_total: number
    daily: {
        date: string
        tasks: number
        focus_minutes: number
        focus_hours: number
    }[]
}

interface Insight {
    type: string
    icon: string
    title: string
    description: string
    value: string | null
    trend: 'up' | 'down' | 'neutral'
}

const TREND_CONFIG = {
    up: { color: '#34d399', bg: 'rgba(16,185,129,0.08)', arrow: '↑' },
    down: { color: '#f87171', bg: 'rgba(239,68,68,0.08)', arrow: '↓' },
    neutral: { color: '#6b89b4', bg: 'rgba(99,130,255,0.06)', arrow: '→' },
}

const TYPE_CONFIG: Record<string, { accent: string; bar: string }> = {
    peak_day: { accent: '#6366f1', bar: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    peak_time: { accent: '#3b82f6', bar: 'linear-gradient(90deg, #3b82f6, #6366f1)' },
    focus_impact: { accent: '#8b5cf6', bar: 'linear-gradient(90deg, #8b5cf6, #6366f1)' },
    habit_pattern: { accent: '#f97316', bar: 'linear-gradient(90deg, #f97316, #fb923c)' },
    consistency: { accent: '#10b981', bar: 'linear-gradient(90deg, #10b981, #34d399)' },
    warning: { accent: '#ef4444', bar: 'linear-gradient(90deg, #ef4444, #f87171)' },
    info: { accent: '#6b89b4', bar: 'linear-gradient(90deg, #6b89b4, #93b4d4)' },
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
                border: '1px solid rgba(99,179,255,0.08)'
            }}
        >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                    >
                        <TrendingUp size={14} className="text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                        Productivity Insights
                    </h3>
                </div>
                <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                        background: 'rgba(99,102,241,0.12)',
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
                <div className="space-y-3">
                    {insights.map((insight, i) => {
                        const typeConfig = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info
                        const trendConfig = TREND_CONFIG[insight.trend ?? 'neutral']

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.08 }}
                                className="relative overflow-hidden rounded-xl p-4"
                                style={{
                                    background: 'rgba(15,31,61,0.5)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
                            >
                                {/* Left accent bar */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                                    style={{ background: typeConfig.bar }}
                                />

                                <div className="flex items-start gap-4 pl-2">
                                    {/* Value + trend */}
                                    {insight.value && (
                                        <div className="shrink-0 text-center min-w-[52px]">
                                            <p
                                                className="text-lg font-extrabold leading-none tracking-tight"
                                                style={{ color: typeConfig.accent }}
                                            >
                                                {insight.value}
                                            </p>
                                            <div
                                                className="mt-1 flex items-center justify-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                                                style={{
                                                    background: trendConfig.bg,
                                                    color: trendConfig.color,
                                                }}
                                            >
                                                <span>{trendConfig.arrow}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold leading-tight text-white">
                                            {insight.title}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#6b89b4' }}>
                                            {insight.description}
                                        </p>
                                    </div>
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

                {/* Activity Chart */}
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
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Weekly Activity</h3>
                            <p className="text-xs mt-0.5" style={{ color: '#3a5070' }}>
                                Tasks completed vs focus hours
                            </p>
                        </div>
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

                    {/* Legend */}
                    <div className="flex items-center gap-5 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-6 rounded-full"
                                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                            />
                            <span className="text-xs" style={{ color: '#6b89b4' }}>Tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-6 rounded-full"
                                style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}
                            />
                            <span className="text-xs" style={{ color: '#6b89b4' }}>Focus (hrs)</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart
                            data={stats?.daily ?? []}
                            margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(99,130,255,0.06)"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#3a5070', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                tick={{ fill: '#3a5070', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(10,22,40,0.95)',
                                    border: '1px solid rgba(99,130,255,0.15)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    padding: '10px 14px',
                                }}
                                labelStyle={{
                                    color: '#e8f0fe',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    marginBottom: '4px',
                                }}
                                itemStyle={{
                                    color: '#6b89b4',
                                    fontSize: '12px',
                                    padding: '2px 0',
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'tasks') return [`${value} tasks`, 'Tasks']
                                    return [`${value}h`, 'Focus']
                                }}
                                cursor={{
                                    stroke: 'rgba(99,130,255,0.15)',
                                    strokeWidth: 1,
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="tasks"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#tasksGradient)"
                                dot={{
                                    fill: '#6366f1',
                                    strokeWidth: 0,
                                    r: 3,
                                }}
                                activeDot={{
                                    fill: '#818cf8',
                                    stroke: 'rgba(99,102,241,0.3)',
                                    strokeWidth: 4,
                                    r: 5,
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="focus_hours"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                fill="url(#focusGradient)"
                                dot={{
                                    fill: '#06b6d4',
                                    strokeWidth: 0,
                                    r: 3,
                                }}
                                activeDot={{
                                    fill: '#22d3ee',
                                    stroke: 'rgba(6,182,212,0.3)',
                                    strokeWidth: 4,
                                    r: 5,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Insights — after the weekly chart */}
                <InsightsCard />

            </div>
        </div>
    )
}