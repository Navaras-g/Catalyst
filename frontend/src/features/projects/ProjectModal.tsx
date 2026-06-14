import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { projectApi } from './projectApi'
import type { Project } from './projectApi'
import { cn } from '@/lib/utils'

const projectSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    color: z.string(),
    status: z.enum(['active', 'completed', 'on_hold']),
    due_date: z.string().optional().nullable(),
})

type ProjectForm = z.infer<typeof projectSchema>

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#06b6d4',
]

interface ProjectModalProps {
    open: boolean
    onClose: () => void
    editingProject: Project | null
}

export default function ProjectModal({ open, onClose, editingProject }: ProjectModalProps) {
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
        defaultValues: { color: '#6366f1', status: 'active' },
    })

    const selectedColor = watch('color')

    useEffect(() => {
        if (editingProject) {
            reset({
                title: editingProject.title,
                description: editingProject.description,
                color: editingProject.color,
                status: editingProject.status,
                due_date: editingProject.due_date,
            })
        } else {
            reset({ color: '#6366f1', status: 'active' })
        }
    }, [editingProject, reset])

    const createProject = useMutation({
        mutationFn: projectApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            onClose()
        },
    })

    const updateProject = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<ProjectForm> }) =>
            projectApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            onClose()
        },
    })

    const onSubmit = (data: ProjectForm) => {
        const payload = { ...data, due_date: data.due_date || null }
        if (editingProject) {
            updateProject.mutate({ id: editingProject.id, data: payload })
        } else {
            createProject.mutate(payload)
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
                                {editingProject ? 'Edit Project' : 'New Project'}
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
                                    placeholder="Project name"
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
                                    placeholder="What is this project about?"
                                    rows={3}
                                    className={cn(inputClass, 'resize-none')}
                                />
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
                                                selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Status + Due date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select {...register('status')} className={inputClass}>
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Due Date</label>
                                    <input
                                        {...register('due_date')}
                                        type="date"
                                        className={cn(inputClass, 'text-gray-300')}
                                    />
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
                                    disabled={createProject.isPending || updateProject.isPending}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {editingProject ? 'Save changes' : 'Create project'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}