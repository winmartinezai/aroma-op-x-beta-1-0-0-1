import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface CelebrationEffectProps {
    trigger: boolean;
    onComplete?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ trigger, onComplete }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (trigger && !isActive) {
            setIsActive(true);
            createParticles();

            // Auto-complete after animation
            const timeout = setTimeout(() => {
                setIsActive(false);
                setParticles([]);
                onComplete?.();
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [trigger]);

    const createParticles = () => {
        const colors = ['#fbbf24', '#f59e0b', '#fcd34d', '#a78bfa', '#c084fc', '#60a5fa'];
        const newParticles: Particle[] = [];

        // Create 30 subtle sparkle particles
        for (let i = 0; i < 30; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 2,
                life: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 4
            });
        }

        setParticles(newParticles);
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Subtle background flash */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent animate-pulse" />

            {/* Floating sparkles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-float-sparkle"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        animation: `float-sparkle ${particle.life}s ease-out forwards`,
                        '--vx': `${particle.vx}px`,
                        '--vy': `${particle.vy}px`,
                    } as React.CSSProperties}
                >
                    <Sparkles
                        size={particle.size}
                        className="drop-shadow-lg animate-spin-slow"
                        style={{
                            color: particle.color,
                            filter: `drop-shadow(0 0 ${particle.size}px ${particle.color})`
                        }}
                    />
                </div>
            ))}

            {/* Center success message */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce-in">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-amber-300">
                    <div className="flex items-center gap-3">
                        <Sparkles className="animate-pulse" size={24} />
                        <span className="text-2xl font-bold">Great Work Today!</span>
                        <Sparkles className="animate-pulse" size={24} />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float-sparkle {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--vx), calc(100vh + var(--vy))) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes bounce-in {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                .animate-float-sparkle {
                    animation: float-sparkle 3s ease-out forwards;
                }

                .animate-bounce-in {
                    animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}} />
        </div>
    );
};

export default CelebrationEffect;
