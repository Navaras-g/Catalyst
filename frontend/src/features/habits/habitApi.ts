import apiClient from '@/api/client'

export type HabitFrequency = 'daily' | 'weekly'

export interface HabitLog {
    id: number
    date: string
    completed: boolean
}

export interface Habit {
    id: number
    title: string
    description: string
    frequency: HabitFrequency
    color: string
    icon: string
    is_active: boolean
    logs: HabitLog[]
    completed_today: boolean
    current_streak: number
    longest_streak: number
    completion_rate: number
    created_at: string
    updated_at: string
}

export interface HabitPayload {
    title: string
    description?: string
    frequency?: HabitFrequency
    color?: string
    icon?: string
}

export const habitApi = {
    list: async () => {
        const res = await apiClient.get<Habit[]>('/habits/')
        return res.data
    },
    create: async (data: HabitPayload) => {
        const res = await apiClient.post<Habit>('/habits/', data)
        return res.data
    },
    update: async (id: number, data: Partial<HabitPayload>) => {
        const res = await apiClient.patch<Habit>(`/habits/${id}/`, data)
        return res.data
    },
    delete: async (id: number) => {
        await apiClient.delete(`/habits/${id}/`)
    },
    log: async (id: number) => {
        const res = await apiClient.post<{ completed: boolean; date: string }>(
            `/habits/${id}/log/`
        )
        return res.data
    },
    stats: async () => {
        const res = await apiClient.get<{ total: number; completed_today: number }>(
            '/habits/stats/'
        )
        return res.data
    },
}