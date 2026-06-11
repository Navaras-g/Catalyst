import { useAuthStore } from '@/store/authStore'

interface HeaderProps {
    title: string
    subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
    const user = useAuthStore((s) => s.user)

    return (
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-gray-950/50 px-6 backdrop-blur-sm">
            <div>
                <h1 className="text-lg font-semibold text-white">{title}</h1>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
                {/* XP Badge */}
                <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
                    <span className="text-xs font-semibold text-indigo-400">
                        Level {user?.profile?.level ?? 1}
                    </span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-indigo-300">
                        {user?.profile?.xp ?? 0} XP
                    </span>
                </div>
            </div>
        </header>
    )
}