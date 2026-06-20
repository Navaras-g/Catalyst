import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AtSign, ArrowRight, Zap, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
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

/* ─── Field wrapper ─── */
function Field({
    label,
    error,
    icon,
    children,
    compact = false,
}: {
    label: string
    error?: string
    icon?: React.ReactNode
    children: React.ReactNode
    compact?: boolean
}) {
    return (
        <div>
            <label
                className={`mb-1.5 block text-xs font-semibold uppercase tracking-widest ${compact ? '' : 'mb-2'}`}
                style={{ color: '#7a9cc4', letterSpacing: '0.08em' }}
            >
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#4a6a90' }}>
                        {icon}
                    </span>
                )}
                {children}
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#f87171' }}
                >
                    <span>✕</span> {error}
                </motion.p>
            )}
        </div>
    )
}

const inputBase = {
    background: 'rgba(8, 20, 45, 0.85)',
    border: '1px solid rgba(80, 120, 200, 0.15)',
    color: '#e2ecff',
}
const inputCls =
    'w-full rounded-xl py-2.5 text-sm font-medium outline-none transition-all duration-200 placeholder:font-normal'

/* ─── Password strength indicator ─── */
function PasswordStrength({ value }: { value: string }) {
    const checks = [
        value.length >= 8,
        /[A-Z]/.test(value),
        /[0-9]/.test(value),
        /[^A-Za-z0-9]/.test(value),
    ]
    const score = checks.filter(Boolean).length
    const colors = ['#3a5070', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6']
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']

    if (!value) return null
    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {checks.map((ok, i) => (
                    <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < score ? colors[score] : 'rgba(60,100,180,0.15)' }}
                    />
                ))}
            </div>
            <p className="text-xs font-medium" style={{ color: colors[score] }}>
                {labels[score]}
            </p>
        </div>
    )
}

export default function RegisterPage() {
    const navigate = useNavigate()
    const setUser = useAuthStore((s) => s.setUser)
    const [serverError, setServerError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [passwordValue, setPasswordValue] = useState('')

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

    return (
        <div
            className="flex h-screen w-full overflow-hidden"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ══ Left panel ══ */}
            <div
                className="relative hidden lg:flex lg:w-[48%] flex-col items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #020c1e 0%, #071428 60%, #0c1f40 100%)' }}
            >

                <div className="absolute inset-0">
                    <img
                        src="/auth-bg.jpg"
                        alt=""
                        className="h-full w-full object-cover opacity-60"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(135deg, rgba(2,8,24,0.75) 0%, rgba(10,22,40,0.55) 50%, rgba(15,31,61,0.45) 100%)'
                        }}
                    />
                </div>

                {/* Glow orbs */}
                <div
                    className="absolute top-[15%] right-[10%] h-64 w-64 rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute bottom-[15%] left-[10%] h-52 w-52 rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(59,130,246,0.16), transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />

                {/* Diagonal accent */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'linear-gradient(135deg, transparent 58%, rgba(59,130,246,0.04) 58%, rgba(99,102,241,0.07) 100%)',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 px-14 text-center select-none">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-[120px] w-[120px] rounded-full"
                                    style={{
                                        border: '1.5px solid transparent',
                                        borderTopColor: 'rgba(99,130,255,0.55)',
                                        borderRightColor: 'rgba(99,130,255,0.15)',
                                    }}
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-[84px] w-[84px] rounded-full"
                                    style={{
                                        border: '1.5px solid transparent',
                                        borderTopColor: 'rgba(139,92,246,0.45)',
                                        borderLeftColor: 'rgba(139,92,246,0.15)',
                                    }}
                                />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-[120px] w-[120px]"
                                >
                                    <div
                                        className="absolute -top-[3px] left-1/2 -translate-x-1/2 h-[6px] w-[6px] rounded-full"
                                        style={{
                                            background: '#6366f1',
                                            boxShadow: '0 0 10px 2px rgba(99,102,241,0.7)',
                                        }}
                                    />
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                                    className="absolute h-[84px] w-[84px]"
                                >
                                    <div
                                        className="absolute -top-[3px] left-1/2 -translate-x-1/2 h-[5px] w-[5px] rounded-full"
                                        style={{
                                            background: '#a78bfa',
                                            boxShadow: '0 0 8px 2px rgba(167,139,250,0.7)',
                                        }}
                                    />
                                </motion.div>
                                <div
                                    className="relative flex h-[58px] w-[58px] items-center justify-center rounded-2xl"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                                        boxShadow: '0 0 36px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <Zap size={26} className="text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <h1
                            className="mb-3 text-[52px] font-bold tracking-tight"
                            style={{
                                background: 'linear-gradient(135deg, #c7d9ff 0%, #a5b8ff 40%, #8b9dff 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                lineHeight: 1.05,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Catalyst
                        </h1>
                        <p
                            className="mb-2 text-[17px] font-semibold"
                            style={{ color: '#b0c8f0' }}
                        >
                            Begin your productivity journey.
                        </p>
                        <p className="text-[15px] font-normal" style={{ color: '#b0c8f0' }}>
                            Everything you need, in one place.
                        </p>

                        {/* Benefits list */}
                        <div className="mt-10 flex flex-col items-center gap-3">
                            {[
                                'Track tasks, habits & focus sessions',
                                'Visualize your progress over time',
                                'Stay accountable every single day',
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-2.5"
                                >
                                    <CheckCircle2
                                        size={15}
                                        style={{ color: '#4a7cf0', flexShrink: 0 }}
                                    />
                                    <span className="text-[13px] font-medium" style={{ color: '#7a9cc4' }}>
                                        {item}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right edge separator */}
                <div
                    className="absolute right-0 top-0 h-full w-px"
                    style={{
                        background:
                            'linear-gradient(180deg, transparent, rgba(60,100,210,0.3) 40%, rgba(60,100,210,0.3) 60%, transparent)',
                    }}
                />
            </div>

            {/* ══ Right panel ══ */}
            <div
                className="flex w-full lg:w-[52%] flex-col items-center justify-center overflow-y-auto px-8 py-10"
                style={{ background: 'linear-gradient(180deg, #020c1e 0%, #061122 100%)' }}
            >
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[440px]"
                >
                    {/* Mobile logo */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
                        >
                            <Zap size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span
                            className="text-2xl font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #c7d9ff, #8b9dff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Catalyst
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="mb-7">
                        <h2
                            className="text-[32px] font-bold tracking-tight"
                            style={{ color: '#eaf0ff', letterSpacing: '-0.02em' }}
                        >
                            Create account
                        </h2>
                        <p className="mt-2 text-[15px] font-normal" style={{ color: '#5a7aa0' }}>
                            Join and start building better habits
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="rounded-2xl p-[1px]"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(70,120,240,0.35), rgba(99,102,241,0.25), rgba(30,60,120,0.15))',
                        }}
                    >
                        <div
                            className="rounded-2xl p-7"
                            style={{ background: '#070f22' }}
                        >
                            {serverError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="mb-5 rounded-xl px-4 py-3 text-sm font-medium"
                                    style={{
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        color: '#fca5a5',
                                    }}
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
                                        <Field
                                            key={key}
                                            label={label}
                                            error={errors[key as keyof RegisterForm]?.message}
                                            compact
                                        >
                                            <input
                                                {...register(key as any)}
                                                placeholder={placeholder}
                                                className={`${inputCls} px-4`}
                                                style={inputBase}
                                                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,255,0.5)')}
                                                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(80,120,200,0.15)')}
                                            />
                                        </Field>
                                    ))}
                                </div>

                                {/* Email */}
                                <Field label="Email" error={errors.email?.message} icon={<Mail size={15} />}>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="you@example.com"
                                        className={`${inputCls} pl-11 pr-4`}
                                        style={inputBase}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,255,0.5)')}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(80,120,200,0.15)')}
                                    />
                                </Field>

                                {/* Username */}
                                <Field label="Username" error={errors.username?.message} icon={<AtSign size={15} />}>
                                    <input
                                        {...register('username')}
                                        placeholder="johndo3"
                                        className={`${inputCls} pl-11 pr-4`}
                                        style={inputBase}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,255,0.5)')}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(80,120,200,0.15)')}
                                    />
                                </Field>

                                {/* Password fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Field
                                            label="Password"
                                            error={errors.password?.message}
                                            icon={<Lock size={14} />}
                                            compact
                                        >
                                            <input
                                                {...register('password')}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className={`${inputCls} pl-9 pr-9`}
                                                style={inputBase}
                                                onChange={(e) => setPasswordValue(e.target.value)}
                                                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,255,0.5)')}
                                                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(80,120,200,0.15)')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                                style={{ color: showPassword ? '#6b89b4' : '#3a5070' }}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                        </Field>
                                        <PasswordStrength value={passwordValue} />
                                    </div>

                                    <Field
                                        label="Confirm"
                                        error={errors.password_confirm?.message}
                                        icon={<Lock size={14} />}
                                        compact
                                    >
                                        <input
                                            {...register('password_confirm')}
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className={`${inputCls} pl-9 pr-9`}
                                            style={inputBase}
                                            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,255,0.5)')}
                                            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(80,120,200,0.15)')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                            style={{ color: showConfirm ? '#6b89b4' : '#3a5070' }}
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </Field>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white"
                                    style={{
                                        background: isSubmitting
                                            ? 'linear-gradient(135deg, #4a50cc, #2a5fc4)'
                                            : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                                        boxShadow: isSubmitting
                                            ? 'none'
                                            : '0 0 24px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
                                        opacity: isSubmitting ? 0.75 : 1,
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    <span
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: 'linear-gradient(135deg, #818cf8, #60a5fa)' }}
                                    />
                                    <span className="relative">
                                        {isSubmitting ? 'Creating…' : 'Create account'}
                                    </span>
                                    {!isSubmitting && (
                                        <ArrowRight
                                            size={16}
                                            className="relative transition-transform duration-200 group-hover:translate-x-1"
                                        />
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </div>

                    <p className="mt-5 text-center text-[14px]" style={{ color: '#2e4a68' }}>
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-semibold transition-colors hover:text-blue-400"
                            style={{ color: '#5a80b4' }}
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
