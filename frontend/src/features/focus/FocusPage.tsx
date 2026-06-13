import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play, Pause, RotateCcw, SkipForward,
    Timer, Coffee, Brain, Settings,
    CheckCircle2, Clock, Flame,
} from 'lucide-react'
import { focusApi } from './focusApi'
import type { SessionType } from './focusApi'
import { taskApi } from '@/features/tasks/taskApi'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type TimerState = 'idle' | 'running' | 'paused' | 'finished'

interface TimerConfig {
    work: number
    shortBreak: number
    longBreak: number
    sessionsUntilLongBreak: number
}

const DEFAULT_CONFIG: TimerConfig = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function useChime() {
    const playChime = useCallback((type: 'work_done' | 'break_done') => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

        const play = (freq: number, start: number, duration: number, gain: number) => {
            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()

            osc.connect(gainNode)
            gainNode.connect(ctx.destination)

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

            gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
            gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)

            osc.start(ctx.currentTime + start)
            osc.stop(ctx.currentTime + start + duration)
        }

        if (type === 'work_done') {
            // Three ascending notes — "you did it"
            play(523, 0.0, 0.4, 0.4)   // C5
            play(659, 0.2, 0.4, 0.4)   // E5
            play(784, 0.4, 0.6, 0.4)   // G5
        } else {
            // Two descending notes — "back to work"
            play(659, 0.0, 0.4, 0.3)   // E5
            play(523, 0.2, 0.6, 0.3)   // C5
        }
    }, [])

    return playChime
}

const sessionTypeConfig: Record<SessionType, {
    label: string
    icon: React.ReactNode
    color: string
    ring: string
}> = {
    work: {
        label: 'Focus',
        icon: <Brain size={16} />,
        color: 'text-indigo-400',
        ring: 'stroke-indigo-500',
    },
    short_break: {
        label: 'Short Break',
        icon: <Coffee size={16} />,
        color: 'text-green-400',
        ring: 'stroke-green-500',
    },
    long_break: {
        label: 'Long Break',
        icon: <Coffee size={16} />,
        color: 'text-blue-400',
        ring: 'stroke-blue-500',
    },
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularTimer({
    progress,
    sessionType,
    timeLeft,
    state,
}: {
    progress: number
    sessionType: SessionType
    timeLeft: number
    state: TimerState
}) {
    const size = 280
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference
    const config = sessionTypeConfig[sessionType]

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgb(31,41,55)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn('transition-all duration-1000', config.ring)}
                />
            </svg>

            {/* Center content */}
            <div className="absolute flex flex-col items-center">
                <div className={cn('mb-1 flex items-center gap-1.5 text-sm font-medium', config.color)}>
                    {config.icon}
                    {config.label}
                </div>
                <span className="text-6xl font-bold tabular-nums text-white">
                    {formatTime(timeLeft)}
                </span>
                {state === 'running' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex gap-1"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="h-1 w-1 rounded-full bg-indigo-400"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({
    config,
    onChange,
    onClose,
}: {
    config: TimerConfig
    onChange: (c: TimerConfig) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(config)
    const inputClass = 'w-20 rounded-lg border border-white/5 bg-gray-800 px-3 py-1.5 text-center text-sm text-white outline-none focus:border-indigo-500'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-white/10 bg-gray-900 p-5"
        >
            <h3 className="mb-4 font-semibold text-white">Timer Settings</h3>
            <div className="space-y-3">
                {[
                    { label: 'Focus (min)', key: 'work' },
                    { label: 'Short Break (min)', key: 'shortBreak' },
                    { label: 'Long Break (min)', key: 'longBreak' },
                    { label: 'Sessions until long break', key: 'sessionsUntilLongBreak' },
                ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{label}</span>
                        <input
                            type="number"
                            value={local[key as keyof TimerConfig]}
                            onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
                            className={inputClass}
                            min={1}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                >
                    Cancel
                </button>
                <button
                    onClick={() => { onChange(local); onClose() }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                    Save
                </button>
            </div>
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FocusPage() {
    const queryClient = useQueryClient()
    const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG)
    const [sessionType, setSessionType] = useState<SessionType>('work')
    const [timerState, setTimerState] = useState<TimerState>('idle')
    const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.work * 60)
    const [completedSessions, setCompletedSessions] = useState(0)
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
    const startedAtRef = useRef<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const playChime = useChime()

    const totalSeconds = (
        sessionType === 'work' ? config.work :
            sessionType === 'short_break' ? config.shortBreak :
                config.longBreak
    ) * 60

    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => taskApi.list({ status: 'todo' }),
    })

    const { data: stats } = useQuery({
        queryKey: ['focus-stats'],
        queryFn: focusApi.stats,
    })

    const { data: sessions = [] } = useQuery({
        queryKey: ['focus-sessions'],
        queryFn: focusApi.list,
    })

    const createSession = useMutation({
        mutationFn: focusApi.create,
        onSuccess: (data) => setCurrentSessionId(data.id),
    })

    const updateSession = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            focusApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['focus-sessions'] })
            queryClient.invalidateQueries({ queryKey: ['focus-stats'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['xp'] })
            queryClient.invalidateQueries({ queryKey: ['achievements'] })
        },
    })

    const clearTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
    }, [])

    const getDurationForType = useCallback((type: SessionType) => {
        if (type === 'work') return config.work
        if (type === 'short_break') return config.shortBreak
        return config.longBreak
    }, [config])

    const handleFinish = useCallback(() => {
        clearTimer()
        setTimerState('finished')

        if (currentSessionId) {
            updateSession.mutate({
                id: currentSessionId,
                data: {
                    completed: true,
                    ended_at: new Date().toISOString(),
                },
            })
        }

        if (sessionType === 'work') {
            playChime('work_done')
            const next = completedSessions + 1
            setCompletedSessions(next)
            const nextType = next % config.sessionsUntilLongBreak === 0
                ? 'long_break'
                : 'short_break'
            setTimeout(() => {
                setSessionType(nextType)
                setTimeLeft(getDurationForType(nextType) * 60)
                setTimerState('idle')
                setCurrentSessionId(null)
            }, 1500)
        } else {
            playChime('break_done')
            setTimeout(() => {
                setSessionType('work')
                setTimeLeft(config.work * 60)
                setTimerState('idle')
                setCurrentSessionId(null)
            }, 1500)
        }
    }, [clearTimer, completedSessions, config, currentSessionId, getDurationForType, playChime, sessionType, updateSession])

    useEffect(() => {
        if (timerState === 'running') {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleFinish()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            clearTimer()
        }
        return clearTimer
    }, [timerState, handleFinish, clearTimer])

    const handleStart = () => {
        if (timerState === 'idle') {
            const now = new Date().toISOString()
            startedAtRef.current = now
            createSession.mutate({
                task: selectedTaskId,
                session_type: sessionType,
                duration_minutes: getDurationForType(sessionType),
                started_at: now,
                completed: false,
            })
        }
        setTimerState('running')
    }

    const handlePause = () => setTimerState('paused')

    const handleReset = () => {
        clearTimer()
        setTimerState('idle')
        setTimeLeft(getDurationForType(sessionType) * 60)
        setCurrentSessionId(null)
    }

    const handleSkip = () => {
        clearTimer()
        const next: SessionType = sessionType === 'work' ? 'short_break' : 'work'
        setSessionType(next)
        setTimeLeft(getDurationForType(next) * 60)
        setTimerState('idle')
        setCurrentSessionId(null)
    }

    const handleConfigChange = (newConfig: TimerConfig) => {
        setConfig(newConfig)
        setTimeLeft(newConfig.work * 60)
        setTimerState('idle')
        setCurrentSessionId(null)
    }

    return (
        <div className="flex h-full flex-col">
            <Header title="Focus" subtitle="Deep work sessions" />

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                        {/* Timer Column */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Session type tabs */}
                            <div className="flex items-center gap-2 rounded-2xl p-2"
                                style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                            >
                                {(['work', 'short_break', 'long_break'] as SessionType[]).map((type) => {
                                    const c = sessionTypeConfig[type]
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (timerState === 'idle') {
                                                    setSessionType(type)
                                                    setTimeLeft(getDurationForType(type) * 60)
                                                }
                                            }}
                                            disabled={timerState !== 'idle'}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all"
                                            style={{
                                                background: sessionType === type
                                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))'
                                                    : 'transparent',
                                                border: sessionType === type
                                                    ? '1px solid rgba(99,130,255,0.2)'
                                                    : '1px solid transparent',
                                                color: sessionType === type ? 'white' : '#3a5070',
                                                boxShadow: sessionType === type ? '0 0 12px rgba(99,102,241,0.1)' : 'none',
                                            }}
                                        >
                                            <span className={sessionType === type ? c.color : ''}>{c.icon}</span>
                                            {c.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Timer */}
                            <div className="flex flex-col items-center rounded-2xl py-8"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
                            >
                                <CircularTimer
                                    progress={progress}
                                    sessionType={sessionType}
                                    timeLeft={timeLeft}
                                    state={timerState}
                                />

                                {/* Session dots */}
                                <div className="mt-4 flex gap-2">
                                    {Array.from({ length: config.sessionsUntilLongBreak }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'h-2 w-2 rounded-full transition',
                                                i < (completedSessions % config.sessionsUntilLongBreak)
                                                    ? 'bg-indigo-500'
                                                    : 'bg-gray-700'
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="mt-6 flex items-center gap-4">
                                    <button
                                        onClick={handleReset}
                                        className="rounded-xl p-3 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <RotateCcw size={20} />
                                    </button>

                                    <button
                                        onClick={timerState === 'running' ? handlePause : handleStart}
                                        className="flex h-16 w-16 items-center justify-center rounded-2xl text-white transition-all active:scale-95"
                                        style={{
                                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                            boxShadow: '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
                                        }}
                                    >
                                        {timerState === 'running'
                                            ? <Pause size={28} />
                                            : <Play size={28} className="translate-x-0.5" />
                                        }
                                    </button>

                                    <button
                                        onClick={handleSkip}
                                        className="rounded-xl p-3 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                </div>

                                {/* Task selector */}
                                <div className="mt-6 w-full max-w-xs px-6">
                                    <select
                                        value={selectedTaskId ?? ''}
                                        onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                                        disabled={timerState !== 'idle'}
                                        className="w-full rounded-xl border border-white/5 bg-gray-800 px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">No task linked</option>
                                        {tasks.map((t) => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Settings toggle */}
                            <div>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-300"
                                >
                                    <Settings size={14} />
                                    {showSettings ? 'Hide settings' : 'Customize timer'}
                                </button>
                                <AnimatePresence>
                                    {showSettings && (
                                        <div className="mt-3">
                                            <SettingsPanel
                                                config={config}
                                                onChange={handleConfigChange}
                                                onClose={() => setShowSettings(false)}
                                            />
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Stats Column */}
                        <div className="space-y-4">

                            {/* Today stats */}
                            <div className="rounded-2xl p-5"
                                style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                            >
                                <h3 className="mb-4 text-sm font-semibold text-white">Today</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Focus time', value: formatMinutes(stats?.today_minutes ?? 0), icon: <Clock size={14} /> },
                                        { label: 'Sessions', value: String(stats?.today_sessions ?? 0), icon: <Timer size={14} /> },
                                        { label: 'Total sessions', value: String(stats?.total_sessions ?? 0), icon: <Flame size={14} /> },
                                    ].map(({ label, value, icon }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm" style={{ color: '#6b89b4' }}>
                                                <span style={{ color: '#3a5070' }}>{icon}</span>
                                                {label}
                                            </div>
                                            <span className="text-sm font-bold text-white">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly bar chart */}
                            <div className="rounded-2xl p-5"
                                style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                            >
                                <h3 className="mb-4 text-sm font-semibold text-white">This Week</h3>
                                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                                    {(stats?.daily ?? []).map((d, i) => {
                                        const maxMins = Math.max(...(stats?.daily ?? []).map((x) => x.minutes), 1)
                                        const heightPct = (d.minutes / maxMins) * 100
                                        const isToday = i === (stats?.daily ?? []).length - 1
                                        return (
                                            <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                                <div className="relative w-full rounded-t-sm bg-gray-800" style={{ height: 56 }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPct}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05 }}
                                                        className={cn(
                                                            'absolute bottom-0 w-full rounded-t-sm',
                                                            isToday ? 'bg-indigo-500' : 'bg-indigo-500/40'
                                                        )}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    'text-xs',
                                                    isToday ? 'font-medium text-indigo-400' : 'text-gray-600'
                                                )}>
                                                    {d.date}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Recent sessions */}
                            <div className="rounded-2xl p-5"
                                style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                            >
                                <h3 className="mb-4 text-sm font-semibold text-white">Recent Sessions</h3>
                                {sessions.length === 0 ? (
                                    <p className="text-center text-xs text-gray-600 py-4">
                                        No sessions yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {sessions.slice(0, 5).map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between rounded-xl bg-gray-800/50 px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                                                    <span className="truncate text-xs text-gray-300 max-w-[120px]">
                                                        {s.task_title ?? 'No task'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 shrink-0">
                                                    {s.duration_minutes}m
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}