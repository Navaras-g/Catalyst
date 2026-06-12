import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Trash2, Pencil, CheckCircle2,
    Clock, FolderKanban, Circle,
} from 'lucide-react'
import { projectApi } from './projectApi'
import type { Project, ProjectStatus } from './projectApi'
import Header from '@/components/layout/Header'
import ProjectModal from './ProjectModal'
import { cn } from '@/lib/utils'

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/10' },
    on_hold: { label: 'On Hold', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    completed: { label: 'Completed', color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

function ProjectCard({
    project,
    onEdit,
    onDelete,
}: {
    project: Project
    onEdit: (p: Project) => void
    onDelete: (id: number) => void
}) {
    const s = statusConfig[project.status]

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
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-white">{project.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(project)}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(project.id)}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Description */}
            {project.description && (
                <p className="mb-4 text-sm text-gray-500 line-clamp-2">{project.description}</p>
            )}

            {/* Progress bar */}
            <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-white">{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: project.color }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {project.completed_task_count}/{project.task_count} tasks
                    </span>
                    {project.due_date && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(project.due_date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric'
                            })}
                        </span>
                    )}
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', s.bg, s.color)}>
                    {s.label}
                </span>
            </div>
        </motion.div>
    )
}

export default function ProjectsPage() {
    const queryClient = useQueryClient()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [filterStatus, setFilterStatus] = useState<'all' | ProjectStatus>('all')

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectApi.list,
    })

    const deleteProject = useMutation({
        mutationFn: (id: number) => projectApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    })

    const handleEdit = (project: Project) => {
        setEditingProject(project)
        setModalOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm('Delete this project? Tasks will not be deleted.')) {
            deleteProject.mutate(id)
        }
    }

    const filtered = projects.filter((p) =>
        filterStatus === 'all' ? true : p.status === filterStatus
    )

    return (
        <div className="flex h-full flex-col">
            <Header title="Projects" subtitle="Track your work" />

            <div className="flex-1 overflow-y-auto p-6">

                {/* Toolbar */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-gray-900 p-1">
                        {(['all', 'active', 'on_hold', 'completed'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                                    filterStatus === s
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                )}
                            >
                                {s === 'all' ? 'All' : s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { setEditingProject(null); setModalOpen(true) }}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center"
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900">
                            <FolderKanban size={28} className="text-gray-700" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No projects yet</p>
                        <p className="mt-1 text-xs text-gray-600">
                            Click "New Project" to get started
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence>
                            {filtered.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <ProjectModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingProject(null) }}
                editingProject={editingProject}
            />
        </div>
    )
}