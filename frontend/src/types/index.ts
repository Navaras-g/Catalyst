export interface UserProfile {
    xp: number
    level: number
    settings: Record<string, unknown>
}

export interface User {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    avatar: string | null
    timezone: string
    profile: UserProfile
    created_at: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    username: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
}

export interface ApiError {
    error?: string
    detail?: string
    [field: string]: string | string[] | undefined
}