"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useGameSettings } from "@/contexts/game-settings-context"
import { DeveloperPanel } from "@/components/developer-panel"
import { MobileControls } from "@/components/mobile-controls"
import { debugLogger } from "@/lib/debug-logger"

const GRID_WIDTH = 20
const GRID_HEIGHT = 15
const SPEED_INCREMENT = 5
const MAX_SPEED = 50

type Position = { x: number; y: number }
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

const getNextHeadPosition = (head: Position, direction: Direction): Position => {
  const newHead = { ...head }
  switch (direction) {
    case "UP":
      newHead.y -= 1
      break
    case "DOWN":
      newHead.y += 1
      break
    case "LEFT":
      newHead.x -= 1
      break
    case "RIGHT":
      newHead.x += 1
      break
  }
  return newHead
}

const isOutOfBounds = (pos: Position): boolean => {
  return pos.x < 0 || pos.x >= GRID_WIDTH || pos.y < 0 || pos.y >= GRID_HEIGHT
}

const isPositionInSnake = (pos: Position, snake: Position[], skipHead = false): boolean => {
  const snakeToCheck = skipHead ? snake.slice(1) : snake
  return snakeToCheck.some((segment) => segment.x === pos.x && segment.y === pos.y)
}

const isSamePosition = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x && pos1.y === pos2.y
}

const isValidDirectionChange = (current: Direction, next: Direction): boolean => {
  if (current === "UP" && next === "DOWN") return false
  if (current === "DOWN" && next === "UP") return false
  if (current === "LEFT" && next === "RIGHT") return false
  if (current === "RIGHT" && next === "LEFT") return false
  return true
}

export default function SnakeGame() {
  const { settings, currentLives, resetLives, loseLife } = useGameSettings()

  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 7 },
    { x: 9, y: 7 },
    { x: 8, y: 7 },
  ])
  const [food, setFood] = useState<Position>({ x: 15, y: 7 })
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(true)
  const [lifeLost, setLifeLost] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  const currentDirectionRef = useRef<Direction>("RIGHT")
  const nextDirectionRef = useRef<Direction | null>(null)
  const lastMoveTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const pendingLifeLossRef = useRef(false)
  const directionChangedThisTickRef = useRef(false)

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillator.frequency.value = frequency
    oscillator.type = "square"

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)

    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }, [])

  const handleDirectionChange = useCallback(
    (requestedDirection: Direction) => {
      if (paused || gameOver || lifeLost) return

      if (directionChangedThisTickRef.current) {
        debugLogger.debug("INPUT", `Direction change blocked (already changed this tick): ${requestedDirection}`)
        return
      }

      if (isValidDirectionChange(currentDirectionRef.current, requestedDirection)) {
        nextDirectionRef.current = requestedDirection
        directionChangedThisTickRef.current = true
        debugLogger.debug("INPUT", `Direction queued: ${currentDirectionRef.current} → ${requestedDirection}`)
      } else {
        debugLogger.debug(
          "INPUT",
          `Invalid direction change blocked: ${currentDirectionRef.current} → ${requestedDirection}`,
        )
      }
    },
    [paused, gameOver, lifeLost],
  )

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

    const savedHighScore = localStorage.getItem("snakeHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore, 10))
      debugLogger.info("INIT", `Loaded high score: ${savedHighScore}`)
    }
  }, [])

  useEffect(() => {
    if (pendingLifeLossRef.current) {
      pendingLifeLossRef.current = false
      const stillAlive = loseLife()

      debugLogger.warn("LIVES", `Life lost! Remaining: ${currentLives - 1}`, {
        stillAlive,
        invincibility: settings.invincibility,
      })

      if (!stillAlive) {
        setGameOver(true)
        playSound(100, 0.3)
        debugLogger.error("GAME", "Game Over - No lives remaining")
      } else {
        playSound(200, 0.2)
        setLifeLost(true)
        const resetSnake = [
          { x: 10, y: 7 },
          { x: 9, y: 7 },
          { x: 8, y: 7 },
        ]
        setSnake(resetSnake)
        currentDirectionRef.current = "RIGHT"
        nextDirectionRef.current = null
        directionChangedThisTickRef.current = false
        debugLogger.info("LIVES", "Snake respawned at starting position")
      }
    }
  }, [snake, loseLife, currentLives, settings.invincibility])

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      }
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 7 },
      { x: 9, y: 7 },
      { x: 8, y: 7 },
    ]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    currentDirectionRef.current = "RIGHT"
    nextDirectionRef.current = null
    directionChangedThisTickRef.current = false
    setGameOver(false)
    setPaused(true)
    setLifeLost(false)
    setScore(0)
    resetLives()
    pendingLifeLossRef.current = false
    lastMoveTimeRef.current = 0
    debugLogger.info("GAME", "Game reset to initial state")
  }, [generateFood, resetLives])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault()
        handlePauseToggle()
        return
      }

      if (paused || gameOver || lifeLost) return

      const requestedDirection = (() => {
        switch (e.key) {
          case "ArrowUp":
            return "UP"
          case "ArrowDown":
            return "DOWN"
          case "ArrowLeft":
            return "LEFT"
          case "ArrowRight":
            return "RIGHT"
          default:
            return null
        }
      })()

      if (!requestedDirection) return

      handleDirectionChange(requestedDirection)
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [paused, gameOver, lifeLost])

  const handlePauseToggle = useCallback(() => {
    if (gameOver) {
      resetGame()
    } else if (lifeLost) {
      setLifeLost(false)
      setPaused(false)
      debugLogger.info("INPUT", "Resumed game after life lost")
    } else {
      setPaused((prev) => {
        debugLogger.info("INPUT", prev ? "Game unpaused" : "Game paused")
        return !prev
      })
    }
  }, [gameOver, lifeLost, resetGame])

  useEffect(() => {
    if (paused || gameOver || lifeLost) return

    const getMoveInterval = () => {
      const speedBoost = Math.floor(score / 50) * SPEED_INCREMENT
      return Math.max(settings.baseSpeed - speedBoost, MAX_SPEED)
    }

    let animationFrameId: number
    let lastTimestamp = performance.now()

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimestamp
      const moveInterval = getMoveInterval()

      if (deltaTime >= moveInterval) {
        lastTimestamp = timestamp

        if (nextDirectionRef.current) {
          debugLogger.debug("MOVEMENT", `Direction applied: ${nextDirectionRef.current}`)
          currentDirectionRef.current = nextDirectionRef.current
          nextDirectionRef.current = null
        }

        directionChangedThisTickRef.current = false

        setSnake((prevSnake) => {
          if (prevSnake.length === 0) {
            setGameOver(true)
            debugLogger.error("GAME", "Game Over - Snake length is 0")
            return prevSnake
          }

          const head = prevSnake[0]
          const newHead = getNextHeadPosition(head, currentDirectionRef.current)

          const hitWall = isOutOfBounds(newHead)
          const hitSelf = isPositionInSnake(newHead, prevSnake, true)

          if ((hitWall || hitSelf) && !settings.invincibility) {
            if (hitWall) {
              debugLogger.warn("COLLISION", `Hit wall at position (${newHead.x}, ${newHead.y})`, {
                direction: currentDirectionRef.current,
                snakeLength: prevSnake.length,
              })
            }
            if (hitSelf) {
              debugLogger.warn("COLLISION", `Hit self at position (${newHead.x}, ${newHead.y})`, {
                direction: currentDirectionRef.current,
                snakeLength: prevSnake.length,
              })
            }
            pendingLifeLossRef.current = true
            return prevSnake
          }

          const newSnake = [newHead, ...prevSnake]

          if (isSamePosition(newHead, food)) {
            setScore((prev) => {
              const newScore = prev + 10
              debugLogger.info("GAME", `Food eaten! Score: ${prev} → ${newScore}`, {
                snakeLength: newSnake.length,
                foodPosition: food,
              })
              if (newScore > highScore) {
                setHighScore(newScore)
                localStorage.setItem("snakeHighScore", newScore.toString())
                debugLogger.info("GAME", `New high score: ${newScore}`)
              }
              return newScore
            })

            const newFood = generateFood(newSnake)
            setFood(newFood)
            debugLogger.debug("GAME", `New food generated at (${newFood.x}, ${newFood.y})`)
            playSound(800, 0.1)

            return newSnake
          }

          newSnake.pop()
          return newSnake
        })
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    debugLogger.info("GAME", "Game loop started", {
      baseSpeed: settings.baseSpeed,
      currentSpeed: getMoveInterval(),
      score,
    })

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        debugLogger.debug("GAME", "Game loop stopped")
      }
    }
  }, [paused, gameOver, lifeLost, food, settings.baseSpeed, score, generateFood, highScore, settings.invincibility])

  useEffect(() => {
    debugLogger.setEnabled(settings.debugMode)
    if (settings.debugMode) {
      debugLogger.info("SYSTEM", "Debug logging enabled")
    }
  }, [settings.debugMode])

  return (
    <>
      <DeveloperPanel />

      <div className="min-h-screen flex items-center justify-center bg-[#2d3436] p-4 font-mono">
        <div className="flex flex-col items-center gap-6">
          <div className="bg-[#1e272e] rounded-3xl p-6 shadow-2xl border-4 border-[#34495e]">
            <div className="bg-[#43523d] rounded-t-lg p-3 border-4 border-[#2d3a2d]">
              <div className="flex justify-between items-center text-[#9acd32] text-sm font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#9acd32] rounded-full animate-pulse" />
                  <span>NOKIA</span>
                </div>
                <div className="flex gap-4">
                  <span>SCORE: {score}</span>
                  <span>HI: {highScore}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[#9acd32] text-xs">LIVES:</span>
                <div className="flex gap-1">
                  {Array.from({ length: settings.lives }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${
                        i < currentLives ? "bg-[#9acd32]" : "bg-[#2d3a2d]"
                      } ${settings.invincibility ? "animate-pulse" : ""}`}
                    />
                  ))}
                </div>
                {settings.invincibility && (
                  <span className="text-[#9acd32] text-[10px] ml-2 animate-pulse">∞ INVINCIBLE</span>
                )}
              </div>
            </div>

            <div className="bg-[#9acd32] p-1 border-4 border-[#2d3a2d]">
              <div
                className="bg-[#43523d] relative"
                style={{
                  width: `${GRID_WIDTH * 20}px`,
                  height: `${GRID_HEIGHT * 20}px`,
                }}
              >
                {Array.from({ length: GRID_HEIGHT }).map((_, y) =>
                  Array.from({ length: GRID_WIDTH }).map((_, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="absolute border border-[#4a5d43]/20"
                      style={{
                        left: `${x * 20}px`,
                        top: `${y * 20}px`,
                        width: "20px",
                        height: "20px",
                      }}
                    />
                  )),
                )}

                {snake.map((segment, index) => (
                  <div
                    key={index}
                    className="absolute bg-[#9acd32] transition-all duration-75"
                    style={{
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      width: "20px",
                      height: "20px",
                      boxShadow: index === 0 ? "inset 0 0 4px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    {index === 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-[#43523d] rounded-full" />
                          <div className="w-1 h-1 bg-[#43523d] rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div
                  className="absolute bg-[#9acd32] animate-pulse"
                  style={{
                    left: `${food.x * 20}px`,
                    top: `${food.y * 20}px`,
                    width: "20px",
                    height: "20px",
                    boxShadow: "0 0 8px rgba(154, 205, 50, 0.8)",
                  }}
                />

                {gameOver && (
                  <div className="absolute inset-0 bg-[#43523d]/95 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[#9acd32] text-2xl font-bold mb-4 animate-pulse">GAME OVER</div>
                      <div className="text-[#9acd32] text-lg mb-2">SCORE: {score}</div>
                      {score === highScore && score > 0 && (
                        <div className="text-[#9acd32] text-sm mb-4 animate-pulse">NEW HIGH SCORE!</div>
                      )}
                      <div className="text-[#9acd32] text-sm">PRESS SPACE</div>
                    </div>
                  </div>
                )}

                {lifeLost && !gameOver && (
                  <div className="absolute inset-0 bg-[#43523d]/95 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[#9acd32] text-2xl font-bold mb-4 animate-pulse">LIFE LOST!</div>
                      <div className="text-[#9acd32] text-lg mb-2">
                        {currentLives} {currentLives === 1 ? "LIFE" : "LIVES"} REMAINING
                      </div>
                      <div className="text-[#9acd32] text-sm">PRESS SPACE TO CONTINUE</div>
                    </div>
                  </div>
                )}

                {paused && !gameOver && !lifeLost && (
                  <div className="absolute inset-0 bg-[#43523d]/90 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[#9acd32] text-2xl font-bold mb-4 animate-pulse">PAUSED</div>
                      <div className="text-[#9acd32] text-sm">PRESS SPACE TO START</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#43523d] rounded-b-lg p-3 border-4 border-t-0 border-[#2d3a2d]">
              <div className="text-[#9acd32] text-xs text-center opacity-70">USE ARROW KEYS • SPACE TO PAUSE</div>
            </div>
          </div>

          <div className="text-[#9acd32] text-center max-w-md space-y-2 text-sm">
            <p className="font-bold">CLASSIC NOKIA SNAKE</p>
            <p className="opacity-80">Eat the food to grow longer. Don't hit the walls or yourself!</p>
            <p className="opacity-60 text-xs">Speed increases as you score more points</p>
          </div>

          <MobileControls
            onDirectionChange={handleDirectionChange}
            onPauseToggle={handlePauseToggle}
            gameOver={gameOver}
            lifeLost={lifeLost}
            paused={paused}
          />
        </div>
      </div>
    </>
  )
}
