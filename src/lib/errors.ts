export class AppError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`)
    }
}

export class ValidationError extends AppError {
    fields: unknown
    constructor(message: string, fields?: unknown) {
        super(message)
        this.fields = fields
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message)
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message)
    }
}
