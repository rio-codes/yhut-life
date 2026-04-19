"use client"

import { useState, useEffect } from "react"
import { useGameSettings } from "@/contexts/game-settings-context"

export function DeveloperPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSettings } = useGameSettings()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1e272e] text-[#9acd32] px-4 py-2 rounded-lg border-2 border-[#34495e] hover:border-[#9acd32] transition-colors font-mono text-sm"
      >
        {isOpen ? "✕" : "⚙️"} DEV
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-[#1e272e] border-2 border-[#34495e] rounded-lg p-4 shadow-2xl min-w-[280px]">
          <h3 className="text-[#9acd32] font-bold mb-4 text-sm">DEVELOPER SETTINGS</h3>

          <div className="space-y-4">
            {/* Invincibility Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[#9acd32] text-xs">Invincibility</label>
              <button
                onClick={() => updateSettings({ invincibility: !settings.invincibility })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.invincibility ? "bg-[#9acd32]" : "bg-[#34495e]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#1e272e] transition-transform ${
                    settings.invincibility ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Debug Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[#9acd32] text-xs">Debug Logging</label>
              <button
                onClick={() => updateSettings({ debugMode: !settings.debugMode })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.debugMode ? "bg-[#9acd32]" : "bg-[#34495e]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#1e272e] transition-transform ${
                    settings.debugMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Lives Setting */}
            <div className="space-y-2">
              <label className="text-[#9acd32] text-xs block">Lives: {settings.lives}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.lives}
                onChange={(e) => updateSettings({ lives: Number.parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#34495e] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9acd32]"
              />
              <div className="flex justify-between text-[#9acd32] text-[10px] opacity-60">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            {/* Base Speed Setting */}
            <div className="space-y-2">
              <label className="text-[#9acd32] text-xs block">Base Speed: {settings.baseSpeed}ms</label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={settings.baseSpeed}
                onChange={(e) => updateSettings({ baseSpeed: Number.parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-[#34495e] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9acd32]"
              />
              <div className="flex justify-between text-[#9acd32] text-[10px] opacity-60">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() =>
                updateSettings({
                  invincibility: false,
                  lives: 3,
                  baseSpeed: 150,
                  debugMode: false,
                })
              }
              className="w-full bg-[#34495e] text-[#9acd32] py-2 rounded border border-[#9acd32] hover:bg-[#9acd32] hover:text-[#1e272e] transition-colors text-xs font-bold"
            >
              RESET TO DEFAULTS
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#34495e]">
            <p className="text-[#9acd32] text-[10px] opacity-60 text-center">
              Press <kbd className="bg-[#34495e] px-1 rounded">D</kbd> to toggle panel
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
