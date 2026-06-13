import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
    Plus, Search, Pin, Trash2,
    FileText, Eye, Edit3, FolderKanban,
    CheckSquare, X,
} from 'lucide-react'
import { noteApi } from './noteApi'
import type { Note } from './noteApi'
import { taskApi } from '@/features/tasks/taskApi'
import { projectApi } from '@/features/projects/projectApi'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({
    note,
    isSelected,
    onClick,
    onDelete,
    onPinToggle,
}: {
    note: Note
    isSelected: boolean
    onClick: () => void
    onDelete: (id: number) => void
    onPinToggle: (id: number, pinned: boolean) => void
}) {
    const preview = note.content.slice(0, 120).replace(/[#*`]/g, '')

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={onClick}
            className={cn(
                'group cursor-pointer rounded-xl border p-4 transition',
                isSelected
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-white/5 bg-gray-900 hover:border-white/10'
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-white">
                    {note.title || 'Untitled'}
                </h3>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPinToggle(note.id, !note.is_pinned) }}
                        className={cn(
                            'rounded-lg p-1 transition hover:bg-white/10',
                            note.is_pinned ? 'text-yellow-400' : 'text-gray-600'
                        )}
                    >
                        <Pin size={12} fill={note.is_pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                        className="rounded-lg p-1 text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {preview && (
                <p className="mt-1 truncate text-xs text-gray-500">{preview}</p>
            )}

            <div className="mt-2 flex items-center gap-2">
                {note.project_title && (
                    <span className="flex items-center gap-1 truncate text-xs text-purple-400">
                        <FolderKanban size={10} />
                        {note.project_title}
                    </span>
                )}
                {note.task_title && (
                    <span className="flex items-center gap-1 truncate text-xs text-blue-400">
                        <CheckSquare size={10} />
                        {note.task_title}
                    </span>
                )}
            </div>

            <p className="mt-2 text-xs text-gray-600">
                {new Date(note.updated_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                })}
            </p>
        </motion.div>
    )
}

// ─── Editor ───────────────────────────────────────────────────────────────────
function NoteEditor({
    note,
    onClose,
}: {
    note: Note | null
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [preview, setPreview] = useState(false)
    const [taskId, setTaskId] = useState<number | null>(null)
    const [projectId, setProjectId] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => taskApi.list(),
    })

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectApi.list,
    })

    useEffect(() => {
        if (note) {
            setTitle(note.title)
            setContent(note.content)
            setTaskId(note.task)
            setProjectId(note.project)
        } else {
            setTitle('')
            setContent('')
            setTaskId(null)
            setProjectId(null)
        }
        setPreview(false)
    }, [note?.id])

    const updateNote = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            noteApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            setSaving(false)
        },
    })

    const saveNote = useCallback(() => {
        if (!note) return
        setSaving(true)
        updateNote.mutate({
            id: note.id,
            data: { title, content, task: taskId, project: projectId },
        })
    }, [note, title, content, taskId, projectId, updateNote])

    useEffect(() => {
        if (!note) return
        const timeout = setTimeout(saveNote, 2000)
        return () => clearTimeout(timeout)
    }, [title, content, taskId, projectId])

    if (!note) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900">
                    <FileText size={28} className="text-gray-700" />
                </div>
                <p className="text-sm font-medium text-gray-400">No note selected</p>
                <p className="mt-1 text-xs text-gray-600">
                    Select a note or create a new one
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPreview(false)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                            !preview ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                        )}
                    >
                        <Edit3 size={13} />
                        Edit
                    </button>
                    <button
                        onClick={() => setPreview(true)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                            preview ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                        )}
                    >
                        <Eye size={13} />
                        Preview
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {saving
                        ? <span className="text-xs text-gray-600">Saving...</span>
                        : <span className="text-xs text-gray-600">Auto-saved</span>
                    }
                    <button
                        onClick={saveNote}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white md:hidden"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Title */}
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title"
                    className="mb-4 w-full bg-transparent text-2xl font-bold text-white placeholder-gray-700 outline-none"
                />

                {/* Link to project/task */}
                <div className="mb-4 flex flex-wrap gap-3">
                    <select
                        value={projectId ?? ''}
                        onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                        className="rounded-lg border border-white/5 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500"
                    >
                        <option value="">No project</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>

                    <select
                        value={taskId ?? ''}
                        onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : null)}
                        className="rounded-lg border border-white/5 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500"
                    >
                        <option value="">No task</option>
                        {tasks.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                </div>

                {/* Content */}
                {preview ? (
                    <div className="space-y-3 text-sm">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="mb-3 text-2xl font-bold text-white">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="mb-2 text-xl font-bold text-white">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="mb-2 text-lg font-semibold text-white">{children}</h3>
                                ),
                                p: ({ children }) => (
                                    <p className="mb-2 leading-relaxed text-gray-300">{children}</p>
                                ),
                                strong: ({ children }) => (
                                    <strong className="font-bold text-white">{children}</strong>
                                ),
                                em: ({ children }) => (
                                    <em className="italic text-gray-300">{children}</em>
                                ),
                                ul: ({ children }) => (
                                    <ul className="mb-2 list-inside list-disc space-y-1 text-gray-300">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="mb-2 list-inside list-decimal space-y-1 text-gray-300">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="text-gray-300">{children}</li>
                                ),
                                code: ({ children }) => (
                                    <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300">
                                        {children}
                                    </code>
                                ),
                                pre: ({ children }) => (
                                    <pre className="mb-2 overflow-x-auto rounded-xl bg-gray-800 p-4 font-mono text-xs text-gray-300">
                                        {children}
                                    </pre>
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="mb-2 border-l-4 border-indigo-500 pl-4 italic text-gray-400">
                                        {children}
                                    </blockquote>
                                ),
                                a: ({ href, children }) => (
                                    <a href={href} className="text-indigo-400 underline hover:text-indigo-300">
                                        {children}
                                    </a>
                                ),
                                hr: () => <hr className="my-4 border-white/10" />,
                            }}
                        >
                            {content || '*Nothing to preview*'}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Write your note in markdown...\n\n# Heading\n**bold** _italic_\n- list item`}
                        className="min-h-96 w-full resize-none bg-transparent font-mono text-sm text-gray-300 placeholder-gray-700 outline-none"
                    />
                )}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes', search],
        queryFn: () => noteApi.list(search ? { search } : undefined),
    })

    const createNote = useMutation({
        mutationFn: () => noteApi.create({ title: 'Untitled', content: '' }),
        onSuccess: (note) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            setSelectedNote(note)
        },
    })

    const deleteNote = useMutation({
        mutationFn: (id: number) => noteApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            if (selectedNote?.id === id) setSelectedNote(null)
        },
    })

    const pinNote = useMutation({
        mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
            noteApi.update(id, { is_pinned: pinned }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
    })

    const pinned = notes.filter((n) => n.is_pinned)
    const unpinned = notes.filter((n) => !n.is_pinned)

    return (
        <div className="flex h-full flex-col">
            <Header title="Notes" subtitle="Your knowledge vault" />

            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <div className="flex w-72 shrink-0 flex-col border-r border-white/5">
                    <div className="flex items-center gap-2 border-b border-white/5 p-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full rounded-xl border border-white/5 bg-gray-800 py-2 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={() => createNote.mutate()}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-xs text-gray-600">No notes yet</p>
                            </div>
                        ) : (
                            <>
                                {pinned.length > 0 && (
                                    <>
                                        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-gray-600">
                                            Pinned
                                        </p>
                                        <AnimatePresence>
                                            {pinned.map((note) => (
                                                <NoteCard
                                                    key={note.id}
                                                    note={note}
                                                    isSelected={selectedNote?.id === note.id}
                                                    onClick={() => setSelectedNote(note)}
                                                    onDelete={(id) => {
                                                        if (confirm('Delete this note?')) deleteNote.mutate(id)
                                                    }}
                                                    onPinToggle={(id, p) => pinNote.mutate({ id, pinned: p })}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        {unpinned.length > 0 && (
                                            <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-gray-600">
                                                All Notes
                                            </p>
                                        )}
                                    </>
                                )}
                                <AnimatePresence>
                                    {unpinned.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isSelected={selectedNote?.id === note.id}
                                            onClick={() => setSelectedNote(note)}
                                            onDelete={(id) => {
                                                if (confirm('Delete this note?')) deleteNote.mutate(id)
                                            }}
                                            onPinToggle={(id, p) => pinNote.mutate({ id, pinned: p })}
                                        />
                                    ))}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex flex-1 flex-col overflow-hidden bg-gray-950">
                    <NoteEditor
                        note={selectedNote}
                        onClose={() => setSelectedNote(null)}
                    />
                </div>

            </div>
        </div>
    )
}