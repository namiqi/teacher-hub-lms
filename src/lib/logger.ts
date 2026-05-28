type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function emit(level: LogLevel, message: string, detail?: unknown): void {
  const prefix = `[TeacherHub]`
  const payload = detail !== undefined ? detail : ''

  switch (level) {
    case 'debug':
      if (import.meta.env.DEV) {
        console.debug(prefix, message, payload)
      }
      break
    case 'info':
      if (import.meta.env.DEV) {
        console.info(prefix, message, payload)
      }
      break
    case 'warn':
      console.warn(prefix, message, payload)
      break
    case 'error':
      console.error(prefix, message, payload)
      break
  }
}

/** Lightweight app logging — dev-friendly console output; errors always visible. */
export const logger = {
  debug: (message: string, detail?: unknown) => emit('debug', message, detail),
  info: (message: string, detail?: unknown) => emit('info', message, detail),
  warn: (message: string, detail?: unknown) => emit('warn', message, detail),
  error: (message: string, detail?: unknown) => emit('error', message, detail),
}
