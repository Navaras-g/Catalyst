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
                    className="rounded-2xl border border-white/5 bg-gray-900 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Current Level</p>
                            <p className="text-4xl font-bold text-white">
                                Level{' '}
                                <span className="text-indigo-400">{xpData?.level ?? 1}</span>
                            </p>
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
                            <Trophy size={32} className="text-indigo-400" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                                {xpData?.xp_in_level ?? 0} / 100 XP
                            </span>
                            <span className="text-gray-500">
                                {xpData?.xp_to_next_level ?? 100} XP to Level {(xpData?.level ?? 1) + 1}
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpData?.xp_in_level ?? 0}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-gray-800/50 p-3 text-center">
                            <p className="text-xl font-bold text-white">{xpData?.xp ?? 0}</p>
                            <p className="text-xs text-gray-500">Total XP</p>
                        </div>
                        <div className="rounded-xl bg-gray-800/50 p-3 text-center">
                            <p className="text-xl font-bold text-white">{earned.length}</p>
                            <p className="text-xs text-gray-500">Achievements</p>
                        </div>
                        <div className="rounded-xl bg-gray-800/50 p-3 text-center">
                            <p className="text-xl font-bold text-white">{locked.length}</p>
                            <p className="text-xs text-gray-500">Remaining</p>
                        </div>
                    </div>
                </motion.div>

                {/* Earned */}
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
                                    className="flex items-center gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">
                                        {a.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-white">{a.name}</p>
                                        <p className="text-xs text-gray-400">{a.description}</p>
                                        <div className="mt-1 flex items-center gap-1">
                                            <span className="text-xs font-medium text-indigo-400">
                                                +{a.xp_reward} XP
                                            </span>
                                            {a.earned_at && (
                                                <span className="text-xs text-gray-600">
                                                    · {new Date(a.earned_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked */}
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
                                className="flex items-center gap-4 rounded-2xl border border-white/5 bg-gray-900 p-4 opacity-60"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-2xl grayscale">
                                    {a.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-400">{a.name}</p>
                                        <Lock size={12} className="text-gray-600" />
                                    </div>
                                    <p className="text-xs text-gray-600">{a.description}</p>
                                    <span className="mt-1 text-xs font-medium text-gray-600">
                                        +{a.xp_reward} XP
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}