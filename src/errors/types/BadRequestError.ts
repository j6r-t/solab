import { AppError } from '../AppError'

export class BadRequestError extends AppError {
    public readonly fields?: unknown

    constructor(message = 'Bad request', fields?: unknown) {
        super(message, 400, 'BAD_REQUEST')
        this.fields = fields
    }
}
