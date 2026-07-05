export interface CreateDoctorInput {
    name: string
    phone?: string
    address?: string | null
    specialization?: string | null
}

export interface UpdateDoctorInput {
    name?: string
    phone?: string
    address?: string | null
    specialization?: string | null
}

export interface DoctorResponse {
    id: string
    name: string
    phone: string
    address: string | null
    specialization: string | null
    createdAt: Date
}
