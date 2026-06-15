import { useEffect, useRef, useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play, Pause, RotateCcw, SkipForward,
    Timer, Coffee, Brain, Settings,
    CheckCircle2, Clock, Flame, TrendingUp,
    TrendingDown, Award, Zap, StopCircle,
} from 'lucide-react'
import { focusApi } from './focusApi'
import type { SessionType } from './focusApi'
import { taskApi } from '@/features/tasks/taskApi'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { useFocusStore } from '@/store/focusStore'

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

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
        ring: '#6366f1',
    },
    short_break: {
        label: 'Short Break',
        icon: <Coffee size={16} />,
        color: 'text-green-400',
        ring: '#10b981',
    },
    long_break: {
        label: 'Long Break',
        icon: <Coffee size={16} />,
        color: 'text-blue-400',
        ring: '#3b82f6',
    },
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

function formatMinutes(mins: number) {
    if (mins === 0) return '0m'
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatHours(mins: number) {
    const h = (mins / 60).toFixed(1)
    return `${h}h`
}

function useChime() {
    const playChime = useCallback((type: 'work_done' | 'break_done') => {
        try {
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
                play(523, 0.0, 0.4, 0.4)
                play(659, 0.2, 0.4, 0.4)
                play(784, 0.4, 0.6, 0.4)
            } else {
                play(659, 0.0, 0.4, 0.3)
                play(523, 0.2, 0.6, 0.3)
            }
        } catch (e) {
            // Audio not available
        }
    }, [])
    return playChime
}

function CircularTimer({
    progress, sessionType, timeLeft, state, totalSeconds,
}: {
    progress: number
    sessionType: SessionType
    timeLeft: number
    state: TimerState
    totalSeconds: number
}) {
    const size = 280
    const strokeWidth = 10
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference
    const config = sessionTypeConfig[sessionType]
    const pct = Math.round(progress)

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Outer glow */}
            <div
                className="absolute rounded-full opacity-10 blur-2xl"
                style={{
                    width: size * 0.7,
                    height: size * 0.7,
                    background: config.ring,
                }}
            />
            <svg width={size} height={size} className="-rotate-90">
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="rgba(99,130,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    stroke={config.ring}
                    style={{
                        transition: 'stroke-dashoffset 0.5s linear',
                        filter: `drop-shadow(0 0 8px ${config.ring}80)`,
                    }}
                />
            </svg>

            <div className="absolute flex flex-col items-center">
                <div className={cn('mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider', config.color)}>
                    {config.icon}
                    {config.label}
                </div>
                <span className="text-6xl font-bold tabular-nums text-white" style={{
                    textShadow: state === 'running' ? `0 0 20px ${config.ring}40` : 'none',
                }}>
                    {formatTime(timeLeft)}
                </span>
                <span className="mt-1 text-xs" style={{ color: '#3a5070' }}>
                    {pct}% complete
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
                                className="h-1 w-1 rounded-full"
                                style={{ background: config.ring }}
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

function SettingsPanel({
    config, onChange, onClose,
}: {
    config: any
    onChange: (c: any) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(config)
    const keys = [
        { label: 'Focus (min)', key: 'work' },
        { label: 'Short Break (min)', key: 'shortBreak' },
        { label: 'Long Break (min)', key: 'longBreak' },
        { label: 'Sessions until long break', key: 'sessionsUntilLongBreak' },
    ]
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl p-5"
            style={{
                background: 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(99,179,255,0.08)',
            }}
        >
            <h3 className="mb-4 font-semibold text-white">Timer Settings</h3>
            <div className="space-y-3">
                {keys.map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#6b89b4' }}>{label}</span>
                        <input
                            type="number"
                            value={local[key]}
                            onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
                            className="w-20 rounded-lg px-3 py-1.5 text-center text-sm text-white outline-none"
                            style={{
                                background: 'rgba(15,31,61,0.8)',
                                border: '1px solid rgba(99,130,255,0.12)',
                            }}
                            min={1}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm"
                    style={{ color: '#6b89b4' }}
                >
                    Cancel
                </button>
                <button
                    onClick={() => { onChange(local); onClose() }}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                >
                    Save
                </button>
            </div>
        </motion.div>
    )
}

// ─── Global interval — survives navigation ────────────────────────────────────
let globalIntervalRef: ReturnType<typeof setInterval> | null = null

export default function FocusPage() {
    const queryClient = useQueryClient()
    const playChime = useChime()
    const [showSettings, setShowSettings] = useState(false)
    const finishHandlerRef = useRef<(() => void) | null>(null)

    const {
        config, sessionType, timerState, timeLeft, completedSessions,
        selectedTaskId, currentSessionId, startedAt,
        setConfig, setSessionType, setTimerState, setTimeLeft,
        setCompletedSessions, setSelectedTaskId, setCurrentSessionId,
        setStartedAt, setTickStart, resetTimer,
    } = useFocusStore()

    const totalSeconds = (
        sessionType === 'work' ? config.work :
            sessionType === 'short_break' ? config.shortBreak :
                config.longBreak
    ) * 60

    const progress = Math.min(
        ((totalSeconds - timeLeft) / totalSeconds) * 100,
        100
    )

    const getDurationForType = useCallback((type: SessionType) => {
        if (type === 'work') return config.work
        if (type === 'short_break') return config.shortBreak
        return config.longBreak
    }, [config])

    // Calculate elapsed minutes for early finish
    const getElapsedMinutes = useCallback(() => {
        const elapsed = totalSeconds - useFocusStore.getState().timeLeft
        return Math.max(1, Math.round(elapsed / 60))
    }, [totalSeconds])

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => taskApi.list({ status: 'todo' }),
    })

    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['focus-stats'],
        queryFn: focusApi.stats,
    })

    const { data: sessions = [], refetch: refetchSessions } = useQuery({
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
            queryClient.invalidateQueries({ queryKey: ['insights'] })
        },
    })

    const stopGlobalInterval = useCallback(() => {
        if (globalIntervalRef) {
            clearInterval(globalIntervalRef)
            globalIntervalRef = null
        }
    }, [])

    const handleFinish = useCallback(() => {
        stopGlobalInterval()
        setTimerState('finished')

        const { currentSessionId: sid } = useFocusStore.getState()
        if (sid) {
            updateSession.mutate({
                id: sid,
                data: { completed: true, ended_at: new Date().toISOString() },
            })
        }

        const {
            sessionType: sType,
            completedSessions: cs,
            config: cfg,
        } = useFocusStore.getState()

        if (sType === 'work') {
            playChime('work_done')
            const next = cs + 1
            setCompletedSessions(next)
            const nextType = next % cfg.sessionsUntilLongBreak === 0
                ? 'long_break' : 'short_break'
            setTimeout(() => {
                setSessionType(nextType)
                setTimeLeft(
                    nextType === 'short_break' ? cfg.shortBreak * 60 : cfg.longBreak * 60
                )
                setTimerState('idle')
                setCurrentSessionId(null)
            }, 1500)
        } else {
            playChime('break_done')
            setTimeout(() => {
                setSessionType('work')
                setTimeLeft(useFocusStore.getState().config.work * 60)
                setTimerState('idle')
                setCurrentSessionId(null)
            }, 1500)
        }
    }, [
        stopGlobalInterval, setTimerState, updateSession, playChime,
        setCompletedSessions, setSessionType, setTimeLeft, setCurrentSessionId,
    ])

    // Keep ref up to date so the interval always calls the latest version
    useEffect(() => {
        finishHandlerRef.current = handleFinish
    }, [handleFinish])

    // ─── Timestamp-based timer — immune to browser throttling ─────────────────
    useEffect(() => {
        if (timerState === 'running') {
            stopGlobalInterval()

            // Record when this running period started and what timeLeft was then
            const tickStart = Date.now()
            const tickStartLeft = useFocusStore.getState().timeLeft
            setTickStart(tickStart, tickStartLeft)

            globalIntervalRef = setInterval(() => {
                const state = useFocusStore.getState()
                // Calculate true elapsed time from timestamp — not tick count
                const elapsed = Math.floor((Date.now() - tickStart) / 1000)
                const newTimeLeft = Math.max(0, tickStartLeft - elapsed)

                if (newTimeLeft <= 0) {
                    useFocusStore.getState().setTimeLeft(0)
                    finishHandlerRef.current?.()
                } else {
                    useFocusStore.getState().setTimeLeft(newTimeLeft)
                }
            }, 500) // Check every 500ms for responsiveness, but time based on real clock
        } else {
            stopGlobalInterval()
        }

        return () => {
            const state = useFocusStore.getState().timerState
            if (state !== 'running') {
                stopGlobalInterval()
            }
        }
    }, [timerState, stopGlobalInterval, setTickStart])

    const handleStart = () => {
        if (timerState === 'idle') {
            const now = new Date().toISOString()
            setStartedAt(now)
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

    const handlePause = () => {
        stopGlobalInterval()
        setTimerState('paused')
    }

    const handleReset = () => {
        stopGlobalInterval()
        resetTimer()
    }

    const handleSkip = () => {
        stopGlobalInterval()
        const next: SessionType = sessionType === 'work' ? 'short_break' : 'work'
        setSessionType(next)
        setTimeLeft(getDurationForType(next) * 60)
        setTimerState('idle')
        setCurrentSessionId(null)
    }

    // ─── Early finish — record elapsed time ───────────────────────────────────
    const handleFinishEarly = () => {
        stopGlobalInterval()
        setTimerState('finished')

        const elapsed = getElapsedMinutes()
        const sid = useFocusStore.getState().currentSessionId

        if (sid) {
            updateSession.mutate({
                id: sid,
                data: {
                    completed: true,
                    ended_at: new Date().toISOString(),
                    duration_minutes: elapsed,
                },
            })
        }

        playChime('work_done')
        const next = completedSessions + 1
        setCompletedSessions(next)
        const nextType = next % config.sessionsUntilLongBreak === 0
            ? 'long_break' : 'short_break'

        setTimeout(() => {
            setSessionType(nextType)
            setTimeLeft(getDurationForType(nextType) * 60)
            setTimerState('idle')
            setCurrentSessionId(null)
        }, 1500)
    }

    const handleConfigChange = (newConfig: any) => {
        stopGlobalInterval()
        setConfig(newConfig)
        setTimeLeft(newConfig.work * 60)
        setTimerState('idle')
        setCurrentSessionId(null)
    }

    const weekChange = stats?.week_change
    const allTimeHours = formatHours(stats?.all_time_minutes ?? 0)

    return (
        <div className="flex h-full flex-col">
            <Header title="Focus" subtitle="Deep work sessions" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-5xl space-y-6">

                    {/* Main grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                        {/* Timer column */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Session tabs */}
                            <div
                                className="flex items-center gap-2 rounded-2xl p-2"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
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
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all disabled:cursor-not-allowed"
                                            style={{
                                                background: sessionType === type
                                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))'
                                                    : 'transparent',
                                                border: sessionType === type
                                                    ? '1px solid rgba(99,130,255,0.2)'
                                                    : '1px solid transparent',
                                                color: sessionType === type ? 'white' : '#3a5070',
                                                boxShadow: sessionType === type
                                                    ? '0 0 12px rgba(99,102,241,0.1)'
                                                    : 'none',
                                            }}
                                        >
                                            <span className={sessionType === type ? c.color : ''}>
                                                {c.icon}
                                            </span>
                                            {c.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Timer card */}
                            <div
                                className="relative flex flex-col items-center overflow-hidden rounded-2xl py-8"
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
                                    totalSeconds={totalSeconds}
                                />

                                {/* Session dots */}
                                <div className="mt-4 flex gap-2">
                                    {Array.from({ length: config.sessionsUntilLongBreak }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-2 w-2 rounded-full transition-all duration-300"
                                            style={{
                                                background: i < (completedSessions % config.sessionsUntilLongBreak)
                                                    ? '#6366f1' : 'rgba(99,130,255,0.1)',
                                                boxShadow: i < (completedSessions % config.sessionsUntilLongBreak)
                                                    ? '0 0 6px rgba(99,102,241,0.6)' : 'none',
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="mt-6 flex items-center gap-4">
                                    <button
                                        onClick={handleReset}
                                        className="rounded-xl p-3 transition"
                                        style={{ color: '#3a5070' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#6b89b4'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#3a5070'}
                                        title="Reset"
                                    >
                                        <RotateCcw size={20} />
                                    </button>

                                    <motion.button
                                        onClick={timerState === 'running' ? handlePause : handleStart}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                                        style={{
                                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                            boxShadow: '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
                                        }}
                                    >
                                        {timerState === 'running'
                                            ? <Pause size={28} />
                                            : <Play size={28} className="translate-x-0.5" />
                                        }
                                    </motion.button>

                                    <button
                                        onClick={handleSkip}
                                        className="rounded-xl p-3 transition"
                                        style={{ color: '#3a5070' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#6b89b4'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#3a5070'}
                                        title="Skip"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                </div>

                                {/* Early finish button */}
                                <AnimatePresence>
                                    {(timerState === 'running' || timerState === 'paused') &&
                                        sessionType === 'work' && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                onClick={handleFinishEarly}
                                                className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                                                style={{
                                                    background: 'rgba(16,185,129,0.08)',
                                                    border: '1px solid rgba(16,185,129,0.2)',
                                                    color: '#34d399',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                                                    e.currentTarget.style.boxShadow = '0 0 12px rgba(16,185,129,0.2)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                                                    e.currentTarget.style.boxShadow = 'none'
                                                }}
                                            >
                                                <StopCircle size={15} />
                                                Finish early — record {getElapsedMinutes()}m
                                            </motion.button>
                                        )}
                                </AnimatePresence>

                                {/* Task selector */}
                                <div className="mt-5 w-full max-w-xs px-6">
                                    <select
                                        value={selectedTaskId ?? ''}
                                        onChange={(e) =>
                                            setSelectedTaskId(e.target.value ? Number(e.target.value) : null)
                                        }
                                        disabled={timerState !== 'idle'}
                                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background: 'rgba(15,31,61,0.8)',
                                            border: '1px solid rgba(99,130,255,0.08)',
                                            color: '#6b89b4',
                                        }}
                                    >
                                        <option value="">No task linked</option>
                                        {tasks.map((t) => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Settings */}
                            <div>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="flex items-center gap-2 text-sm transition"
                                    style={{ color: '#3a5070' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#6b89b4'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#3a5070'}
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

                        {/* Stats column */}
                        <div className="space-y-4">

                            {/* Today */}
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
                            >
                                <h3 className="mb-4 text-sm font-semibold text-white">Today</h3>
                                <div className="space-y-3">
                                    {[
                                        {
                                            label: 'Focus time',
                                            value: formatMinutes(stats?.today_minutes ?? 0),
                                            icon: <Clock size={14} />,
                                        },
                                        {
                                            label: 'Sessions',
                                            value: String(stats?.today_sessions ?? 0),
                                            icon: <Timer size={14} />,
                                        },
                                        {
                                            label: 'This week',
                                            value: formatMinutes(stats?.week_minutes ?? 0),
                                            icon: <Flame size={14} />,
                                        },
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

                            {/* Weekly chart */}
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-white">This Week</h3>
                                    {weekChange !== null && weekChange !== undefined && (
                                        <div
                                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                            style={{
                                                background: weekChange >= 0
                                                    ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: weekChange >= 0 ? '#34d399' : '#f87171',
                                                border: `1px solid ${weekChange >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                            }}
                                        >
                                            {weekChange >= 0
                                                ? <TrendingUp size={10} />
                                                : <TrendingDown size={10} />
                                            }
                                            {weekChange >= 0 ? '+' : ''}{weekChange}% vs last week
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                                    {(stats?.daily ?? []).map((d, i) => {
                                        const maxMins = Math.max(
                                            ...(stats?.daily ?? []).map((x) => x.minutes), 1
                                        )
                                        const heightPct = (d.minutes / maxMins) * 100
                                        const isToday = i === (stats?.daily ?? []).length - 1
                                        return (
                                            <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                                                <div
                                                    className="relative w-full rounded-t-sm"
                                                    style={{ height: 56, background: 'rgba(99,130,255,0.05)' }}
                                                >
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPct}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05 }}
                                                        className="absolute bottom-0 w-full rounded-t-sm"
                                                        style={{
                                                            background: isToday
                                                                ? 'linear-gradient(180deg, #6366f1, #3b82f6)'
                                                                : 'rgba(99,102,241,0.35)',
                                                            boxShadow: isToday
                                                                ? '0 0 8px rgba(99,102,241,0.4)'
                                                                : 'none',
                                                        }}
                                                    />
                                                    {d.minutes > 0 && (
                                                        <div
                                                            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            style={{
                                                                background: 'rgba(10,22,40,0.9)',
                                                                color: '#6b89b4',
                                                                border: '1px solid rgba(99,130,255,0.1)',
                                                            }}
                                                        >
                                                            {formatMinutes(d.minutes)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: isToday ? '#818cf8' : '#3a5070',
                                                        fontWeight: isToday ? 600 : 400,
                                                    }}
                                                >
                                                    {d.date}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Recent sessions */}
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                }}
                            >
                                <h3 className="mb-4 text-sm font-semibold text-white">Recent</h3>
                                {sessions.length === 0 ? (
                                    <p className="py-4 text-center text-xs" style={{ color: '#3a5070' }}>
                                        No sessions yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {sessions.slice(0, 5).map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between rounded-xl px-3 py-2"
                                                style={{
                                                    background: 'rgba(15,31,61,0.6)',
                                                    border: '1px solid rgba(99,130,255,0.06)',
                                                }}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <CheckCircle2 size={14} style={{ color: '#34d399' }} className="shrink-0" />
                                                    <span
                                                        className="truncate text-xs"
                                                        style={{ color: '#6b89b4' }}
                                                    >
                                                        {s.task_title ?? 'No task'}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 text-xs ml-2" style={{ color: '#3a5070' }}>
                                                    {s.duration_minutes}m
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── All-time report ─────────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative overflow-hidden rounded-2xl p-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(59,130,246,0.04) 100%)',
                            border: '1px solid rgba(99,102,241,0.12)',
                        }}
                    >
                        {/* Decorative glow */}
                        <div
                            className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-10"
                            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
                        />

                        <div className="relative">
                            <div className="mb-5 flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                                >
                                    <Award size={16} className="text-white" />
                                </div>
                                <h3 className="font-semibold text-white">All-Time Report</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {/* Total hours */}
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(10,22,40,0.6)',
                                        border: '1px solid rgba(99,130,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={14} style={{ color: '#3a5070' }} />
                                        <span className="text-xs" style={{ color: '#3a5070' }}>Total Focus</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{allTimeHours}</p>
                                    <p className="mt-0.5 text-xs" style={{ color: '#3a5070' }}>
                                        {formatMinutes(stats?.all_time_minutes ?? 0)}
                                    </p>
                                </div>

                                {/* Total sessions */}
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(10,22,40,0.6)',
                                        border: '1px solid rgba(99,130,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Timer size={14} style={{ color: '#3a5070' }} />
                                        <span className="text-xs" style={{ color: '#3a5070' }}>Sessions</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats?.total_sessions ?? 0}
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: '#3a5070' }}>completed</p>
                                </div>

                                {/* Best day */}
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(10,22,40,0.6)',
                                        border: '1px solid rgba(99,130,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={14} style={{ color: '#3a5070' }} />
                                        <span className="text-xs" style={{ color: '#3a5070' }}>Best Day</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">
                                        {stats?.best_day_minutes
                                            ? formatMinutes(stats.best_day_minutes)
                                            : '—'}
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: '#3a5070' }}>
                                        {stats?.best_day ?? 'no data yet'}
                                    </p>
                                </div>

                                {/* Avg per session */}
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(10,22,40,0.6)',
                                        border: '1px solid rgba(99,130,255,0.08)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={14} style={{ color: '#3a5070' }} />
                                        <span className="text-xs" style={{ color: '#3a5070' }}>Avg Session</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats?.total_sessions
                                            ? Math.round((stats.all_time_minutes ?? 0) / stats.total_sessions)
                                            : 0}m
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: '#3a5070' }}>per session</p>
                                </div>
                            </div>

                            {/* Milestone bar */}
                            {(stats?.all_time_minutes ?? 0) > 0 && (
                                <div className="mt-5">
                                    {(() => {
                                        const milestones = [60, 300, 600, 1200, 3000, 6000]
                                        const totalMins = stats?.all_time_minutes ?? 0
                                        const nextMilestone = milestones.find((m) => m > totalMins) ?? milestones[milestones.length - 1]
                                        const prevMilestone = milestones[milestones.indexOf(nextMilestone) - 1] ?? 0
                                        const pct = Math.min(
                                            ((totalMins - prevMilestone) / (nextMilestone - prevMilestone)) * 100,
                                            100
                                        )
                                        return (
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                                    <span style={{ color: '#3a5070' }}>
                                                        Next milestone: {formatMinutes(nextMilestone)}
                                                    </span>
                                                    <span style={{ color: '#6b89b4' }}>
                                                        {formatMinutes(totalMins)} / {formatMinutes(nextMilestone)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="h-1.5 w-full overflow-hidden rounded-full"
                                                    style={{ background: 'rgba(99,130,255,0.08)' }}
                                                >
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{
                                                            background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                                                            boxShadow: '0 0 8px rgba(99,102,241,0.4)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    )
}