import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import apiClient from '@/api/client'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

interface Achievement {
    key: string
    name: string
    description: string
    icon: string
    xp_reward: number
    earned: boolean
    earned_at: string | null
}

interface XPData {
    xp: number
    level: number
    xp_in_level: number
    xp_to_next_level: number
}

export default function AchievementsPage() {
    const { data: achievements = [] } = useQuery({
        queryKey: ['achievements'],
        queryFn: async () => {
            const res = await apiClient.get<Achievement[]>('/auth/achievements/')
            return res.data
        },
    })

    const { data: xpData } = useQuery({
        queryKey: ['xp'],
        queryFn: async () => {
            const res = await apiClient.get<XPData>('/auth/xp/')
            return res.data
        },
        refetchInterval: 10000,
    })

    const earned = achievements.filter((a) => a.earned)
    const locked = achievements.filter((a) => !a.earned)

    return (
        <div className="flex h-full flex-col">
            <Header title="Achievements" subtitle="Your progress and milestones" />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* XP Card */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl p-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.06) 100%)',
                        border: '1px solid rgba(99,102,241,0.15)',
                    }}
                >
                    <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
                    />
                    <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-3xl opacity-10"
                        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
                    />

                    <div className="relative flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#3a5070' }}>Current Level</p>
                            <p className="text-5xl font-bold text-white">
                                <span className="gradient-text">{xpData?.level ?? 1}</span>
                            </p>
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.2))',
                                border: '1px solid rgba(99,102,241,0.3)',
                                boxShadow: '0 0 24px rgba(99,102,241,0.2)',
                            }}
                        >
                            <Trophy size={28} style={{ color: '#818cf8' }} />
                        </div>
                    </div>

                    <div className="relative space-y-2">
                        <div className="flex items-center justify-between text-xs" style={{ color: '#3a5070' }}>
                            <span>{xpData?.xp_in_level ?? 0} / 100 XP</span>
                            <span>{xpData?.xp_to_next_level ?? 100} XP to Level {(xpData?.level ?? 1) + 1}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(99,130,255,0.08)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpData?.xp_in_level ?? 0}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                                }}
                            />
                        </div>
                    </div>

                    <div className="relative mt-5 grid grid-cols-3 gap-3">
                        {[
                            { value: xpData?.xp ?? 0, label: 'Total XP' },
                            { value: earned.length, label: 'Unlocked' },
                            { value: locked.length, label: 'Remaining' },
                        ].map(({ value, label }) => (
                            <div key={label} className="rounded-xl p-3 text-center"
                                style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(99,130,255,0.08)' }}
                            >
                                <p className="text-xl font-bold text-white">{value}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#3a5070' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Earned Section */}
                {earned.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Earned ({earned.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {earned.map((a, i) => (
                                <motion.div
                                    key={a.key}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                    className="flex items-center gap-4 rounded-2xl p-4"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                        boxShadow: '0 0 20px rgba(99,102,241,0.05)',
                                    }}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.15))',
                                            border: '1px solid rgba(99,102,241,0.3)',
                                            boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                                        }}
                                    >
                                        {a.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-white">{a.name}</p>
                                        <p className="text-xs" style={{ color: '#6b89b4' }}>{a.description}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs font-medium" style={{ color: '#818cf8' }}>+{a.xp_reward} XP</span>
                                            {a.earned_at && (
                                                <span className="text-xs" style={{ color: '#3a5070' }}>
                                                    · {new Date(a.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked Section */}
                {locked.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Locked ({locked.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {locked.map((a, i) => (
                                <motion.div
                                    key={a.key}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 rounded-2xl p-4"
                                    style={{
                                        background: 'rgba(10,22,40,0.5)',
                                        border: '1px solid rgba(99,179,255,0.05)',
                                        opacity: 0.5,
                                    }}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl grayscale"
                                        style={{ background: 'rgba(15,31,61,0.8)', border: '1px solid rgba(99,130,255,0.08)' }}
                                    >
                                        {a.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold" style={{ color: '#6b89b4' }}>{a.name}</p>
                                            <Lock size={11} style={{ color: '#3a5070' }} />
                                        </div>
                                        <p className="text-xs" style={{ color: '#3a5070' }}>{a.description}</p>
                                        <span className="text-xs mt-0.5 block" style={{ color: '#3a5070' }}>+{a.xp_reward} XP</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}