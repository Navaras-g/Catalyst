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

function ProjectCard({ project, onEdit, onDelete }: {
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
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl p-5"
            style={{
                background: 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(99,179,255,0.08)',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,130,255,0.18)'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(59,130,246,0.1)'
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,179,255,0.08)'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
        >
            {/* Top color accent */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
            />
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-10 blur-2xl"
                style={{ background: project.color }}
            />

            <div className="relative mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0"
                        style={{ background: project.color, boxShadow: `0 0 8px ${project.color}60` }}
                    />
                    <h3 className="font-semibold text-white">{project.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => onEdit(project)}
                        className="rounded-lg p-1.5 transition"
                        style={{ color: '#3a5070' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#6b89b4'; e.currentTarget.style.background = 'rgba(99,130,255,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5070'; e.currentTarget.style.background = 'transparent' }}
                    >
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(project.id)}
                        className="rounded-lg p-1.5 transition"
                        style={{ color: '#3a5070' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5070'; e.currentTarget.style.background = 'transparent' }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {project.description && (
                <p className="mb-4 text-sm line-clamp-2" style={{ color: '#3a5070' }}>{project.description}</p>
            )}

            <div className="mb-3 relative">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span style={{ color: '#3a5070' }}>Progress</span>
                    <span className="font-semibold text-white">{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(99,130,255,0.08)' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}aa)` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#3a5070' }}>
                    {project.completed_task_count}/{project.task_count} tasks
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                        background: s.color === 'text-green-400' ? 'rgba(16,185,129,0.1)' : s.color === 'text-yellow-400' ? 'rgba(234,179,8,0.1)' : 'rgba(107,114,128,0.1)',
                        color: s.color === 'text-green-400' ? '#34d399' : s.color === 'text-yellow-400' ? '#fbbf24' : '#9ca3af',
                        border: `1px solid ${s.color === 'text-green-400' ? 'rgba(16,185,129,0.2)' : s.color === 'text-yellow-400' ? 'rgba(234,179,8,0.2)' : 'rgba(107,114,128,0.2)'}`,
                    }}
                >
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
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