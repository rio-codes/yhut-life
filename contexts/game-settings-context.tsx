"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface GameSettings {
  invincibility: boolean
  lives: number
  baseSpeed: number
  maxLives: number
  debugMode: boolean
}

interface GameSettingsContextType {
  settings: GameSettings
  currentLives: number
  updateSettings: (updates: Partial<GameSettings>) => void
  resetLives: () => void
  loseLife: () => boolean
  isAlive: boolean
}

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: GameSettings = {
  invincibility: false,
  lives: 3,
  baseSpeed: 150,
  maxLives: 3,
  debugMode: false,
}

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [currentLives, setCurrentLives] = useState(DEFAULT_SETTINGS.lives)

  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      // If lives setting changed, update current lives
      if (updates.lives !== undefined) {
        setCurrentLives(updates.lives)
      }
      return newSettings
    })
  }, [])

  const resetLives = useCallback(() => {
    setCurrentLives(settings.lives)
  }, [settings.lives])

  const loseLife = useCallback((): boolean => {
    if (settings.invincibility) {
      return true // Still alive
    }

    setCurrentLives((prev) => {
      const newLives = prev - 1
      return Math.max(0, newLives)
    })

    return currentLives > 1 // Returns true if still alive after losing a life
  }, [settings.invincibility, currentLives])

  const isAlive = currentLives > 0 || settings.invincibility

  return (
    <GameSettingsContext.Provider
      value={{
        settings,
        currentLives,
        updateSettings,
        resetLives,
        loseLife,
        isAlive,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  )
}

export function useGameSettings() {
  const context = useContext(GameSettingsContext)
  if (context === undefined) {
    throw new Error("useGameSettings must be used within a GameSettingsProvider")
  }
  return context
}
