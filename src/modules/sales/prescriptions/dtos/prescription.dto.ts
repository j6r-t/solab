export interface CreatePrescriptionInput {
    clientId: string
    sphRight: number
    cylRight: number
    axisRight: number
    addRight: number
    pdRight: number
    sphLeft: number
    cylLeft: number
    axisLeft: number
    addLeft: number
    pdLeft: number
    doctorId?: string
    doctorName?: string
    dateWritten?: string
}

export interface UpdatePrescriptionInput {
    sphRight?: number
    cylRight?: number
    axisRight?: number
    addRight?: number
    pdRight?: number
    sphLeft?: number
    cylLeft?: number
    axisLeft?: number
    addLeft?: number
    pdLeft?: number
    doctorId?: string
    doctorName?: string
    dateWritten?: string
}

export interface PrescriptionResponse {
    id: string
    clientId: string
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    doctorId: string | null
    doctor: { id: string; name: string } | null
    dateWritten: Date | null
    client: { name: string; familyName: string; phone: string } | null
    createdAt: Date
}
