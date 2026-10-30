import pino from 'pino'

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

// Create a singleton logger instance
const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: true,
    formatters: {
        level: (label: string) => ({ level: label }),
    },
})

// Wrap pino to keep the (message, context?) call convention the codebase uses;
// pino's native signature is (context, message).
export const logger = {
    info: (message: string, context?: Record<string, unknown>) => pinoLogger.info(context ?? {}, message),
    warn: (message: string, context?: Record<string, unknown>) => pinoLogger.warn(context ?? {}, message),
    error: (message: string, context?: Record<string, unknown>) => pinoLogger.error(context ?? {}, message),
    debug: (message: string, context?: Record<string, unknown>) => pinoLogger.debug(context ?? {}, message),
}
