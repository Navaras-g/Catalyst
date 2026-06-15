import apiClient from '@/api/client'

export type SessionType = 'work' | 'short_break' | 'long_break'

export interface FocusSession {
    id: number
    task: number | null
    task_title: string | null
    session_type: SessionType
    duration_minutes: number
    completed: boolean
    started_at: string
    ended_at: string | null
}

export interface FocusStats {
    today_minutes: number
    today_sessions: number
    week_minutes: number
    last_week_minutes: number
    week_change: number | null
    all_time_minutes: number
    total_sessions: number
    best_day: string | null
    best_day_minutes: number
    daily: { date: string; minutes: number }[]
}

export const focusApi = {
    list: async () => {
        const res = await apiClient.get<FocusSession[]>('/focus/')
        return res.data
    },
    create: async (data: {
        task?: number | null
        session_type: SessionType
        duration_minutes: number
        started_at: string
        completed: boolean
        ended_at?: string | null
    }) => {
        const res = await apiClient.post<FocusSession>('/focus/', data)
        return res.data
    },
    update: async (id: number, data: Partial<FocusSession>) => {
        const res = await apiClient.patch<FocusSession>(`/focus/${id}/`, data)
        return res.data
    },
    stats: async () => {
        const res = await apiClient.get<FocusStats>('/focus/stats/')
        return res.data
    },
}