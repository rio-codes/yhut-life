type LogLevel = "info" | "warn" | "error" | "debug"

class DebugLogger {
  private enabled = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }

  log(level: LogLevel, category: string, message: string, data?: any) {
    if (!this.enabled) return

    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1)
    const prefix = `[v0:${category}]`
    const fullMessage = `${timestamp} ${prefix} ${message}`

    switch (level) {
      case "error":
        console.error(fullMessage, data ?? "")
        break
      case "warn":
        console.warn(fullMessage, data ?? "")
        break
      case "debug":
        console.debug(fullMessage, data ?? "")
        break
      default:
        console.log(fullMessage, data ?? "")
    }
  }

  // Convenience methods
  info(category: string, message: string, data?: any) {
    this.log("info", category, message, data)
  }

  warn(category: string, message: string, data?: any) {
    this.log("warn", category, message, data)
  }

  error(category: string, message: string, data?: any) {
    this.log("error", category, message, data)
  }

  debug(category: string, message: string, data?: any) {
    this.log("debug", category, message, data)
  }
}

export const debugLogger = new DebugLogger()
