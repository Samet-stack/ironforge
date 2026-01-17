"use client";

export function GridBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Base dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0b1a] to-[#0a0a14]" />

            {/* Animated grid */}
            <div className="absolute inset-0 bg-grid-animated opacity-30" />

            {/* Radial glow effects */}
            <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[150px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-purple-600/5 blur-[200px]" />

            {/* Noise overlay for texture */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}
