type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: Record<string, unknown>
}

class Logger {
    private format(level: LogLevel, message: string, context?: Record<string, unknown>): string {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
        }
        if (context && Object.keys(context).length > 0) {
            entry.context = context
        }
        return JSON.stringify(entry)
    }

    info(message: string, context?: Record<string, unknown>) {
        console.log(this.format('info', message, context))
    }

    warn(message: string, context?: Record<string, unknown>) {
        console.warn(this.format('warn', message, context))
    }

    error(message: string, context?: Record<string, unknown>) {
        console.error(this.format('error', message, context))
    }

    debug(message: string, context?: Record<string, unknown>) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.format('debug', message, context))
        }
    }
}

export const logger = new Logger()
