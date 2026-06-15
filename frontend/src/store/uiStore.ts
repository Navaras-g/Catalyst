import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
    tasksView: 'list' | 'kanban'
    setTasksView: (v: 'list' | 'kanban') => void
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            tasksView: 'list',
            setTasksView: (v) => set({ tasksView: v }),
        }),
        { name: 'catalyst-ui' }
    )
)