import { RouterProvider } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import type { User } from '@/types'
import { XPToastContainer, useXPWatcher } from '@/features/gamification/useXPToast'
import StarField from '@/components/StarField'

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
      <div className="flex h-screen items-center justify-center" style={{ background: '#020818' }}>
        <StarField />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
            <div className="absolute inset-2 rounded-full bg-blue-500/10" />
          </div>
          <p className="gradient-text text-sm font-medium">Loading Catalyst...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: '#020818' }}>
      <StarField />
      <div className="relative z-10 h-full">
        <XPWatcher />
        <XPToastContainer />
        <RouterProvider router={router} />
      </div>
    </div>
  )
}