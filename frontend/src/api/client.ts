import axios from 'axios'

const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

let isRefreshing = false
let failedQueue: Array<{
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else prom.resolve(undefined)
    })
    failedQueue = []
}

const skipRefreshUrls = ['/auth/token/refresh/', '/auth/login/', '/auth/register/']

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const isSkipped = skipRefreshUrls.some((url) =>
            originalRequest.url?.includes(url)
        )

        if (error.response?.status === 401 && !originalRequest._retry && !isSkipped) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then(() => apiClient(originalRequest))
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                await apiClient.post('/auth/token/refresh/')
                processQueue(null)
                return apiClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError)
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient