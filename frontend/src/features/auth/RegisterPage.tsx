import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AtSign, ArrowRight, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from './authApi'

const registerSchema = z.object({
    email: z.string().email('Invalid email'),
    username: z.string().min(3, 'At least 3 characters'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    password: z.string().min(8, 'At least 8 characters'),
    password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
})

type RegisterForm = z.infer<typeof registerSchema>

const inputStyle = {
    background: 'rgba(15,31,61,0.8)',
    border: '1px solid rgba(99,130,255,0.1)',
    color: '#e8f0fe',
}

export default function RegisterPage() {
    const navigate = useNavigate()
    const setUser = useAuthStore((s) => s.setUser)
    const [serverError, setServerError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

    const onSubmit = async (data: RegisterForm) => {
        try {
            setServerError('')
            const res = await authApi.register(data)
            setUser(res.user)
            navigate('/dashboard')
        } catch (err: any) {
            setServerError(
                err.response?.data?.email?.[0] ||
                err.response?.data?.username?.[0] ||
                err.response?.data?.error ||
                'Something went wrong.'
            )
        }
    }

    const fields = [
        {
            row: [
                { key: 'first_name', label: 'First name', placeholder: 'John', icon: User, type: 'text' },
                { key: 'last_name', label: 'Last name', placeholder: 'Doe', icon: User, type: 'text' },
            ]
        },
    ]

    return (
        <div className="flex h-screen w-full overflow-hidden">

            {/* Left panel */}
            <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #020818 0%, #0a1628 50%, #0f1f3d 100%)' }}
            >
                <div className="absolute inset-0">
                    <img
                        src="/auth-bg.jpg"
                        alt=""
                        className="h-full w-full object-cover opacity-35"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg, rgba(2,8,24,0.80) 0%, rgba(10,22,40,0.7) 50%, rgba(15,31,61,0.9) 100%)' }}
                    />
                </div>

                <div className="float-orb absolute top-1/4 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)', '--float-duration': '12s' } as any}
                />
                <div className="float-orb absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', '--float-duration': '9s', '--float-delay': '3s' } as any}
                />

                <div className="relative z-10 px-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Replace this in RegisterPage left panel */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative flex items-center justify-center">
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
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-28 w-28"
                                >
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                                        style={{
                                            background: '#6366f1',
                                            boxShadow: '0 0 8px rgba(99,102,241,0.8), 0 0 16px rgba(99,102,241,0.4)',
                                        }}
                                    />
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-20 w-20"
                                >
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
                                        style={{
                                            background: '#a78bfa',
                                            boxShadow: '0 0 6px rgba(167,139,250,0.8)',
                                        }}
                                    />
                                </motion.div>
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                                        boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                                    }}
                                >
                                    <Zap size={28} className="text-white" />
                                    <div className="absolute inset-0 rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <h1 className="gradient-text glow-text mb-4 text-5xl font-bold">Catalyst</h1>
                        <p className="text-lg leading-relaxed" style={{ color: '#6b89b4' }}>
                            Begin your productivity journey.<br />
                            Everything you need, in one place.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center overflow-y-auto px-8 py-8"
                style={{ background: 'linear-gradient(180deg, #020818 0%, #0a1628 100%)' }}
            >
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="gradient-text text-2xl font-bold">Catalyst</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">Create account</h2>
                        <p className="mt-2 text-sm" style={{ color: '#6b89b4' }}>
                            Join and start building better habits
                        </p>
                    </div>

                    <div className="gradient-border rounded-2xl p-px">
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

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                                {/* Name row */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'first_name', label: 'First name', placeholder: 'John' },
                                        { key: 'last_name', label: 'Last name', placeholder: 'Doe' },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key}>
                                            <label className="mb-1.5 block text-xs font-medium" style={{ color: '#6b89b4' }}>{label}</label>
                                            <input
                                                {...register(key as any)}
                                                placeholder={placeholder}
                                                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                                style={inputStyle}
                                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#6b89b4' }}>Email</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-4 top-3" style={{ color: '#3a5070' }} />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                                            style={inputStyle}
                                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.email.message}</p>}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#6b89b4' }}>Username</label>
                                    <div className="relative">
                                        <AtSign size={15} className="absolute left-4 top-3" style={{ color: '#3a5070' }} />
                                        <input
                                            {...register('username')}
                                            placeholder="johndo3"
                                            className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                                            style={inputStyle}
                                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                        />
                                    </div>
                                    {errors.username && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.username.message}</p>}
                                </div>

                                {/* Passwords */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'password', label: 'Password', placeholder: '••••••••' },
                                        { key: 'password_confirm', label: 'Confirm', placeholder: '••••••••' },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key}>
                                            <label className="mb-1.5 block text-xs font-medium" style={{ color: '#6b89b4' }}>{label}</label>
                                            <div className="relative">
                                                <Lock size={15} className="absolute left-3 top-3" style={{ color: '#3a5070' }} />
                                                <input
                                                    {...register(key as any)}
                                                    type="password"
                                                    placeholder={placeholder}
                                                    className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition-all"
                                                    style={inputStyle}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.4)'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(99,130,255,0.1)'}
                                                />
                                            </div>
                                            {errors[key as keyof RegisterForm] && (
                                                <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                                                    {errors[key as keyof RegisterForm]?.message}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                        boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}
                                    />
                                    <span className="relative">{isSubmitting ? 'Creating...' : 'Create account'}</span>
                                    {!isSubmitting && (
                                        <ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1" />
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-sm" style={{ color: '#3a5070' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium transition-colors hover:text-blue-400" style={{ color: '#6b89b4' }}>
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}