import apiClient from '@/api/client'

export interface Note {
    id: number
    title: string
    content: string
    is_pinned: boolean
    task: number | null
    task_title: string | null
    project: number | null
    project_title: string | null
    created_at: string
    updated_at: string
}

export interface NotePayload {
    title: string
    content?: string
    is_pinned?: boolean
    task?: number | null
    project?: number | null
}

export const noteApi = {
    list: async (params?: Record<string, string>) => {
        const res = await apiClient.get<Note[]>('/notes/', { params })
        return res.data
    },
    get: async (id: number) => {
        const res = await apiClient.get<Note>(`/notes/${id}/`)
        return res.data
    },
    create: async (data: NotePayload) => {
        const res = await apiClient.post<Note>('/notes/', data)
        return res.data
    },
    update: async (id: number, data: Partial<NotePayload>) => {
        const res = await apiClient.patch<Note>(`/notes/${id}/`, data)
        return res.data
    },
    delete: async (id: number) => {
        await apiClient.delete(`/notes/${id}/`)
    },
}