import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { habitApi } from './habitApi'
import type { Habit } from './habitApi'
import { cn } from '@/lib/utils'

const habitSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    frequency: z.enum(['daily', 'weekly']),
    color: z.string(),
    icon: z.string(),
})

type HabitForm = z.infer<typeof habitSchema>

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#06b6d4',
]

const ICONS = ['⭐', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '✍️', '🎯', '🎨', '🎵']

interface HabitModalProps {
    open: boolean
    onClose: () => void
    editingHabit: Habit | null
}

export default function HabitModal({ open, onClose, editingHabit }: HabitModalProps) {
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<HabitForm>({
        resolver: zodResolver(habitSchema),
        defaultValues: { frequency: 'daily', color: '#6366f1', icon: '⭐' },
    })

    const selectedColor = watch('color')
    const selectedIcon = watch('icon')

    useEffect(() => {
        if (editingHabit) {
            reset({
                title: editingHabit.title,
                description: editingHabit.description,
                frequency: editingHabit.frequency,
                color: editingHabit.color,
                icon: editingHabit.icon,
            })
        } else {
            reset({ frequency: 'daily', color: '#6366f1', icon: '⭐' })
        }
    }, [editingHabit, reset])

    const createHabit = useMutation({
        mutationFn: habitApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            onClose()
        },
    })

    const updateHabit = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            habitApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            onClose()
        },
    })

    const onSubmit = (data: HabitForm) => {
        if (editingHabit) {
            updateHabit.mutate({ id: editingHabit.id, data })
        } else {
            createHabit.mutate(data)
        }
    }

    const inputClass = 'w-full rounded-xl border border-white/5 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
    const labelClass = 'mb-1.5 block text-xs font-medium text-gray-400'

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">
                                {editingHabit ? 'Edit Habit' : 'New Habit'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className={labelClass}>Title</label>
                                <input
                                    {...register('title')}
                                    placeholder="e.g. Morning run"
                                    className={inputClass}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>Description</label>
                                <input
                                    {...register('description')}
                                    placeholder="Optional note"
                                    className={inputClass}
                                />
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className={labelClass}>Frequency</label>
                                <select {...register('frequency')} className={inputClass}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>

                            {/* Icon picker */}
                            <div>
                                <label className={labelClass}>Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setValue('icon', icon)}
                                            className={cn(
                                                'flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-gray-700',
                                                selectedIcon === icon
                                                    ? 'bg-gray-700 ring-2 ring-indigo-500'
                                                    : 'bg-gray-800'
                                            )}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color picker */}
                            <div>
                                <label className={labelClass}>Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setValue('color', color)}
                                            className={cn(
                                                'h-7 w-7 rounded-full transition hover:scale-110',
                                                selectedColor === color &&
                                                'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-white/5 bg-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createHabit.isPending || updateHabit.isPending}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {editingHabit ? 'Save changes' : 'Create habit'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}