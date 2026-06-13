import { RouterProvider } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import type { User } from '@/types'
import { XPToastContainer, useXPWatcher } from '@/features/gamification/useXPToast'

function XPWatcher() {
  useXPWatcher()
  return null
}

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)

  const { isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<User>('/auth/me/')
      setUser(res.data)
      return res.data
    },
    retry: false,
    staleTime: Infinity,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <XPWatcher />
      <XPToastContainer />
      <RouterProvider router={router} />
    </>
  )
}