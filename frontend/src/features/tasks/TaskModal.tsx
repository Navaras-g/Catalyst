import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { taskApi } from './taskApi'
import type { Task } from './taskApi'
import { projectApi } from '@/features/projects/projectApi'
import { cn } from '@/lib/utils'

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    status: z.enum(['todo', 'in_progress', 'done']),
    due_date: z.string().optional(),
    estimated_minutes: z.number().nullable().optional(),
    category: z.number().nullable().optional(),
    project: z.number().nullable().optional(),
})

type TaskForm = z.infer<typeof taskSchema>

interface TaskModalProps {
    open: boolean
    onClose: () => void
    editingTask: Task | null
}

export default function TaskModal({ open, onClose, editingTask }: TaskModalProps) {
    const queryClient = useQueryClient()

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: taskApi.getCategories,
    })

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectApi.list,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TaskForm>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            due_date: '',
            estimated_minutes: null,
            category: null,
            project: null,
        },
    })

    useEffect(() => {
        if (editingTask) {
            reset({
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                status: editingTask.status,
                due_date: editingTask.due_date || '',
                estimated_minutes: editingTask.estimated_minutes,
                category: editingTask.category ?? null,
                project: editingTask.project ?? null,
            })
        } else {
            reset({
                title: '',
                description: '',
                priority: 'medium',
                status: 'todo',
                due_date: '',
                estimated_minutes: null,
                category: null,
                project: null,
            })
        }
    }, [editingTask, reset])

    const createTask = useMutation({
        mutationFn: taskApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['xp'] })
            queryClient.invalidateQueries({ queryKey: ['achievements'] })
            onClose()
        },
    })

    const updateTask = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            taskApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['xp'] })
            queryClient.invalidateQueries({ queryKey: ['achievements'] })
            onClose()
        },
    })

    const onSubmit = (data: TaskForm) => {
        const payload = {
            ...data,
            due_date: data.due_date || null,
        }
        if (editingTask) {
            updateTask.mutate({ id: editingTask.id, data: payload })
        } else {
            createTask.mutate(payload)
        }
    }

    const inputClass = 'w-full rounded-xl border border-white/5 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
    const labelClass = 'mb-1.5 block text-xs font-medium text-gray-400'

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">
                                {editingTask ? 'Edit Task' : 'New Task'}
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
                                    placeholder="What needs to be done?"
                                    className={inputClass}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>Description</label>
                                <textarea
                                    {...register('description')}
                                    placeholder="Add details..."
                                    rows={3}
                                    className={cn(inputClass, 'resize-none')}
                                />
                            </div>

                            {/* Priority + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Priority</label>
                                    <select {...register('priority')} className={inputClass}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select {...register('status')} className={inputClass}>
                                        <option value="todo">Todo</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </div>

                            {/* Due date + Estimated time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Due Date</label>
                                    <input
                                        {...register('due_date')}
                                        type="date"
                                        className={cn(inputClass, 'text-gray-300')}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Estimated (minutes)</label>
                                    <input
                                        {...register('estimated_minutes', {
                                            setValueAs: (v) =>
                                                v === '' || v === null || v === undefined ? null : Number(v),
                                        })}
                                        type="number"
                                        placeholder="e.g. 30"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Category + Project */}
                            <div className="grid grid-cols-2 gap-4">
                                {categories.length > 0 && (
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select
                                            {...register('category', {
                                                setValueAs: (v) => (v === '' ? null : Number(v)),
                                            })}
                                            className={inputClass}
                                        >
                                            <option value="">No category</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {projects.length > 0 && (
                                    <div>
                                        <label className={labelClass}>Project</label>
                                        <select
                                            {...register('project', {
                                                setValueAs: (v) => (v === '' ? null : Number(v)),
                                            })}
                                            className={inputClass}
                                        >
                                            <option value="">No project</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
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
                                    disabled={isSubmitting || createTask.isPending || updateTask.isPending}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {editingTask ? 'Save changes' : 'Create task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}