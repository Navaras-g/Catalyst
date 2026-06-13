import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Star, Calendar, Clock, Tag,
    LayoutList, Columns, Trash2, CheckCircle2,
    Circle, AlertCircle, ChevronDown,
} from 'lucide-react'
import { taskApi } from './taskApi'
import type { Task, Priority, TaskStatus } from './taskApi'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import TaskModal from './TaskModal.tsx'

// ─── Priority config ──────────────────────────────────────────────────────────
const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
    low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10' },
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode }> = {
    todo: { label: 'Todo', icon: <Circle size={16} className="text-gray-500" /> },
    in_progress: { label: 'In Progress', icon: <AlertCircle size={16} className="text-blue-400" /> },
    done: { label: 'Done', icon: <CheckCircle2 size={16} className="text-green-400" /> },
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
    task,
    onEdit,
    onDelete,
    onStatusChange,
    onStarToggle,
}: {
    task: Task
    onEdit: (task: Task) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: TaskStatus) => void
    onStarToggle: (id: number, starred: boolean) => void
}) {
    const p = priorityConfig[task.priority]
    const completedSubs = task.subtasks.filter((s) => s.is_completed).length

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className={cn('group relative overflow-hidden rounded-2xl p-4 transition-all cursor-pointer')}
            style={{
                background: task.status === 'done' ? 'rgba(10,22,40,0.4)' : 'rgba(10,22,40,0.8)',
                border: '1px solid rgba(99,179,255,0.08)',
                opacity: task.status === 'done' ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,130,255,0.18)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(59,130,246,0.08)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,179,255,0.08)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            {/* Priority accent */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
                style={{ background: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : task.priority === 'medium' ? '#3b82f6' : '#374151' }}
            />

            <div className="flex items-start gap-3 pl-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(
                            task.id,
                            task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
                        )
                    }}
                    className="mt-0.5 shrink-0 transition hover:scale-110"
                >
                    {statusConfig[task.status].icon}
                </button>

                <div className="min-w-0 flex-1" onClick={() => onEdit(task)}>
                    <p className={cn(
                        'text-sm font-medium',
                        task.status === 'done' ? 'line-through' : 'text-white'
                    )}
                        style={{ color: task.status === 'done' ? '#3a5070' : '#e8f0fe' }}
                    >
                        {task.title}
                    </p>

                    {task.description && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: '#3a5070' }}>{task.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                                background: task.priority === 'urgent' ? 'rgba(239,68,68,0.1)' : task.priority === 'high' ? 'rgba(249,115,22,0.1)' : task.priority === 'medium' ? 'rgba(59,130,246,0.1)' : 'rgba(55,65,81,0.3)',
                                color: task.priority === 'urgent' ? '#f87171' : task.priority === 'high' ? '#fb923c' : task.priority === 'medium' ? '#60a5fa' : '#6b7280',
                                border: `1px solid ${task.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : task.priority === 'high' ? 'rgba(249,115,22,0.2)' : task.priority === 'medium' ? 'rgba(59,130,246,0.2)' : 'rgba(55,65,81,0.3)'}`,
                            }}
                        >
                            {p.label}
                        </span>

                        {task.category_detail && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                    background: task.category_detail.color + '18',
                                    color: task.category_detail.color,
                                    border: `1px solid ${task.category_detail.color}30`,
                                }}
                            >
                                {task.category_detail.name}
                            </span>
                        )}

                        {task.due_date && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: '#3a5070' }}>
                                <Calendar size={11} />
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}

                        {task.estimated_minutes && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: '#3a5070' }}>
                                <Clock size={11} />
                                {task.estimated_minutes}m
                            </span>
                        )}

                        {task.tags.length > 0 && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: '#3a5070' }}>
                                <Tag size={11} />
                                {task.tags.map((t) => t.name).join(', ')}
                            </span>
                        )}

                        {task.subtasks.length > 0 && (
                            <span className="text-xs" style={{ color: '#3a5070' }}>
                                {completedSubs}/{task.subtasks.length} done
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onStarToggle(task.id, !task.is_starred)
                        }}
                        className="rounded-lg p-1.5 transition hover:bg-white/5"
                        style={{ color: task.is_starred ? '#fbbf24' : '#3a5070' }}
                    >
                        <Star size={14} fill={task.is_starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(task.id)
                        }}
                        className="rounded-lg p-1.5 transition"
                        style={{ color: '#3a5070' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#f87171'
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#3a5070'
                            e.currentTarget.style.background = 'transparent'
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
    title,
    status,
    tasks,
    onEdit,
    onDelete,
    onStatusChange,
    onStarToggle,
    color,
}: {
    title: string
    status: TaskStatus
    tasks: Task[]
    onEdit: (task: Task) => void
    onDelete: (id: number) => void
    onStatusChange: (id: number, status: TaskStatus) => void
    onStarToggle: (id: number, starred: boolean) => void
    color: string
}) {
    return (
        <div className="flex flex-col rounded-2xl border border-white/5 bg-gray-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                    {tasks.length}
                </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
                <AnimatePresence>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            onStarToggle={onStarToggle}
                        />
                    ))}
                </AnimatePresence>
                {tasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-600">
                        No tasks here
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'kanban'
type FilterStatus = 'all' | TaskStatus

export default function TasksPage() {
    const queryClient = useQueryClient()
    const [view, setView] = useState<ViewMode>('list')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [filterPriority, setFilterPriority] = useState<string>('all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => taskApi.list(),
    })

    const updateTask = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            taskApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['xp'] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
        },
    })

    const deleteTask = useMutation({
        mutationFn: (id: number) => taskApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['xp'] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
        },
    })

    const handleEdit = (task: Task) => {
        setEditingTask(task)
        setModalOpen(true)
    }

    const handleNewTask = () => {
        setEditingTask(null)
        setModalOpen(true)
    }

    const handleStatusChange = (id: number, status: TaskStatus) => {
        updateTask.mutate({ id, data: { status } })
    }

    const handleStarToggle = (id: number, is_starred: boolean) => {
        updateTask.mutate({ id, data: { is_starred } })
    }

    const handleDelete = (id: number) => {
        if (confirm('Delete this task?')) deleteTask.mutate(id)
    }

    // Filter
    const filtered = tasks.filter((t) => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false
        return true
    })

    const kanbanColumns: { title: string; status: TaskStatus; color: string }[] = [
        { title: 'Todo', status: 'todo', color: 'bg-gray-500' },
        { title: 'In Progress', status: 'in_progress', color: 'bg-blue-500' },
        { title: 'Done', status: 'done', color: 'bg-green-500' },
    ]

    return (
        <div className="flex h-full flex-col">
            <Header title="Tasks" subtitle="Manage your work" />

            <div className="flex-1 overflow-y-auto p-6">

                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-xl p-1"
                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                        >
                            {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                    style={{
                                        background: filterStatus === s ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                                        color: filterStatus === s ? 'white' : '#3a5070',
                                        boxShadow: filterStatus === s ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                                    }}
                                >
                                    {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="rounded-xl py-2 pl-3 pr-8 text-xs outline-none appearance-none cursor-pointer"
                                style={{
                                    background: 'rgba(10,22,40,0.8)',
                                    border: '1px solid rgba(99,179,255,0.08)',
                                    color: '#6b89b4',
                                }}
                            >
                                <option value="all">All priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-2.5 text-gray-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-xl p-1"
                            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(99,179,255,0.08)' }}
                        >
                            {[{ v: 'list', Icon: LayoutList }, { v: 'kanban', Icon: Columns }].map(({ v, Icon }) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v as ViewMode)}
                                    className="rounded-lg p-1.5 transition-all"
                                    style={{
                                        background: view === v ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                                        color: view === v ? 'white' : '#3a5070',
                                    }}
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </div>

                        <motion.button
                            onClick={handleNewTask}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                            }}
                        >
                            <Plus size={16} />
                            New Task
                        </motion.button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                    </div>
                ) : view === 'list' ? (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {filtered.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-20 text-center"
                                >
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900">
                                        <CheckCircle2 size={28} className="text-gray-700" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">No tasks yet</p>
                                    <p className="mt-1 text-xs text-gray-600">
                                        Click "New Task" to create your first one
                                    </p>
                                </motion.div>
                            ) : (
                                filtered.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onStarToggle={handleStarToggle}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {kanbanColumns.map((col) => (
                            <KanbanColumn
                                key={col.status}
                                title={col.title}
                                status={col.status}
                                color={col.color}
                                tasks={filtered.filter((t) => t.status === col.status)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                                onStarToggle={handleStarToggle}
                            />
                        ))}
                    </div>
                )}
            </div>

            <TaskModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingTask(null) }}
                editingTask={editingTask}
            />
        </div>
    )
}