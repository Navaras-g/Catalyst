import apiClient from '@/api/client'

export interface CalendarDay {
    tasks: {
        id: number
        title: string
        status: string
        priority: string
    }[]
    focus_minutes: number
}

export interface CalendarData {
    year: number
    month: number
    days: Record<string, CalendarDay>
}

export const calendarApi = {
    get: async (year: number, month: number) => {
        const res = await apiClient.get<CalendarData>('/dashboard/calendar/', {
            params: { year, month },
        })
        return res.data
    },
}