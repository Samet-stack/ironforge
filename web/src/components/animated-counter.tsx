"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function AnimatedCounter({
    value,
    duration = 1500,
    prefix = "",
    suffix = "",
    className = "",
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = performance.now();
        const startValue = displayValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutExpo = 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(startValue + (value - startValue) * easeOutExpo);
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toLocaleString();
    };

    return (
        <span className={className}>
            {prefix}{formatNumber(displayValue)}{suffix}
        </span>
    );
}
