import apiClient from '@/api/client'
import type { User, LoginPayload, RegisterPayload } from '@/types'

export const authApi = {
    register: async (data: RegisterPayload) => {
        const res = await apiClient.post<{ user: User }>('/auth/register/', data)
        return res.data
    },

    login: async (data: LoginPayload) => {
        const res = await apiClient.post<{ user: User }>('/auth/login/', data)
        return res.data
    },

    logout: async () => {
        await apiClient.post('/auth/logout/')
    },

    me: async () => {
        const res = await apiClient.get<User>('/auth/me/')
        return res.data
    },
}