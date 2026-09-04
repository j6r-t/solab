export class AppError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean
    public readonly errorCode?: string

    constructor(message: string, statusCode: number, errorCode?: string) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.isOperational = true
        this.errorCode = errorCode
    }
}
