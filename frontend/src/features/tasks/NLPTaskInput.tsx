import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X, Calendar, Clock, AlertCircle } from 'lucide-react'
import { taskApi } from './taskApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ParsedTask {
    title: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    due_date: string | null
    estimated_minutes: number | null
}

const PRIORITY_COLORS = {
    low: { bg: 'rgba(55,65,81,0.3)', color: '#9ca3af', border: 'rgba(55,65,81,0.4)' },
    medium: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    high: { bg: 'rgba(249,115,22,0.1)', color: '#fb923c', border: 'rgba(249,115,22,0.2)' },
    urgent: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

const EXAMPLES = [
    'Review project proposal tomorrow high priority',
    'Call dentist next friday',
    'Submit report by end of month urgent',
    'Read book this weekend low priority',
    'Team meeting next monday at 3pm',
]

export default function NLPTaskInput({ onClose, onCreated }: {
    onClose: () => void
    onCreated: () => void
}) {
    const queryClient = useQueryClient()
    const [text, setText] = useState('')
    const [parsed, setParsed] = useState<ParsedTask | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [exampleIndex, setExampleIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const createTask = useMutation({
        mutationFn: taskApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            onCreated()
        },
    })

    const handleParse = async () => {
        if (!text.trim()) return
        setIsParsing(true)
        try {
            const result = await taskApi.parse(text)
            setParsed(result)
        } catch (e) {
            console.error(e)
        } finally {
            setIsParsing(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isParsing) {
            if (!parsed) handleParse()
            else handleCreate()
        }
        if (e.key === 'Escape') onClose()
    }

    const handleCreate = () => {
        if (!parsed) return
        createTask.mutate({
            title: parsed.title,
            priority: parsed.priority,
            due_date: parsed.due_date,
            estimated_minutes: parsed.estimated_minutes,
            status: 'todo',
        })
    }

    const handleExample = (example: string) => {
        setText(example)
        setExampleIndex((i) => (i + 1) % EXAMPLES.length)
        inputRef.current?.focus()
    }

    const p = parsed ? PRIORITY_COLORS[parsed.priority] : null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(2,8,24,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-xl rounded-2xl p-6"
                style={{
                    background: '#0a1628',
                    border: '1px solid rgba(99,130,255,0.15)',
                    boxShadow: '0 0 60px rgba(99,102,241,0.15)',
                }}
            >
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            <Sparkles size={15} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Smart Task Input</h3>
                            <p className="text-xs" style={{ color: '#3a5070' }}>
                                Type naturally — I'll figure out the details
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="rounded-lg p-1.5 transition"
                        style={{ color: '#3a5070' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#6b89b4'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#3a5070'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Input */}
                <div className="relative mb-4">
                    <input
                        ref={inputRef}
                        autoFocus
                        value={text}
                        onChange={(e) => { setText(e.target.value); setParsed(null) }}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. Call dentist next friday high priority"
                        className="w-full rounded-xl py-3.5 pl-4 pr-12 text-sm outline-none transition-all"
                        style={{
                            background: 'rgba(15,31,61,0.8)',
                            border: '1px solid rgba(99,130,255,0.12)',
                            color: '#e8f0fe',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.35)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.12)'}
                    />
                    {isParsing && (
                        <Loader2 size={16} className="absolute right-4 top-3.5 animate-spin"
                            style={{ color: '#6366f1' }}
                        />
                    )}
                </div>

                {/* Example pill */}
                <div className="mb-4">
                    <button
                        onClick={() => handleExample(EXAMPLES[exampleIndex])}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all"
                        style={{
                            background: 'rgba(99,130,255,0.06)',
                            border: '1px solid rgba(99,130,255,0.1)',
                            color: '#3a5070',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#6b89b4'
                            e.currentTarget.style.borderColor = 'rgba(99,130,255,0.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#3a5070'
                            e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'
                        }}
                    >
                        <Sparkles size={11} />
                        Try: "{EXAMPLES[exampleIndex]}"
                    </button>
                </div>

                {/* Parsed result */}
                <AnimatePresence>
                    {parsed && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="mb-4 rounded-xl p-4"
                            style={{
                                background: 'rgba(15,31,61,0.6)',
                                border: '1px solid rgba(99,130,255,0.1)',
                            }}
                        >
                            <p className="mb-3 text-xs font-medium uppercase tracking-wider"
                                style={{ color: '#3a5070' }}
                            >
                                Parsed result
                            </p>

                            {/* Title */}
                            <p className="mb-3 text-sm font-semibold text-white">{parsed.title}</p>

                            <div className="flex flex-wrap gap-2">
                                {/* Priority */}
                                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                                    style={{ background: p!.bg, color: p!.color, border: `1px solid ${p!.border}` }}
                                >
                                    <AlertCircle size={11} />
                                    {parsed.priority}
                                </span>

                                {/* Due date */}
                                {parsed.due_date && (
                                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                                        style={{
                                            background: 'rgba(99,102,241,0.1)',
                                            color: '#818cf8',
                                            border: '1px solid rgba(99,102,241,0.2)',
                                        }}
                                    >
                                        <Calendar size={11} />
                                        {new Date(parsed.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric'
                                        })}
                                    </span>
                                )}

                                {/* Duration */}
                                {parsed.estimated_minutes && (
                                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                                        style={{
                                            background: 'rgba(16,185,129,0.1)',
                                            color: '#34d399',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                        }}
                                    >
                                        <Clock size={11} />
                                        {parsed.estimated_minutes >= 60
                                            ? `${Math.floor(parsed.estimated_minutes / 60)}h ${parsed.estimated_minutes % 60}m`
                                            : `${parsed.estimated_minutes}m`
                                        }
                                    </span>
                                )}
                            </div>

                            {/* Edit hint */}
                            <p className="mt-3 text-xs" style={{ color: '#3a5070' }}>
                                Not right? Edit the text above and press Enter to re-parse.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: '#3a5070' }}>
                        {parsed ? 'Press Enter to create' : 'Press Enter to parse'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm transition"
                            style={{
                                background: 'rgba(15,31,61,0.6)',
                                border: '1px solid rgba(99,130,255,0.08)',
                                color: '#6b89b4',
                            }}
                        >
                            Cancel
                        </button>
                        {!parsed ? (
                            <motion.button
                                onClick={handleParse}
                                disabled={!text.trim() || isParsing}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                                    opacity: !text.trim() || isParsing ? 0.5 : 1,
                                }}
                            >
                                <Sparkles size={14} />
                                Parse
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={handleCreate}
                                disabled={createTask.isPending}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    boxShadow: '0 0 16px rgba(16,185,129,0.3)',
                                    opacity: createTask.isPending ? 0.5 : 1,
                                }}
                            >
                                {createTask.isPending ? 'Creating...' : 'Create Task'}
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}