import { useMemo, useEffect, useState } from 'react'

interface Star {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    minOpacity: number
    maxOpacity: number
}

interface ShootingStar {
    id: number
    startX: number
    startY: number
    angle: number
    duration: number
    delay: number
}

function useShootingStars() {
    const [stars, setStars] = useState<ShootingStar[]>([])

    useEffect(() => {
        const spawn = () => {
            const id = Date.now()
            setStars((prev) => [
                ...prev.slice(-3),
                {
                    id,
                    startX: Math.random() * 70 + 10,
                    startY: Math.random() * 40,
                    angle: Math.random() * 20 + 20,
                    duration: Math.random() * 1.5 + 0.8,
                    delay: 0,
                },
            ])
            setTimeout(() => {
                setStars((prev) => prev.filter((s) => s.id !== id))
            }, 3000)
        }

        const interval = setInterval(spawn, Math.random() * 4000 + 4000)
        spawn()
        return () => clearInterval(interval)
    }, [])

    return stars
}

export default function StarField() {
    const stars = useMemo<Star[]>(() => {
        return Array.from({ length: 150 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            duration: Math.random() * 5 + 2,
            delay: Math.random() * 6,
            minOpacity: Math.random() * 0.15 + 0.05,
            maxOpacity: Math.random() * 0.6 + 0.3,
        }))
    }, [])

    const shootingStars = useShootingStars()

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
        }}>
            {/* Aurora glow blobs */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)',
                animation: 'auroraFloat1 20s ease-in-out infinite',
                filter: 'blur(40px)',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '50%',
                height: '50%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)',
                animation: 'auroraFloat2 25s ease-in-out infinite',
                filter: 'blur(50px)',
            }} />
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '30%',
                width: '40%',
                height: '40%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)',
                animation: 'auroraFloat3 18s ease-in-out infinite',
                filter: 'blur(60px)',
            }} />

            {/* Static stars */}
            {stars.map((star) => (
                <div
                    key={star.id}
                    style={{
                        position: 'absolute',
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        borderRadius: '50%',
                        background: star.size > 1.5
                            ? `radial-gradient(circle, rgba(180,210,255,${star.maxOpacity}), rgba(140,180,255,${star.minOpacity}))`
                            : `white`,
                        boxShadow: star.size > 1.5
                            ? `0 0 ${star.size * 3}px rgba(140,180,255,0.4)`
                            : 'none',
                        animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Shooting stars */}
            {shootingStars.map((s) => (
                <div
                    key={s.id}
                    style={{
                        position: 'absolute',
                        left: `${s.startX}%`,
                        top: `${s.startY}%`,
                        width: '120px',
                        height: '1px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(140,180,255,0.4), transparent)',
                        transform: `rotate(${s.angle}deg)`,
                        transformOrigin: 'left center',
                        animation: `shootingStar ${s.duration}s ease-out forwards`,
                        borderRadius: '999px',
                    } as React.CSSProperties}
                />
            ))}

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        @keyframes shootingStar {
          0% { opacity: 0; transform: rotate(var(--angle)) translateX(0); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--angle)) translateX(300px); }
        }
        @keyframes auroraFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 8%) scale(1.1); }
          66% { transform: translate(-3%, 4%) scale(0.95); }
        }
        @keyframes auroraFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-6%, -5%) scale(1.05); }
          66% { transform: translate(4%, -8%) scale(1.1); }
        }
        @keyframes auroraFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, -6%) scale(1.15); }
        }
      `}</style>
        </div>
    )
}