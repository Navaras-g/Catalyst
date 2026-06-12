import apiClient from '@/api/client'

export type ProjectStatus = 'active' | 'completed' | 'on_hold'

export interface Project {
    id: number
    title: string
    description: string
    color: string
    status: ProjectStatus
    due_date: string | null
    task_count: number
    completed_task_count: number
    progress: number
    created_at: string
    updated_at: string
}

export interface ProjectPayload {
    title: string
    description?: string
    color?: string
    status?: ProjectStatus
    due_date?: string | null
}

export const projectApi = {
    list: async () => {
        const res = await apiClient.get<Project[]>('/projects/')
        return res.data
    },
    create: async (data: ProjectPayload) => {
        const res = await apiClient.post<Project>('/projects/', data)
        return res.data
    },
    update: async (id: number, data: Partial<ProjectPayload>) => {
        const res = await apiClient.patch<Project>(`/projects/${id}/`, data)
        return res.data
    },
    delete: async (id: number) => {
        await apiClient.delete(`/projects/${id}/`)
    },
}