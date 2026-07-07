export interface LoginInput {
    email: string
    password: string
}

export interface ChangePasswordInput {
    currentPassword: string
    newPassword: string
}

export interface LoginResponse {
    success: true
    token: string
    user: UserDto
}

export interface SetupResponse {
    message: string
    user: UserDto
    defaultPassword: string
}

export interface UserDto {
    id: string
    email: string
    name: string | null
    role: string
}
