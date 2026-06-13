import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, ChevronRight,
    CheckCircle2, Circle, AlertCircle,
    Clock, X,
} from 'lucide-react'
import { calendarApi } from './calendarApi'
import type { CalendarDay } from './calendarApi'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-500',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
    done: <CheckCircle2 size={11} className="text-green-400 shrink-0" />,
    in_progress: <AlertCircle size={11} className="text-blue-400 shrink-0" />,
    todo: <Circle size={11} className="text-gray-500 shrink-0" />,
}

function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayPanel({
    date,
    day,
    onClose,
}: {
    date: string
    day: CalendarDay
    onClose: () => void
}) {
    const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex w-72 shrink-0 flex-col border-l border-white/5 bg-gray-900"
        >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-white">{formatted}</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Focus time */}
                {day.focus_minutes > 0 && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-indigo-400" />
                            <span className="text-sm font-medium text-indigo-400">
                                {formatMinutes(day.focus_minutes)} focus time
                            </span>
                        </div>
                    </div>
                )}

                {/* Tasks */}
                {day.tasks.length > 0 ? (
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600">
                            Tasks ({day.tasks.length})
                        </p>
                        <div className="space-y-2">
                            {day.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-2 rounded-xl border border-white/5 bg-gray-800/50 px-3 py-2.5"
                                >
                                    {STATUS_ICONS[task.status]}
                                    <span className={cn(
                                        'flex-1 truncate text-sm',
                                        task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-300'
                                    )}>
                                        {task.title}
                                    </span>
                                    <div className={cn(
                                        'h-1.5 w-1.5 shrink-0 rounded-full',
                                        PRIORITY_COLORS[task.priority]
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-xs text-gray-600">No tasks due</p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['calendar', year, month],
        queryFn: () => calendarApi.get(year, month),
    })

    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
    })

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
        setSelectedDate(null)
    }

    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
        setSelectedDate(null)
    }

    // Build calendar grid
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    // Monday-based offset
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7

    const todayStr = now.toISOString().split('T')[0]

    const selectedDay = selectedDate ? data?.days[selectedDate] : null

    return (
        <div className="flex h-full flex-col">
            <Header title="Calendar" subtitle="Your schedule at a glance" />

            <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden p-6">

                    {/* Month navigation */}
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{monthName}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={prevMonth}
                                className="rounded-xl border border-white/5 bg-gray-900 p-2 text-gray-400 transition hover:text-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    setYear(now.getFullYear())
                                    setMonth(now.getMonth() + 1)
                                    setSelectedDate(null)
                                }}
                                className="rounded-xl border border-white/5 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-400 transition hover:text-white"
                            >
                                Month
                            </button>
                            <button
                                onClick={nextMonth}
                                className="rounded-xl border border-white/5 bg-gray-900 p-2 text-gray-400 transition hover:text-white"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK.map((d) => (
                            <div key={d} className="py-2 text-center text-xs font-medium text-gray-600">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    {isLoading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="grid flex-1 grid-cols-7 gap-1">
                            {Array.from({ length: totalCells }).map((_, i) => {
                                const dayNum = i - startOffset + 1
                                const isValid = dayNum >= 1 && dayNum <= daysInMonth
                                if (!isValid) {
                                    return <div key={i} className="rounded-xl" />
                                }

                                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                                const dayData = data?.days[dateStr]
                                const isToday = dateStr === todayStr
                                const isSelected = dateStr === selectedDate
                                const hasTasks = (dayData?.tasks?.length ?? 0) > 0
                                const hasFocus = (dayData?.focus_minutes ?? 0) > 0

                                return (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                        className={cn(
                                            'flex flex-col rounded-xl border p-2 text-left transition',
                                            isSelected
                                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                                : isToday
                                                    ? 'border-indigo-500/30 bg-indigo-500/5'
                                                    : 'border-white/5 bg-gray-900 hover:border-white/10'
                                        )}
                                    >
                                        {/* Day number */}
                                        <span className={cn(
                                            'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                                            isToday
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-400'
                                        )}>
                                            {dayNum}
                                        </span>

                                        {/* Task dots */}
                                        {hasTasks && (
                                            <div className="flex flex-wrap gap-0.5">
                                                {dayData!.tasks.slice(0, 3).map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className={cn(
                                                            'h-1.5 w-1.5 rounded-full',
                                                            PRIORITY_COLORS[task.priority]
                                                        )}
                                                    />
                                                ))}
                                                {dayData!.tasks.length > 3 && (
                                                    <span className="text-xs text-gray-600">
                                                        +{dayData!.tasks.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Focus bar */}
                                        {hasFocus && (
                                            <div className="mt-auto pt-1">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={9} className="text-indigo-400 shrink-0" />
                                                    <span className="text-xs text-indigo-400">
                                                        {formatMinutes(dayData!.focus_minutes)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-4 flex items-center gap-4">
                        <p className="text-xs text-gray-600">Priority:</p>
                        {Object.entries(PRIORITY_COLORS).map(([label, color]) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={cn('h-2 w-2 rounded-full', color)} />
                                <span className="text-xs capitalize text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day detail panel */}
                <AnimatePresence>
                    {selectedDate && selectedDay && (
                        <DayPanel
                            date={selectedDate}
                            day={selectedDay}
                            onClose={() => setSelectedDate(null)}
                        />
                    )}
                    {selectedDate && !selectedDay && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex w-72 shrink-0 flex-col items-center justify-center border-l border-white/5 bg-gray-900"
                        >
                            <p className="text-sm text-gray-600">Nothing scheduled</p>
                            <p className="mt-1 text-xs text-gray-700">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                                    month: 'long', day: 'numeric'
                                })}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}