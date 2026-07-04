export interface LoginResponse {
    success: true
    token: string
    user: { id: string; email: string; name: string }
}

export interface SetupResponse {
    message: string
    user: { id: string; email: string; name: string }
    defaultPassword: string
}
