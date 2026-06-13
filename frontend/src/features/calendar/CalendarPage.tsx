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
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#6b7280',
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
function DayPanel({ date, day, onClose }: {
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
            className="flex w-72 shrink-0 flex-col"
            style={{
                background: 'rgba(10,22,40,0.95)',
                borderLeft: '1px solid rgba(99,179,255,0.08)',
            }}
        >
            <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(99,179,255,0.06)' }}
            >
                <p className="text-sm font-semibold text-white">{formatted}</p>
                <button onClick={onClose} className="rounded-lg p-1.5 transition"
                    style={{ color: '#3a5070' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#6b89b4' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5070' }}
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {day.focus_minutes > 0 && (
                    <div className="rounded-xl p-3"
                        style={{
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.15)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: '#818cf8' }} />
                            <span className="text-sm font-medium" style={{ color: '#818cf8' }}>
                                {formatMinutes(day.focus_minutes)} focused
                            </span>
                        </div>
                    </div>
                )}

                {day.tasks.length > 0 ? (
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: '#3a5070' }}>
                            Tasks ({day.tasks.length})
                        </p>
                        <div className="space-y-2">
                            {day.tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                                    style={{
                                        background: 'rgba(15,31,61,0.6)',
                                        border: '1px solid rgba(99,179,255,0.06)',
                                    }}
                                >
                                    {STATUS_ICONS[task.status]}
                                    <span className={cn('flex-1 truncate text-sm', task.status === 'done' && 'line-through')}
                                        style={{ color: task.status === 'done' ? '#3a5070' : '#e8f0fe' }}
                                    >
                                        {task.title}
                                    </span>
                                    <div className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{
                                            background: PRIORITY_COLORS[task.priority],
                                            boxShadow: `0 0 4px ${PRIORITY_COLORS[task.priority]}80`,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-xs" style={{ color: '#3a5070' }}>Nothing scheduled</p>
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

    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

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
                                        whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                        className="flex flex-col rounded-xl p-2 text-left transition-all"
                                        style={{
                                            background: isSelected
                                                ? 'rgba(99,102,241,0.12)'
                                                : isToday
                                                    ? 'rgba(59,130,246,0.06)'
                                                    : 'rgba(10,22,40,0.6)',
                                            border: isSelected
                                                ? '1px solid rgba(99,102,241,0.35)'
                                                : isToday
                                                    ? '1px solid rgba(59,130,246,0.25)'
                                                    : '1px solid rgba(99,179,255,0.06)',
                                            boxShadow: isSelected ? '0 0 16px rgba(99,102,241,0.15)' : 'none',
                                        }}
                                    >
                                        <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                                            style={{
                                                background: isToday ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                                                color: isToday ? 'white' : '#6b89b4',
                                                boxShadow: isToday ? '0 0 8px rgba(99,102,241,0.4)' : 'none',
                                            }}
                                        >
                                            {dayNum}
                                        </span>

                                        {hasTasks && (
                                            <div className="flex flex-wrap gap-0.5">
                                                {dayData!.tasks.slice(0, 3).map((task) => (
                                                    <div key={task.id} className="h-1.5 w-1.5 rounded-full"
                                                        style={{
                                                            background: PRIORITY_COLORS[task.priority],
                                                            boxShadow: `0 0 4px ${PRIORITY_COLORS[task.priority]}80`,
                                                        }}
                                                    />
                                                ))}
                                                {dayData!.tasks.length > 3 && (
                                                    <span className="text-[10px] leading-none text-gray-500 self-center ml-0.5">
                                                        +{dayData!.tasks.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {hasFocus && (
                                            <div className="mt-auto pt-1 flex items-center gap-1">
                                                <Clock size={9} style={{ color: '#818cf8' }} />
                                                <span className="text-[10px]" style={{ color: '#818cf8' }}>
                                                    {formatMinutes(dayData!.focus_minutes)}
                                                </span>
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
                                <div className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
                                <span className="text-xs capitalize text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day detail panel overlay handler */}
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
                            className="flex w-72 shrink-0 flex-col items-center justify-center border-l"
                            style={{
                                background: 'rgba(10,22,40,0.95)',
                                borderLeft: '1px solid rgba(99,179,255,0.08)',
                            }}
                        >
                            <p className="text-sm" style={{ color: '#3a5070' }}>Nothing scheduled</p>
                            <p className="mt-1 text-xs" style={{ color: '#6b89b4' }}>
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