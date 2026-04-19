"use client"

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void
  onPauseToggle: () => void
  gameOver: boolean
  lifeLost: boolean
  paused: boolean
}

export function MobileControls({ onDirectionChange, onPauseToggle, gameOver, lifeLost, paused }: MobileControlsProps) {
  const handleButtonPress = (direction: Direction) => {
    onDirectionChange(direction)
  }

  return (
    <div className="md:hidden w-full max-w-sm">
      <div className="bg-[#1e272e] rounded-3xl p-6 border-4 border-[#34495e] shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          {/* Up button */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault()
              handleButtonPress("UP")
            }}
            onClick={() => handleButtonPress("UP")}
            className="w-20 h-20 bg-[#34495e] hover:bg-[#43523d] active:bg-[#9acd32] rounded-xl border-4 border-[#2d3a2d] flex items-center justify-center transition-colors touch-none select-none shadow-lg active:shadow-inner"
            aria-label="Move up"
          >
            <ChevronUp className="w-10 h-10 text-[#9acd32]" strokeWidth={3} />
          </button>

          {/* Middle row: Left, Pause/Play, Right */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault()
                handleButtonPress("LEFT")
              }}
              onClick={() => handleButtonPress("LEFT")}
              className="w-20 h-20 bg-[#34495e] hover:bg-[#43523d] active:bg-[#9acd32] rounded-xl border-4 border-[#2d3a2d] flex items-center justify-center transition-colors touch-none select-none shadow-lg active:shadow-inner"
              aria-label="Move left"
            >
              <ChevronLeft className="w-10 h-10 text-[#9acd32]" strokeWidth={3} />
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault()
                onPauseToggle()
              }}
              onClick={onPauseToggle}
              className="w-20 h-20 bg-[#2d3a2d] hover:bg-[#43523d] active:bg-[#9acd32] rounded-full border-4 border-[#34495e] flex items-center justify-center transition-colors touch-none select-none shadow-lg active:shadow-inner"
              aria-label={paused || lifeLost || gameOver ? "Start/Resume" : "Pause"}
            >
              {paused || lifeLost || gameOver ? (
                <Play className="w-8 h-8 text-[#9acd32] ml-1" strokeWidth={3} fill="#9acd32" />
              ) : (
                <Pause className="w-8 h-8 text-[#9acd32]" strokeWidth={3} />
              )}
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault()
                handleButtonPress("RIGHT")
              }}
              onClick={() => handleButtonPress("RIGHT")}
              className="w-20 h-20 bg-[#34495e] hover:bg-[#43523d] active:bg-[#9acd32] rounded-xl border-4 border-[#2d3a2d] flex items-center justify-center transition-colors touch-none select-none shadow-lg active:shadow-inner"
              aria-label="Move right"
            >
              <ChevronRight className="w-10 h-10 text-[#9acd32]" strokeWidth={3} />
            </button>
          </div>

          {/* Down button */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault()
              handleButtonPress("DOWN")
            }}
            onClick={() => handleButtonPress("DOWN")}
            className="w-20 h-20 bg-[#34495e] hover:bg-[#43523d] active:bg-[#9acd32] rounded-xl border-4 border-[#2d3a2d] flex items-center justify-center transition-colors touch-none select-none shadow-lg active:shadow-inner"
            aria-label="Move down"
          >
            <ChevronDown className="w-10 h-10 text-[#9acd32]" strokeWidth={3} />
          </button>
        </div>

        <div className="mt-4 text-center text-[#9acd32] text-xs opacity-70">NOKIA CONTROLS</div>
      </div>
    </div>
  )
}
