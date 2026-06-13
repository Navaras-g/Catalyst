import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Flame, Trophy, TrendingUp,
    Pencil, Trash2, CheckCircle2, Circle,
} from 'lucide-react'
import { habitApi } from './habitApi'
import type { Habit } from './habitApi'
import Header from '@/components/layout/Header'
import HabitModal from './HabitModal'
import { cn } from '@/lib/utils'

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function HabitHeatmap({ habit }: { habit: Habit }) {
    const today = new Date()
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - (29 - i))
        return d.toISOString().split('T')[0]
    })

    const logMap = new Set(
        habit.logs.filter((l) => l.completed).map((l) => l.date)
    )

    return (
        <div className="flex gap-0.5 flex-wrap">
            {days.map((date) => {
                const done = logMap.has(date)
                const isToday = date === today.toISOString().split('T')[0]
                return (
                    <div
                        key={date}
                        title={date}
                        className={cn(
                            'h-3 w-3 rounded-sm transition',
                            done ? 'opacity-100' : 'bg-gray-800 opacity-100',
                            isToday && !done && 'ring-1 ring-gray-600'
                        )}
                        style={done ? { backgroundColor: habit.color } : undefined}
                    />
                )
            })}
        </div>
    )
}

// ─── Habit Card ───────────────────────────────────────────────────────────────
function HabitCard({
    habit,
    onLog,
    onEdit,
    onDelete,
}: {
    habit: Habit
    onLog: (id: number) => void
    onEdit: (h: Habit) => void
    onDelete: (id: number) => void
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="group rounded-2xl border border-white/5 bg-gray-900 p-5 transition hover:border-white/10"
        >
            {/* Top row */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                        style={{ backgroundColor: habit.color + '20' }}
                    >
                        {habit.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{habit.title}</h3>
                        {habit.description && (
                            <p className="text-xs text-gray-500">{habit.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Check off button */}
                    <button
                        onClick={() => onLog(habit.id)}
                        className={cn(
                            'rounded-xl p-2 transition',
                            habit.completed_today
                                ? 'text-green-400 hover:bg-green-500/10'
                                : 'text-gray-600 hover:bg-white/5 hover:text-white'
                        )}
                    >
                        {habit.completed_today
                            ? <CheckCircle2 size={22} />
                            : <Circle size={22} />
                        }
                    </button>

                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                            onClick={() => onEdit(habit)}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={() => onDelete(habit.id)}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-800/50 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-400">
                        <Flame size={13} />
                        <span className="text-sm font-bold">{habit.current_streak}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Streak</p>
                </div>
                <div className="rounded-xl bg-gray-800/50 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-400">
                        <Trophy size={13} />
                        <span className="text-sm font-bold">{habit.longest_streak}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Best</p>
                </div>
                <div className="rounded-xl bg-gray-800/50 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-indigo-400">
                        <TrendingUp size={13} />
                        <span className="text-sm font-bold">{habit.completion_rate}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Rate</p>
                </div>
            </div>

            {/* Heatmap */}
            <HabitHeatmap habit={habit} />
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HabitsPage() {
    const queryClient = useQueryClient()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

    const { data: habits = [], isLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: habitApi.list,
    })

    const logHabit = useMutation({
        mutationFn: (id: number) => habitApi.log(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })

    const deleteHabit = useMutation({
        mutationFn: (id: number) => habitApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit)
        setModalOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm('Archive this habit?')) deleteHabit.mutate(id)
    }

    const completedToday = habits.filter((h) => h.completed_today).length

    return (
        <div className="flex h-full flex-col">
            <Header title="Habits" subtitle="Build consistency" />

            <div className="flex-1 overflow-y-auto p-6">

                {/* Summary bar */}
                {habits.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl border border-white/5 bg-gray-900 p-4"
                    >
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-400">Today's progress</span>
                            <span className="font-semibold text-white">
                                {completedToday} / {habits.length}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${habits.length ? (completedToday / habits.length) * 100 : 0}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full rounded-full bg-indigo-500"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Toolbar */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {habits.length} active habit{habits.length !== 1 ? 's' : ''}
                    </p>
                    <button
                        onClick={() => { setEditingHabit(null); setModalOpen(true) }}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                        <Plus size={16} />
                        New Habit
                    </button>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    </div>
                ) : habits.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center"
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900">
                            <Flame size={28} className="text-gray-700" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No habits yet</p>
                        <p className="mt-1 text-xs text-gray-600">
                            Click "New Habit" to start building consistency
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence>
                            {habits.map((habit) => (
                                <HabitCard
                                    key={habit.id}
                                    habit={habit}
                                    onLog={(id) => logHabit.mutate(id)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <HabitModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingHabit(null) }}
                editingHabit={editingHabit}
            />
        </div>
    )
}