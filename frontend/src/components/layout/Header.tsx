import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import apiClient from '@/api/client'

interface HeaderProps {
    title: string
    subtitle?: string
}

interface XPData {
    xp: number
    level: number
    xp_in_level: number
    xp_to_next_level: number
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { data: xpData } = useQuery({
        queryKey: ['xp'],
        queryFn: async () => {
            const res = await apiClient.get<XPData>('/auth/xp/')
            return res.data
        },
        refetchInterval: 10000,
    })

    return (
        <header
            className="flex h-16 items-center justify-between px-6"
            style={{
                background: 'rgba(8,15,30,0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(99,179,255,0.06)',
            }}
        >
            {/* Left — title */}
            <div>
                <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-xs" style={{ color: '#3a5070' }}>{subtitle}</p>
                )}
            </div>

            {/* Right — XP */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1.5">
                    <div
                        className="flex items-center gap-2 rounded-full px-3 py-1"
                        style={{
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                        }}
                    >
                        <Zap size={11} style={{ color: '#818cf8' }} />
                        <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>
                            Lv {xpData?.level ?? 1}
                        </span>
                        <span className="text-xs" style={{ color: '#3a5070' }}>·</span>
                        <span className="text-xs" style={{ color: '#6b89b4' }}>
                            {xpData?.xp ?? 0} XP
                        </span>
                    </div>
                    {/* XP progress bar */}
                    <div className="h-0.5 w-24 overflow-hidden rounded-full" style={{ background: 'rgba(99,130,255,0.1)' }}>
                        <motion.div
                            animate={{ width: `${xpData?.xp_in_level ?? 0}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}