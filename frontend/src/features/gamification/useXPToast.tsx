import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import { Zap } from 'lucide-react'

// ─── Toast Store ──────────────────────────────────────────────────────────────
interface XPToast {
    id: number
    amount: number
    label: string
}

interface XPToastStore {
    toasts: XPToast[]
    addToast: (amount: number, label: string) => void
    removeToast: (id: number) => void
}

export const useXPToastStore = create<XPToastStore>((set) => ({
    toasts: [],
    addToast: (amount, label) => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { id, amount, label }] }))
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3000)
    },
    removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ─── Toast UI ─────────────────────────────────────────────────────────────────
export function XPToastContainer() {
    const toasts = useXPToastStore((s) => s.toasts)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="flex items-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-gray-900 px-4 py-3 shadow-xl"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20">
                            <Zap size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                +{toast.amount} XP
                            </p>
                            <p className="text-xs text-gray-500">{toast.label}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// ─── Hook — watches XP and fires toast on change ──────────────────────────────
export function useXPWatcher() {
    const queryClient = useQueryClient()
    const addToast = useXPToastStore((s) => s.addToast)
    const prevXP = useRef<number | null>(null)

    useEffect(() => {
        const interval = setInterval(async () => {
            const data = queryClient.getQueryData<{ xp: number }>(['xp'])
            if (!data) return

            if (prevXP.current !== null && data.xp > prevXP.current) {
                const diff = data.xp - prevXP.current
                addToast(diff, 'Keep it up!')
            }
            prevXP.current = data.xp
        }, 2000)

        return () => clearInterval(interval)
    }, [queryClient, addToast])
}