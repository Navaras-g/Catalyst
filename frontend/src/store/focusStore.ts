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
    sessionType: SessionType
    timerState: 'idle' | 'running' | 'paused' | 'finished'
    timeLeft: number
    completedSessions: number
    currentSessionId: number | null
    selectedTaskId: number | null
    startedAt: string | null
    tickStartedAt: number | null   // timestamp when current tick period began
    tickStartTimeLeft: number | null // timeLeft when current tick period began
    config: TimerConfig

    setSessionType: (t: SessionType) => void
    setTimerState: (s: 'idle' | 'running' | 'paused' | 'finished') => void
    setTimeLeft: (t: number) => void
    setCompletedSessions: (n: number) => void
    setCurrentSessionId: (id: number | null) => void
    setSelectedTaskId: (id: number | null) => void
    setStartedAt: (s: string | null) => void
    setTickStart: (ts: number, tl: number) => void
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
            tickStartedAt: null,
            tickStartTimeLeft: null,
            config: DEFAULT_CONFIG,

            setSessionType: (t) => set({ sessionType: t }),
            setTimerState: (s) => set({ timerState: s }),
            setTimeLeft: (t) => set({ timeLeft: t }),
            setCompletedSessions: (n) => set({ completedSessions: n }),
            setCurrentSessionId: (id) => set({ currentSessionId: id }),
            setSelectedTaskId: (id) => set({ selectedTaskId: id }),
            setStartedAt: (s) => set({ startedAt: s }),
            setTickStart: (ts, tl) => set({ tickStartedAt: ts, tickStartTimeLeft: tl }),
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
                    tickStartedAt: null,
                    tickStartTimeLeft: null,
                })
            },
        }),
        {
            name: 'catalyst-focus',
            partialize: (state) => ({
                sessionType: state.sessionType,
                timerState: state.timerState === 'running' ? 'paused' : state.timerState,
                timeLeft: state.timeLeft,
                completedSessions: state.completedSessions,
                selectedTaskId: state.selectedTaskId,
                config: state.config,
                currentSessionId: state.currentSessionId,
            }),
        }
    )
)