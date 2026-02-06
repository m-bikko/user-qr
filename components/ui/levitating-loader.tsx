"use client"

import { cn } from "@/lib/utils"

export function LevitatingLoader({ className, logoUrl }: { className?: string; logoUrl?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh]", className)}>
            <div className="relative">
                {/* Levitating Animation */}
                <div className="animate-float">
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt="Loading..."
                            className="h-24 w-24 object-contain drop-shadow-xl"
                        />
                    ) : (
                        // Default Cube Logo substitute if no URL
                        <div className="h-24 w-24 bg-primary rounded-xl flex items-center justify-center shadow-xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-12 h-12 text-primary-foreground"
                            >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                    )}
                </div>
                {/* Shadow underneath */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/10 rounded-[100%] blur-sm animate-shadow-pulse" />
            </div>
        </div>
    )
}
