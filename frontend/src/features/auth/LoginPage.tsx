import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from './authApi'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const navigate = useNavigate()
    const setUser = useAuthStore((s) => s.setUser)
    const [serverError, setServerError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

    const onSubmit = async (data: LoginForm) => {
        try {
            setServerError('')
            const res = await authApi.login(data)
            setUser(res.user)
            navigate('/dashboard')
        } catch (err: any) {
            setServerError(
                err.response?.data?.non_field_errors?.[0] ||
                err.response?.data?.error ||
                'Something went wrong.'
            )
        }
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">

            {/* ── Left panel ── */}
            <div
                className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #020818 0%, #0a1628 50%, #0f1f3d 100%)' }}
            >
                {/* Image */}
                <div className="absolute inset-0">
                    <img
                        src="/auth-bg.jpg"
                        alt=""
                        className="h-full w-full object-cover opacity-35"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(135deg, rgba(2,8,24,0.85) 0%, rgba(10,22,40,0.55) 50%, rgba(15,31,61,0.75) 100%)'
                        }}
                    />
                </div>

                {/* Floating orbs */}
                <div className="float-orb absolute top-1/4 left-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', '--float-duration': '10s' } as any}
                />
                <div className="float-orb absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)', '--float-duration': '14s', '--float-delay': '2s' } as any}
                />
                <div className="float-orb absolute top-1/2 right-1/3 h-32 w-32 rounded-full opacity-10 blur-2xl"
                    style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', '--float-duration': '8s', '--float-delay': '4s' } as any}
                />

                {/* Content */}
                <div className="relative z-10 px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {/* Spinner + Logo */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative flex items-center justify-center">
                                {/* Outer slow spin */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-28 w-28 rounded-full"
                                    style={{
                                        border: '1px solid transparent',
                                        borderTopColor: 'rgba(99,130,255,0.6)',
                                        borderRightColor: 'rgba(99,130,255,0.2)',
                                        boxShadow: '0 0 20px rgba(99,102,241,0.15)',
                                    }}
                                />
                                {/* Middle counter-spin */}
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-20 w-20 rounded-full"
                                    style={{
                                        border: '1px solid transparent',
                                        borderTopColor: 'rgba(139,92,246,0.5)',
                                        borderLeftColor: 'rgba(139,92,246,0.2)',
                                    }}
                                />
                                {/* Orbiting dot — outer ring */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-28 w-28"
                                >
                                    <div
                                        className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                                        style={{
                                            background: '#6366f1',
                                            boxShadow: '0 0 8px rgba(99,102,241,0.8), 0 0 16px rgba(99,102,241,0.4)',
                                        }}
                                    />
                                </motion.div>
                                {/* Orbiting dot — middle ring */}
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-20 w-20"
                                >
                                    <div
                                        className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
                                        style={{
                                            background: '#a78bfa',
                                            boxShadow: '0 0 6px rgba(167,139,250,0.8)',
                                        }}
                                    />
                                </motion.div>
                                {/* Center logo */}
                                <div
                                    className="relative flex h-14 w-14 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                        boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                                    }}
                                >
                                    <Zap size={28} className="text-white" />
                                    <div
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <h1 className="gradient-text glow-text mb-4 text-5xl font-bold tracking-tight">
                            Catalyst
                        </h1>
                        <p className="text-lg leading-relaxed" style={{ color: '#6b89b4' }}>
                            Your personal productivity universe.<br />
                            Focus. Build. Achieve.
                        </p>

                        {/* Feature pills */}
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {['Tasks', 'Habits', 'Focus Timer', 'Projects', 'Notes'].map((f, i) => (
                                <motion.span
                                    key={f}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="rounded-full px-3 py-1 text-xs font-medium"
                                    style={{
                                        background: 'rgba(99, 130, 255, 0.1)',
                                        border: '1px solid rgba(99, 130, 255, 0.2)',
                                        color: '#93b4ff',
                                    }}
                                >
                                    {f}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div
                className="flex w-full lg:w-1/2 flex-col items-center justify-center px-8"
                style={{ background: 'linear-gradient(180deg, #020818 0%, #0a1628 100%)' }}
            >
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="gradient-text text-2xl font-bold">Catalyst</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">Welcome back</h2>
                        <p className="mt-2 text-sm" style={{ color: '#6b89b4' }}>
                            Sign in to continue your journey
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="gradient-border rounded-2xl p-px"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3), rgba(59,130,246,0.1))' }}
                    >
                        <div className="rounded-2xl p-8" style={{ background: '#0a1628' }}>

                            {serverError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 rounded-xl px-4 py-3 text-sm"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                                >
                                    {serverError}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium" style={{ color: '#6b89b4' }}>
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-4 top-3.5" style={{ color: '#3a5070' }} />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                                            style={{
                                                background: 'rgba(15,31,61,0.8)',
                                                border: '1px solid rgba(99,130,255,0.1)',
                                                color: '#e8f0fe',
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium" style={{ color: '#6b89b4' }}>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-4 top-3.5" style={{ color: '#3a5070' }} />
                                        <input
                                            {...register('password')}
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                                            style={{
                                                background: 'rgba(15,31,61,0.8)',
                                                border: '1px solid rgba(99,130,255,0.1)',
                                                color: '#e8f0fe',
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.password.message}</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                        boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    <span
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}
                                    />
                                    <span className="relative">
                                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                                    </span>
                                    {!isSubmitting && (
                                        <ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1" />
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-sm" style={{ color: '#3a5070' }}>
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="font-medium transition-colors hover:text-blue-400"
                            style={{ color: '#6b89b4' }}
                        >
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}