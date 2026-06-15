import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionType } from '@/features/focus/focusApi'

interface TimerConfig {
    work: number
    shortBreak: number
    longBreak: number
    sessionsUntilLongBreak: number
}

interface FocusStore {
    // Timer state
    sessionType: SessionType
    timerState: 'idle' | 'running' | 'paused' | 'finished'
    timeLeft: number
    completedSessions: number
    currentSessionId: number | null
    selectedTaskId: number | null
    startedAt: string | null
    config: TimerConfig

    // Actions
    setSessionType: (t: SessionType) => void
    setTimerState: (s: 'idle' | 'running' | 'paused' | 'finished') => void
    setTimeLeft: (t: number) => void
    setCompletedSessions: (n: number) => void
    setCurrentSessionId: (id: number | null) => void
    setSelectedTaskId: (id: number | null) => void
    setStartedAt: (s: string | null) => void
    setConfig: (c: TimerConfig) => void
    resetTimer: () => void
}

const DEFAULT_CONFIG: TimerConfig = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
}

export const useFocusStore = create<FocusStore>()(
    persist(
        (set, get) => ({
            sessionType: 'work',
            timerState: 'idle',
            timeLeft: DEFAULT_CONFIG.work * 60,
            completedSessions: 0,
            currentSessionId: null,
            selectedTaskId: null,
            startedAt: null,
            config: DEFAULT_CONFIG,

            setSessionType: (t) => set({ sessionType: t }),
            setTimerState: (s) => set({ timerState: s }),
            setTimeLeft: (t) => set({ timeLeft: t }),
            setCompletedSessions: (n) => set({ completedSessions: n }),
            setCurrentSessionId: (id) => set({ currentSessionId: id }),
            setSelectedTaskId: (id) => set({ selectedTaskId: id }),
            setStartedAt: (s) => set({ startedAt: s }),
            setConfig: (c) => set({ config: c }),
            resetTimer: () => {
                const { config, sessionType } = get()
                const duration =
                    sessionType === 'work' ? config.work :
                        sessionType === 'short_break' ? config.shortBreak :
                            config.longBreak
                set({
                    timerState: 'idle',
                    timeLeft: duration * 60,
                    currentSessionId: null,
                    startedAt: null,
                })
            },
        }),
        {
            name: 'catalyst-focus',
            // Don't persist running state — if they close the browser, timer stops
            partialize: (state) => ({
                sessionType: state.sessionType,
                timerState: state.timerState === 'running' ? 'paused' : state.timerState,
                timeLeft: state.timeLeft,
                completedSessions: state.completedSessions,
                selectedTaskId: state.selectedTaskId,
                config: state.config,
            }),
        }
    )
)