import apiClient from '@/api/client'

export interface Category {
    id: number
    name: string
    color: string
}

export interface Tag {
    id: number
    name: string
}

export interface SubTask {
    id: number
    title: string
    is_completed: boolean
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
    id: number
    title: string
    description: string
    priority: Priority
    status: TaskStatus
    due_date: string | null
    estimated_minutes: number | null
    is_starred: boolean
    project: number | null
    category: number | null
    category_detail: Category | null
    tags: Tag[]
    subtasks: SubTask[]
    created_at: string
    updated_at: string
}

export interface TaskPayload {
    title: string
    description?: string
    priority?: Priority
    status?: TaskStatus
    due_date?: string | null
    estimated_minutes?: number | null
    is_starred?: boolean
    project?: number | null
    category?: number | null
    tag_ids?: number[]
}

export const taskApi = {
    list: async (params?: Record<string, string>) => {
        const res = await apiClient.get<Task[]>('/tasks/', { params })
        return res.data
    },
    create: async (data: TaskPayload) => {
        const res = await apiClient.post<Task>('/tasks/', data)
        return res.data
    },
    update: async (id: number, data: Partial<TaskPayload>) => {
        const res = await apiClient.patch<Task>(`/tasks/${id}/`, data)
        return res.data
    },
    delete: async (id: number) => {
        await apiClient.delete(`/tasks/${id}/`)
    },
    createSubTask: async (taskId: number, title: string) => {
        const res = await apiClient.post(`/tasks/${taskId}/subtasks/`, { title })
        return res.data
    },
    updateSubTask: async (taskId: number, subId: number, data: Partial<SubTask>) => {
        const res = await apiClient.patch(`/tasks/${taskId}/subtasks/${subId}/`, data)
        return res.data
    },
    deleteSubTask: async (taskId: number, subId: number) => {
        await apiClient.delete(`/tasks/${taskId}/subtasks/${subId}/`)
    },
    getCategories: async () => {
        const res = await apiClient.get<Category[]>('/tasks/categories/')
        return res.data
    },
    createCategory: async (data: { name: string; color: string }) => {
        const res = await apiClient.post<Category>('/tasks/categories/', data)
        return res.data
    },
}