import { useQuery } from '@tanstack/react-query'
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
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-gray-950/50 px-6 backdrop-blur-sm">
            <div>
                <h1 className="text-lg font-semibold text-white">{title}</h1>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
                        <span className="text-xs font-semibold text-indigo-400">
                            Level {xpData?.level ?? 1}
                        </span>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-indigo-300">
                            {xpData?.xp ?? 0} XP
                        </span>
                    </div>
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-800">
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${xpData?.xp_in_level ?? 0}%` }}
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}